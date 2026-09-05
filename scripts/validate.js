import assert from "node:assert/strict";
import { categories, confidences, safeSourceUrl, statuses } from "../js/model.js";

export function validateDate( value ) {
	assert.match( value, /^\d{4}-\d{2}-\d{2}$/ );
	assert.equal( new Date( `${ value }T00:00:00Z` ).toISOString().slice( 0, 10 ), value );
}

function validateUniqueIds( entries ) {
	assert.ok( Array.isArray( entries ) && entries.length > 0 );
	assert.equal( new Set( entries.map( ( entry ) => entry.id ) ).size, entries.length );
	for ( const entry of entries ) {
		assert.match( entry.id, /^[a-z0-9-]+$/ );
	}
}

export function validateSnapshot( snapshot ) {
	assert.equal( snapshot.schemaVersion, 1 );
	validateDate( snapshot.id );
	validateDate( snapshot.observedAt );
	assert.equal( snapshot.id, snapshot.observedAt );
	assert.ok( snapshot.title && snapshot.summary );
	validateUniqueIds( snapshot.claims );
	validateUniqueIds( snapshot.sources );
	validateUniqueIds( snapshot.images );
	const claimIds  = new Set( snapshot.claims.map( ( claim ) => claim.id ) );
	const sourceIds = new Set( snapshot.sources.map( ( source ) => source.id ) );
	assert.ok( claimIds.has( snapshot.leadClaimId ) );
	for ( const source of snapshot.sources ) {
		assert.ok( safeSourceUrl( source.url ) );
		assert.ok( source.publisher && source.title && source.provenance );
		assert.ok( [ "published", "updated" ].includes( source.dateType ) );
		assert.ok( [ "secondary", "original-report", "official" ].includes( source.kind ) );
		validateDate( source.date );
		validateDate( source.accessedAt );
		assert.ok( source.date <= source.accessedAt && source.accessedAt <= snapshot.observedAt );
	}
	for ( const claim of snapshot.claims ) {
		assert.ok( categories.includes( claim.category ) );
		assert.ok( statuses.includes( claim.status ) );
		assert.ok( confidences.includes( claim.confidence ) );
		assert.ok( claim.title && claim.summary && claim.assessment );
		validateDate( claim.sourceDate );
		validateDate( claim.firstObservedAt );
		assert.ok( claim.firstObservedAt <= snapshot.observedAt && claim.sourceDate <= snapshot.observedAt );
		assert.ok( claim.evidence.length > 0 );
		assert.equal( new Set( claim.evidence.map( ( evidence ) => evidence.sourceId ) ).size, claim.evidence.length );
		for ( const evidence of claim.evidence ) {
			assert.ok( sourceIds.has( evidence.sourceId ) );
			assert.ok( [ "supports", "contradicts", "context" ].includes( evidence.relation ) );
		}
		assert.ok( claim.evidence.some( ( evidence ) => snapshot.sources.find( ( source ) => source.id === evidence.sourceId ).date === claim.sourceDate ) );
		assert.ok( Array.isArray( claim.related ) );
		for ( const id of claim.related ) {
			assert.ok( claimIds.has( id ) && id !== claim.id );
		}
		if ( claim.status === "superseded" ) {
			assert.ok( claimIds.has( claim.supersededBy ) && claim.supersededBy !== claim.id );
		} else {
			assert.equal( claim.supersededBy, null );
		}
		if ( claim.status === "disputed" ) {
			assert.ok( claim.related.length > 0 || claim.evidence.some( ( evidence ) => evidence.relation === "contradicts" ) );
		}
		if ( claim.status === "confirmed" ) {
			assert.ok( claim.evidence.some( ( evidence ) => evidence.relation === "supports" && snapshot.sources.find( ( source ) => source.id === evidence.sourceId ).kind === "official" ) );
		}
	}
	for ( const image of snapshot.images ) {
		assert.match( image.path, /^assets\/[a-z0-9-]+\.svg$/ );
		assert.ok( image.title && image.creator && image.alt && image.disclaimer );
		assert.equal( image.kind, "original-illustration" );
		assert.equal( image.license, "CC0-1.0" );
		assert.equal( image.sourceUrl, null );
	}
	return snapshot;
}
