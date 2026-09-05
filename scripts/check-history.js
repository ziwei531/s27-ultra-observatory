import { execFileSync } from "node:child_process";

const revisions = execFileSync( "git", [ "rev-list", "--count", "HEAD" ], { encoding: "utf8" } ).trim();
if ( Number( revisions ) > 1 ) {
	const previous = execFileSync( "git", [ "ls-tree", "-r", "--name-only", "HEAD^", "data/snapshots" ], { encoding: "utf8" } ).trim().split( "\n" ).filter( Boolean );
	for ( const path of previous ) {
		const before = execFileSync( "git", [ "show", `HEAD^:${ path }` ] );
		const after  = execFileSync( "git", [ "show", `HEAD:${ path }` ] );
		if ( !before.equals( after ) ) {
			throw new Error( `Historical snapshot changed: ${ path }` );
		}
	}
}
console.log( "Historical snapshots preserved" );
