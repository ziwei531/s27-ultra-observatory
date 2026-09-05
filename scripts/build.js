import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";

const version = process.env.GITHUB_SHA ?? "local";
if ( !/^[a-zA-Z0-9-]+$/.test( version ) ) {
	throw new Error( "Unsafe build version" );
}
await rm( "dist", { recursive: true, force: true } );
await mkdir( "dist", { recursive: true } );
for ( const directory of [ "styles", "js", "assets", "data" ] ) {
	await cp( directory, `dist/${ directory }`, { recursive: true } );
}
const shell = await readFile( "index.html", "utf8" );
const view  = await readFile( "views/archive.html", "utf8" );
await writeFile( "dist/index.html", shell.replace( "__VIEW__", view ).replaceAll( "__BUILD_VERSION__", version ) );
const app = await readFile( "dist/js/app.js", "utf8" );
await writeFile( "dist/js/app.js", app.replaceAll( "__BUILD_VERSION__", version ) );
await writeFile( "dist/.nojekyll", "" );
await writeFile( "dist/build.json", JSON.stringify( { commit: version } ) );
console.log( `Built explicit Pages artifact: ${ version }` );
