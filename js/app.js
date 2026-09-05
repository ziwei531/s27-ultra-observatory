import { filterReports, formatDate, readFilters, safeSourceUrl } from "./model.js?v=__BUILD_VERSION__";

const elements = Object.fromEntries( [
	  "filters", "search", "sort", "result-count", "report-list", "empty", "load-error"
].map( ( id ) => [ id, document.getElementById( id ) ] ) );
let currentSnapshot;

function createElement( tag, text, className = "" ) {
	const element = document.createElement( tag );
	element.textContent = text;
	element.className   = className;
	return element;
}

async function fetchJson( path ) {
	const response = await fetch( path, { cache: "no-cache" } );
	if ( !response.ok ) {
		throw new Error( "Archive request failed" );
	}
	return response.json();
}

function renderSources( report ) {
	const details = document.createElement( "details" );
	const summary = createElement( "summary", `${ report.evidence.length } source${ report.evidence.length === 1 ? "" : "s" }` );
	const list = document.createElement( "ol" );
	for ( const evidence of report.evidence ) {
		const source = currentSnapshot.sources.find( ( entry ) => entry.id === evidence.sourceId );
		const item   = document.createElement( "li" );
		const link   = createElement( "a", `${ source.publisher } — ${ source.title } ↗` );
		const url    = safeSourceUrl( source.url );
		if ( url ) {
			link.href = url;
			link.rel  = "noreferrer noopener";
		}
		item.append( link, createElement( "p", `${ formatDate( source.date ) } · ${ source.kind.replaceAll( "-", " " ) }`, "source-meta" ) );
		list.append( item );
	}
	details.append( summary, list );
	return details;
}

function renderReport( report ) {
	const article = createElement( "article", "", "report" );
	article.id    = `report-${ report.id }`;
	const meta = createElement( "div", "", "report-meta" );
	const time = createElement( "time", `Source date: ${ formatDate( report.sourceDate ) }` );
	time.dateTime = report.sourceDate;
	meta.append( time, createElement( "span", `${ report.evidence.length } source${ report.evidence.length === 1 ? "" : "s" }` ) );
	article.append( meta, createElement( "h3", report.title ), createElement( "p", report.summary, "report-summary" ), renderSources( report ) );
	return article;
}

function getFilters() {
	return { q: elements.search.value, sort: elements.sort.value };
}

function syncUrl() {
	const url = new URL( location.href );
	url.search = "";
	for ( const [ key, value ] of Object.entries( getFilters() ) ) {
		if ( value && value !== "newest" ) {
			url.searchParams.set( key, value );
		}
	}
	history.replaceState( null, "", url );
}

function renderResults() {
	const reports = filterReports( currentSnapshot, getFilters() );
	elements[ "report-list" ].replaceChildren( ...reports.map( ( report ) => renderReport( report ) ) );
	elements[ "result-count" ].textContent = `${ reports.length } report${ reports.length === 1 ? "" : "s" }`;
	elements.empty.hidden = reports.length !== 0;
	syncUrl();
}

function restoreLocation() {
	const filters = readFilters( location.search );
	elements.search.value = filters.q;
	elements.sort.value   = filters.sort;
	renderResults();
}

async function initializeArchive() {
	try {
		const catalog = await fetchJson( "data/index.json" );
		const entry   = catalog.snapshots.find( ( snapshot ) => snapshot.id === catalog.latest );
		const snapshot = await fetchJson( entry.path );
		const timeline = await fetchJson( "data/early-timeline.json" );
		currentSnapshot = {
			...snapshot
			, claims : [ ...timeline.reports, ...snapshot.claims ]
			, sources: [ ...timeline.sources, ...snapshot.sources ]
		};
		restoreLocation();
		elements.filters.addEventListener( "submit", ( event ) => event.preventDefault() );
		elements.search.addEventListener( "input", renderResults );
		elements.sort.addEventListener( "change", renderResults );
		window.addEventListener( "popstate", restoreLocation );
	} catch {
		elements[ "load-error" ].textContent = "The reports could not be loaded. Reload to try again, or open the JSON data directly.";
		elements[ "load-error" ].hidden = false;
		elements[ "result-count" ].textContent = "Reports unavailable";
	}
}

initializeArchive();
