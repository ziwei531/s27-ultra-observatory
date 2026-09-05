import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { validateDate, validateSnapshot } from "../scripts/validate.js";
import { categories, filterClaims, formatDate, readFilters, safeSourceUrl } from "../js/model.js";

const catalog = JSON.parse( await readFile( "data/index.json", "utf8" ) );
const snapshots = await Promise.all( catalog.snapshots.map( async ( entry ) => JSON.parse( await readFile( entry.path, "utf8" ) ) ) );
const snapshot = snapshots.at( -1 );
const defaultFilters = { q: "", category: "all", status: "all", sort: "newest" };

test( "catalog hashes, dates, membership and ordering are valid", async () => {
	assert.equal( catalog.schemaVersion, 1 );
	assert.equal( catalog.latest, catalog.snapshots.at( -1 ).id );
	assert.equal( new Set( catalog.snapshots.map( ( entry ) => entry.id ) ).size, catalog.snapshots.length );
	assert.deepEqual( catalog.snapshots.map( ( entry ) => entry.id ), catalog.snapshots.map( ( entry ) => entry.id ).sort() );
	assert.deepEqual( ( await readdir( "data/snapshots" ) ).sort(), catalog.snapshots.map( ( entry ) => `${ entry.id }.json` ).sort() );
	for ( const entry of catalog.snapshots ) {
		validateDate( entry.id );
		assert.equal( entry.path, `data/snapshots/${ entry.id }.json` );
		const text = await readFile( entry.path );
		assert.equal( createHash( "sha256" ).update( text ).digest( "hex" ), entry.sha256 );
		const record = JSON.parse( text );
		assert.equal( entry.id, record.id );
		assert.equal( entry.title, record.title );
	}
	assert.deepEqual( catalog.checks.map( ( check ) => check.date ), catalog.checks.map( ( check ) => check.date ).sort() );
	assert.equal( new Set( catalog.checks.map( ( check ) => check.date ) ).size, catalog.checks.length );
	for ( const check of catalog.checks ) {
		validateDate( check.date );
		assert.ok( [ "baseline", "no-change", "updated" ].includes( check.outcome ) );
		assert.ok( check.notes.length >= 30 );
		assert.ok( check.date <= new Date( Date.now() + 8 * 60 * 60 * 1000 ).toISOString().slice( 0, 10 ) );
	}
} );

test( "every snapshot and original image passes structural validation", async () => {
	for ( const record of snapshots ) {
		validateSnapshot( record );
		for ( const image of record.images ) {
			assert.match( await readFile( image.path, "utf8" ), /<svg/ );
		}
	}
} );

test( "baseline retains actual collected counts and disputes", () => {
	const baseline = snapshots.find( ( record ) => record.id === "2026-09-06" );
	assert.equal( baseline.claims.length, 10 );
	assert.equal( baseline.sources.length, 8 );
	assert.equal( baseline.claims.filter( ( claim ) => claim.status === "disputed" ).length, 4 );
	assert.ok( baseline.claims.every( ( claim ) => claim.firstObservedAt === "2026-09-06" ) );
} );

test( "filters search claims and publishers, combine categories and sort source dates", () => {
	assert.ok( filterClaims( snapshot, { ...defaultFilters, q: "EXYNOS" } ).length > 0 );
	assert.ok( filterClaims( snapshot, { ...defaultFilters, q: "galaxyclub" } ).length > 0 );
	assert.equal( filterClaims( snapshot, { ...defaultFilters, q: "not-a-real-query-xyz" } ).length, 0 );
	for ( const category of categories ) {
		assert.ok( filterClaims( snapshot, { ...defaultFilters, category } ).every( ( claim ) => claim.category === category ) );
	}
	const newest = filterClaims( snapshot, defaultFilters );
	const oldest = filterClaims( snapshot, { ...defaultFilters, sort: "oldest" } );
	assert.ok( newest[ 0 ].sourceDate >= newest.at( -1 ).sourceDate );
	assert.ok( oldest[ 0 ].sourceDate <= oldest.at( -1 ).sourceDate );
} );

test( "hostile URLs and unknown filter states are rejected", () => {
	for ( const url of [ "javascript:alert(1)", "data:text/html,bad", "http://example.com", "https://user:password@example.com", "not a URL" ] ) {
		assert.equal( safeSourceUrl( url ), null );
	}
	assert.equal( safeSourceUrl( "https://example.com/source" ), "https://example.com/source" );
	assert.deepEqual( readFilters( "?category=Fake&status=Fake&sort=wrong" ), defaultFilters );
	assert.equal( readFilters( `?q=${ "a".repeat( 400 ) }` ).q.length, 300 );
	assert.equal( formatDate( "2026-09-06" ), "6 Sept 2026" );
} );

test( "validator catches dangling evidence, unsafe image paths and invalid dates", () => {
	for ( const mutate of [
		  ( record ) => { record.claims[ 0 ].evidence[ 0 ].sourceId = "missing"; }
		, ( record ) => { record.images[ 0 ].path = "../secret.svg"; }
		, ( record ) => { record.claims[ 0 ].confidence = "certain"; }
		, ( record ) => { record.claims[ 0 ].status = "confirmed"; }
		, ( record ) => { record.claims[ 0 ].status = "superseded"; }
		, ( record ) => { record.sources[ 0 ].date = "2026-02-30"; }
	] ) {
		const copy = structuredClone( snapshot );
		mutate( copy );
		assert.throws( () => validateSnapshot( copy ) );
	}
} );

test( "superseded rendering model supports explicit replacements (test-only fixture)", () => {
	const copy = structuredClone( snapshot );
	copy.claims[ 0 ].status = "superseded";
	copy.claims[ 0 ].supersededBy = copy.claims[ 1 ].id;
	validateSnapshot( copy );
	assert.equal( filterClaims( copy, { ...defaultFilters, status: "superseded" } ).length, 1 );
} );

test( "application uses safe DOM sinks and project JavaScript conventions", async () => {
	for ( const folder of [ "js", "scripts", "test" ] ) {
		for ( const name of ( await readdir( folder ) ).filter( ( file ) => file.endsWith( ".js" ) ) ) {
			const text = await readFile( `${ folder }/${ name }`, "utf8" );
			assert.doesNotMatch( text, /^ +\S/m, `${ folder }/${ name }: space indentation` );
			assert.doesNotMatch( text, /[ \t]+$/m, `${ folder }/${ name }: trailing whitespace` );
			assert.doesNotMatch( text, /\bvar\s+\w/ );
			assert.doesNotMatch( text, /(?:const|let)\s+\w+\s*=\s*\([^;]*?\)\s*=>/ );
		}
	}
	const app = await readFile( "js/app.js", "utf8" );
	assert.doesNotMatch( app, /\.innerHTML|insertAdjacentHTML|document\.write|\beval\s*\(/ );
	assert.match( app, /^\t+, /m );
} );
