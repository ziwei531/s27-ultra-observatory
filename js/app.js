import { categories, filterClaims, formatDate, readFilters, safeSourceUrl } from "./model.js?v=__BUILD_VERSION__";

const elements = Object.fromEntries( [
	  "snapshot", "snapshot-note", "snapshot-download", "edition", "collection-count", "check-date"
	, "load-error", "filters", "search", "category", "status", "sort", "reset", "result-count"
	, "claims", "empty", "check-log", "artwork", "art-credit"
].map( ( id ) => [ id, document.getElementById( id ) ] ) );
const snapshots = new Map();
let catalog;
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

function renderEvidence( claim ) {
	const details = document.createElement( "details" );
	details.append( createElement( "summary", `Evidence & assessment · ${ claim.evidence.length } source${ claim.evidence.length === 1 ? "" : "s" }` ) );
	const body = createElement( "div", "", "evidence-body" );
	body.append( createElement( "h4", "Editorial assessment" ), createElement( "p", claim.assessment ) );
	body.append( createElement( "p", `First collected ${ formatDate( claim.firstObservedAt ) } · Confidence: ${ claim.confidence }`, "source-meta" ) );
	const list = document.createElement( "ol" );
	for ( const evidence of claim.evidence ) {
		const source = currentSnapshot.sources.find( ( entry ) => entry.id === evidence.sourceId );
		const item   = document.createElement( "li" );
		const link   = createElement( "a", `${ source.publisher } — ${ source.title } ↗` );
		const url    = safeSourceUrl( source.url );
		if ( url ) {
			link.href = url;
			link.rel  = "noreferrer noopener";
		}
		item.append( link );
		item.append( createElement( "p", `${ source.dateType } ${ formatDate( source.date ) } · ${ evidence.relation } · ${ source.kind.replaceAll( "-", " " ) }`, "source-meta" ) );
		item.append( createElement( "p", source.provenance, "provenance" ) );
		item.append( createElement( "p", `Accessed ${ formatDate( source.accessedAt ) }`, "source-meta" ) );
		list.append( item );
	}
	body.append( list );
	const related = createElement( "div", "", "related" );
	for ( const id of new Set( [ ...claim.related, claim.supersededBy ].filter( Boolean ) ) ) {
		const target = currentSnapshot.claims.find( ( entry ) => entry.id === id );
		const link   = createElement( "a", `${ id === claim.supersededBy ? "Replaced by" : "Related" }: ${ target.title } →` );
		link.href    = `#claim-${ id }`;
		related.append( link );
	}
	body.append( related );
	details.append( body );
	return details;
}

function renderClaim( claim ) {
	const article = createElement( "article", "", "claim" );
	article.id    = `claim-${ claim.id }`;
	const meta    = createElement( "div", "", "claim-meta" );
	const time    = createElement( "time", `Source ${ formatDate( claim.sourceDate ) }` );
	time.dateTime = claim.sourceDate;
	meta.append( createElement( "span", claim.category.toUpperCase() ), createElement( "span", claim.status, `badge ${ claim.status }` ), createElement( "span", `${ claim.confidence } confidence` ), time );
	const title   = document.createElement( "h3" );
	const link    = createElement( "a", claim.title );
	link.href     = `#${ article.id }`;
	title.append( link );
	article.append( meta, title, createElement( "p", claim.summary, "claim-summary" ), renderEvidence( claim ) );
	return article;
}

function getFilters() {
	return { q: elements.search.value, category: elements.category.value, status: elements.status.value, sort: elements.sort.value };
}

function syncUrl( push = false ) {
	const url     = new URL( location.href );
	const filters = getFilters();
	url.search    = "";
	url.searchParams.set( "snapshot", currentSnapshot.id );
	for ( const [ key, value ] of Object.entries( filters ) ) {
		if ( value && value !== "all" && value !== "newest" ) {
			url.searchParams.set( key, value );
		}
	}
	if ( push ) {
		history.pushState( null, "", url );
		return;
	}
	history.replaceState( null, "", url );
}

function renderResults( updateUrl = true ) {
	const claims = filterClaims( currentSnapshot, getFilters() );
	elements.claims.replaceChildren( ...claims.map( ( claim ) => renderClaim( claim ) ) );
	elements[ "result-count" ].textContent = `${ claims.length } of ${ currentSnapshot.claims.length } field notes · ${ formatDate( currentSnapshot.observedAt ) } snapshot`;
	elements.empty.hidden = claims.length !== 0;
	if ( updateUrl ) {
		syncUrl();
	}
}

function resetFilters() {
	elements.search.value   = "";
	elements.category.value = "all";
	elements.status.value   = "all";
	elements.sort.value     = "newest";
	renderResults();
}

