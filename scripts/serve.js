import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";

const root = resolve( "dist" );
const port = Number( process.env.PORT ?? 4173 );
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml" };
const server = createServer( async ( request, response ) => {
	try {
		const url      = new URL( request.url, "http://localhost" );
		const relative = decodeURIComponent( url.pathname ).replace( /^\/galaxy-leak-observatory(?=\/)/, "" );
		const path     = resolve( root, `.${ relative.endsWith( "/" ) ? `${ relative }index.html` : relative }` );
		if ( !path.startsWith( `${ root }${ sep }` ) ) {
			response.writeHead( 403 ).end();
			return;
		}
		const content = await readFile( path );
		response.writeHead( 200, { "Content-Type": mime[ extname( path ) ] ?? "application/octet-stream", "Cache-Control": "no-store" } );
		response.end( content );
	} catch {
		response.writeHead( 404 ).end( "Not found" );
	}
} );
server.listen( port, "127.0.0.1", () => console.log( `Ready: http://127.0.0.1:${ port }/galaxy-leak-observatory/` ) );
