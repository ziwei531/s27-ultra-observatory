import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const script = resolve( "scripts/weekly.js" );
const original = JSON.parse( await readFile( "data/snapshots/2026-09-06.json", "utf8" ) );

async function createFixture() {
	await mkdir( ".work", { recursive: true } );
	const directory = await mkdtemp( ".work/weekly-test-" );
	await mkdir( `${ directory }/data/snapshots`, { recursive: true } );
	const record = structuredClone( original );
	record.id = "2026-09-04";
	record.observedAt = record.id;
	record.claims.forEach( ( claim ) => { claim.firstObservedAt = record.id; } );
	record.sources.forEach( ( source ) => { source.accessedAt = record.id; } );
	await writeFile( `${ directory }/data/snapshots/${ record.id }.json`, JSON.stringify( record ) );
	await writeFile( `${ directory }/data/index.json`, JSON.stringify( { schemaVersion: 1, latest: record.id, snapshots: [ { id: record.id, path: `data/snapshots/${ record.id }.json` } ], checks: [ { date: record.id, outcome: "baseline", notes: "Synthetic fixture only, never deployed." } ] } ) );
	return directory;
}

function runWeekly( directory, ...args ) {
	return spawnSync( process.execPath, [ script, ...args ], { cwd: directory, encoding: "utf8" } );
}

test( "weekly helper creates a draft, refuses unchanged publication, then publishes a sealed change", async () => {
	const directory = await createFixture();
	try {
		assert.equal( runWeekly( directory, "2026-09-05" ).status, 0 );
		const draftPath = `${ directory }/.work/2026-09-05.json`;
		const draft = JSON.parse( await readFile( draftPath, "utf8" ) );
		draft.title = "Synthetic changed record";
		draft.summary = "Testing publication, not research.";
		await writeFile( draftPath, JSON.stringify( draft ) );
		const notes = "--notes=Synthetic test only: reviewed fixture content; do not deploy.";
		assert.notEqual( runWeekly( directory, "2026-09-05", "--publish", notes ).status, 0 );
		draft.claims[ 0 ].assessment = "Synthetic changed assessment used only in helper tests.";
		await writeFile( draftPath, JSON.stringify( draft ) );
		const result = runWeekly( directory, "2026-09-05", "--publish", notes );
		assert.equal( result.status, 0, result.stderr );
		const catalog = JSON.parse( await readFile( `${ directory }/data/index.json`, "utf8" ) );
		assert.equal( catalog.latest, "2026-09-05" );
		assert.equal( catalog.snapshots.length, 2 );
		assert.match( catalog.snapshots.at( -1 ).sha256, /^[a-f0-9]{64}$/ );
		assert.notEqual( runWeekly( directory, "2026-09-05", "--publish", notes ).status, 0 );
	} finally {
		await rm( directory, { recursive: true, force: true } );
	}
} );

test( "no-change review preserves snapshots and future dates fail", async () => {
	const directory = await createFixture();
	try {
		const path = `${ directory }/data/snapshots/2026-09-04.json`;
		const before = await readFile( path, "utf8" );
		assert.equal( runWeekly( directory, "2026-09-05", "--no-change", "--notes=No material changes in this synthetic fixture review." ).status, 0 );
		const catalog = JSON.parse( await readFile( `${ directory }/data/index.json`, "utf8" ) );
		assert.equal( catalog.latest, "2026-09-04" );
		assert.equal( catalog.snapshots.length, 1 );
		assert.equal( catalog.checks.at( -1 ).outcome, "no-change" );
		assert.equal( await readFile( path, "utf8" ), before );
		assert.notEqual( runWeekly( directory, "9999-01-01" ).status, 0 );
		assert.notEqual( runWeekly( directory, "bad-date" ).status, 0 );
	} finally {
		await rm( directory, { recursive: true, force: true } );
	}
} );
