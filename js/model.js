export const categories = [ "Design", "Cameras", "Battery", "Performance", "Display", "Charging" ];
export const statuses   = [ "reported", "disputed", "superseded", "confirmed" ];
export const confidences = [ "low", "medium", "high" ];

export function formatDate( date ) {
	return new Intl.DateTimeFormat( "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" } ).format( new Date( `${ date }T00:00:00Z` ) );
}

export function filterClaims( snapshot, filters ) {
	const query = filters.q.trim().toLocaleLowerCase( "en" );
	return snapshot.claims.filter( ( claim ) => {
		const publishers = claim.evidence.map( ( evidence ) => snapshot.sources.find( ( source ) => source.id === evidence.sourceId ).publisher ).join( " " );
		const searchable = `${ claim.title } ${ claim.summary } ${ claim.assessment } ${ claim.category } ${ publishers }`.toLocaleLowerCase( "en" );
		return ( filters.category === "all" || claim.category === filters.category )
			&& ( filters.status === "all" || claim.status === filters.status )
			&& ( !query || searchable.includes( query ) );
	} ).sort( ( first, second ) => {
		const chronological = first.sourceDate.localeCompare( second.sourceDate );
		return ( filters.sort === "oldest" ? chronological : -chronological ) || first.id.localeCompare( second.id );
	} );
}

export function readFilters( search ) {
	const parameters = new URLSearchParams( search );
	return {
		  q       : ( parameters.get( "q" ) ?? "" ).slice( 0, 300 )
		, category: categories.includes( parameters.get( "category" ) ) ? parameters.get( "category" ) : "all"
		, status  : statuses.includes( parameters.get( "status" ) ) ? parameters.get( "status" ) : "all"
		, sort    : parameters.get( "sort" ) === "oldest" ? "oldest" : "newest"
	};
}

export function safeSourceUrl( url ) {
	try {
		const parsed = new URL( url );
		return parsed.protocol === "https:" && !parsed.username && !parsed.password ? parsed.href : null;
	} catch {
		return null;
	}
}
