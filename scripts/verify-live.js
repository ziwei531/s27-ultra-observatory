import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const base = process.env.SITE_URL ?? "https://ziwei531.github.io/s27-ultra-observatory/";
async function fetchLive( path ) {
	const response = await fetch( new URL( path, base ), { cache: "no-cache" } );
	assert.equal( response.status, 200, path );
	return response;
}
const build = await ( await fetchLive( "build.json" ) ).json();
if ( process.env.GITHUB_SHA ) {
	assert.equal( build.commit, process.env.GITHUB_SHA );
}
const html = await ( await fetchLive( "index.html" ) ).text();
assert.ok( html.includes( `site.css?v=${ build.commit }` ) );
assert.ok( html.includes( `app.js?v=${ build.commit }` ) );
assert.ok( !html.includes( "__BUILD_VERSION__" ) && !html.includes( "__VIEW__" ) );
const text = await ( await fetchLive( "data/index.json" ) ).text();
assert.equal( text, await readFile( "data/index.json", "utf8" ) );
const catalog = JSON.parse( text );
for ( const entry of catalog.snapshots ) {
	assert.equal( await ( await fetchLive( entry.path ) ).text(), await readFile( entry.path, "utf8" ) );
}
for ( const path of [ "styles/site.css", "js/app.js", "js/model.js", "assets/optical-study.svg", "assets/favicon.svg" ] ) {
	await fetchLive( path );
}
console.log( `LIVE VERIFIED: ${ base } commit=${ build.commit }; HTML, all snapshots and five assets passed` );
