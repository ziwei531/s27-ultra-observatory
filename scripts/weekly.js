import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { validateDate, validateSnapshot } from "./validate.js";

const [ date, ...argumentsList ] = process.argv.slice( 2 );
if ( !date ) {
	console.error( "Usage: npm run review:week -- YYYY-MM-DD [--publish|--no-change] [--model=s27-ultra] --notes=review-evidence" );
	process.exit( 1 );
}
const action = argumentsList.find( ( argument ) => [ "--publish", "--no-change" ].includes( argument ) );
validateDate( date );
const today = new Intl.DateTimeFormat( "en-CA", { timeZone: "Asia/Kuala_Lumpur", year: "numeric", month: "2-digit", day: "2-digit" } ).format( new Date() );
if ( date > today ) {
	throw new Error( "A future review date is not evidence" );
}
const catalog   = JSON.parse( await readFile( "data/index.json", "utf8" ) );
const modelId   = argumentsList.find( ( argument ) => argument.startsWith( "--model=" ) )?.slice( 8 ) ?? catalog.defaultModel;
const model     = catalog.models.find( ( entry ) => entry.id === modelId );
if ( !model ) {
	throw new Error( "Unknown Galaxy model" );
}
const manifest = JSON.parse( await readFile( model.manifest, "utf8" ) );
const entry    = manifest.snapshots.find( ( snapshot ) => snapshot.id === manifest.latest );
const latest   = JSON.parse( await readFile( entry.path, "utf8" ) );
const draftPath = `.work/${ modelId }-${ date }.json`;
if ( !action ) {
	if ( date <= manifest.latest ) {
		throw new Error( "Draft date must be later than the latest snapshot" );
	}
	await mkdir( ".work", { recursive: true } );
	const draft = { ...latest, id: date, observedAt: date, title: "Editorial title required", summary: "Editorial change summary required" };
	await writeFile( draftPath, `${ JSON.stringify( draft, null, "\t" ) }\n`, { flag: "wx" } );
	console.log( `Draft created: ${ draftPath }. This is a COPY, not new evidence. Read docs/UPDATING.md; research, edit and verify before --publish.` );
	process.exit( 0 );
}
if ( ![ "--publish", "--no-change" ].includes( action ) ) {
	throw new Error( "Unknown action" );
}
const notes = argumentsList.find( ( argument ) => argument.startsWith( "--notes=" ) )?.slice( 8 );
if ( !notes || notes.length < 30 || date <= manifest.checks.at( -1 ).date ) {
	throw new Error( "Supply meaningful review notes and a date after the last completed check" );
}
if ( action === "--publish" ) {
	const draft = validateSnapshot( JSON.parse( await readFile( draftPath, "utf8" ) ) );
	if ( draft.id !== date || date <= manifest.latest || draft.title === "Editorial title required" || draft.summary === "Editorial change summary required" ) {
		throw new Error( "Finalize draft metadata before publishing" );
	}
	const material = [ "claims", "sources", "images" ];
	if ( material.every( ( key ) => JSON.stringify( draft[ key ] ) === JSON.stringify( latest[ key ] ) ) ) {
		throw new Error( "No material content change: use --no-change instead" );
	}
	const text = `${ JSON.stringify( draft, null, "\t" ) }\n`;
	const directory = modelId === catalog.defaultModel ? "data/snapshots" : `data/models/${ modelId }/snapshots`;
	const path = `${ directory }/${ date }.json`;
	await mkdir( directory, { recursive: true } );
	await writeFile( path, text, { flag: "wx" } );
	manifest.snapshots.push( { id: date, path, title: draft.title, sha256: createHash( "sha256" ).update( text ).digest( "hex" ) } );
	manifest.latest = date;
}
manifest.checks.push( { date, outcome: action === "--publish" ? "updated" : "no-change", notes } );
await writeFile( `${ model.manifest }.next`, `${ JSON.stringify( manifest, null, "\t" ) }\n` );
await rename( `${ model.manifest }.next`, model.manifest );
console.log( `Recorded local ${ model.shortLabel } review. Not pushed or deployed. Run npm run build and the direct checks, review the diff, commit and push main.` );