function revealHashTarget() {
	if ( !location.hash.startsWith( "#claim-" ) ) {
		return;
	}
	const id = location.hash.slice( 7 );
	if ( !currentSnapshot.claims.some( ( claim ) => claim.id === id ) ) {
		return;
	}
	if ( !document.getElementById( `claim-${ id }` ) ) {
		resetFilters();
	}
	const article = document.getElementById( `claim-${ id }` );
	article.querySelector( "details" ).open = true;
	// Native fragment positioning may run before asynchronous data rendering
	article.querySelector( "h3 a" ).focus( { preventScroll: true } );
	window.scrollTo( { top: article.getBoundingClientRect().top + window.scrollY - 25, behavior: "instant" } );
}

function selectSnapshot( id ) {
	currentSnapshot = snapshots.get( id ) ?? snapshots.get( catalog.latest );
	elements.snapshot.value = currentSnapshot.id;
	const entry = catalog.snapshots.find( ( snapshot ) => snapshot.id === currentSnapshot.id );
	elements[ "snapshot-download" ].href = entry.path;
	elements[ "snapshot-note" ].textContent = `${ currentSnapshot.summary } ${ catalog.snapshots.length === 1 ? "This is the first collection, not a reconstructed history." : "This dated record is preserved unchanged." }`;
	elements.edition.textContent = `COLLECTED ${ formatDate( currentSnapshot.observedAt ).toUpperCase() }`;
	const disputed = currentSnapshot.claims.filter( ( claim ) => claim.status === "disputed" ).length;
	elements[ "collection-count" ].textContent = `${ currentSnapshot.claims.length } FIELD NOTES / ${ currentSnapshot.sources.length } SOURCES / ${ disputed } DISPUTED`;
	const image = currentSnapshot.images[ 0 ];
	elements.artwork.src = image.path;
	elements.artwork.alt = image.alt;
	elements[ "art-credit" ].textContent = `${ image.title } · ${ image.creator } · ${ image.license }. ${ image.disclaimer } Publisher images remain at their original source links.`;
	renderResults( false );
}

function restoreLocation() {
	const filters = readFilters( location.search );
	elements.search.value   = filters.q;
	elements.category.value = filters.category;
	elements.status.value   = filters.status;
	elements.sort.value     = filters.sort;
	selectSnapshot( new URLSearchParams( location.search ).get( "snapshot" ) );
	revealHashTarget();
}

async function initializeArchive() {
	try {
		catalog = await fetchJson( "data/index.json" );
		// The index pins local immutable paths; no external requests are needed
		await Promise.all( catalog.snapshots.map( async ( entry ) => {
			if ( !/^data\/snapshots\/\d{4}-\d{2}-\d{2}\.json$/.test( entry.path ) ) {
				throw new Error( "Invalid snapshot path" );
			}
			const snapshot = await fetchJson( entry.path );
			snapshots.set( entry.id, snapshot );
		} ) );
		elements.snapshot.replaceChildren( ...[ ...catalog.snapshots ].reverse().map( ( entry ) => {
			const option = createElement( "option", `${ formatDate( entry.id ) } — ${ entry.title }` );
			option.value = entry.id;
			return option;
		} ) );
		elements.snapshot.disabled = false;
		for ( const category of categories ) {
			const option = createElement( "option", category );
			option.value = category;
			elements.category.append( option );
		}
		const lastCheck = catalog.checks.at( -1 );
		elements[ "check-date" ].textContent = `LAST REVIEW ${ formatDate( lastCheck.date ).toUpperCase() }`;
		elements[ "check-log" ].replaceChildren( ...[ ...catalog.checks ].reverse().map( ( check ) => createElement( "p", `${ formatDate( check.date ) } · ${ check.outcome.replaceAll( "-", " " ) }: ${ check.notes }` ) ) );
		restoreLocation();
		elements.filters.addEventListener( "submit", ( event ) => event.preventDefault() );
		elements.search.maxLength = 300;
		elements.search.addEventListener( "input", () => renderResults() );
		for ( const id of [ "category", "status", "sort" ] ) {
			elements[ id ].addEventListener( "change", () => renderResults() );
		}
		elements.reset.addEventListener( "click", resetFilters );
		elements.snapshot.addEventListener( "change", () => {
			selectSnapshot( elements.snapshot.value );
			syncUrl( true );
		} );
		window.addEventListener( "popstate", restoreLocation );
		window.addEventListener( "hashchange", revealHashTarget );
	} catch {
		elements[ "load-error" ].textContent = "The archive could not be loaded. Please reload to try again, or use the Open data link to read the source files.";
		elements[ "load-error" ].hidden = false;
		elements[ "result-count" ].textContent = "Field notes unavailable";
		elements.snapshot.disabled = true;
	}
}

initializeArchive();
