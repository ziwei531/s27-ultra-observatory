export const categories = [ "Design", "Cameras", "Battery", "Performance", "Display", "Charging" ];
export const statuses   = [ "reported", "disputed", "superseded", "confirmed" ];
export const confidences = [ "low", "medium", "high" ];

export function formatDate( date ) {
	return new Intl.DateTimeFormat( "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" } ).format( new Date( `${ date }T00:00:00Z` ) );
}

export function filterReports( snapshot, filters ) {
	const query = filters.q.trim().toLocaleLowerCase( "en" );
	return snapshot.claims.filter( ( report ) => {
		const searchable = `${ report.title } ${ report.summary }`.toLocaleLowerCase( "en" );
		return !query || searchable.includes( query );
	} ).sort( ( first, second ) => {
		const chronological = first.sourceDate.localeCompare( second.sourceDate );
		return ( filters.sort === "oldest" ? chronological : -chronological ) || first.id.localeCompare( second.id );
	} );
}

export function readFilters( search ) {
	const parameters = new URLSearchParams( search );
	return {
		  q   : ( parameters.get( "q" ) ?? "" ).slice( 0, 300 )
		, sort: parameters.get( "sort" ) === "oldest" ? "oldest" : "newest"
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
