import { filterReports, formatDate, readFilters, safeSourceUrl } from "./model.js?v=__BUILD_VERSION__";

const elements = Object.fromEntries( [
	  "filters", "model", "search", "sort", "model-name", "reports-model", "result-count", "report-list", "empty", "load-error", "leaker-list", "leakers-disclaimer"
].map( ( id ) => [ id, document.getElementById( id ) ] ) );
let catalog;
let currentSnapshot;
let selectedModel;

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
	return { model: elements.model.value, q: elements.search.value, sort: elements.sort.value };
}

function syncUrl() {
	const url = new URL( location.href );
	url.search = "";
	for ( const [ key, value ] of Object.entries( getFilters() ) ) {
		const isDefault = ( key === "model" && value === catalog.defaultModel ) || ( key === "sort" && value === "newest" );
		if ( value && !isDefault ) {
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

function renderLeakers( data ) {
	elements[ "leakers-disclaimer" ].textContent = data.disclaimer;
	elements[ "leaker-list" ].replaceChildren( ...data.leakers.map( ( leaker ) => {
		const article = createElement( "article", "", "leaker" );
		const heading = createElement( "div", "", "leaker-heading" );
		heading.append( createElement( "h3", leaker.name ), createElement( "span", leaker.signal, `signal signal-${ leaker.signal }` ) );
		article.append( heading, createElement( "p", leaker.handle, "leaker-handle" ), createElement( "p", leaker.focus, "leaker-focus" ), createElement( "p", leaker.note, "leaker-note" ) );
		const sources = document.createElement( "ul" );
		for ( const reference of leaker.references ) {
			const link = createElement( "a", `${ reference.model }: ${ reference.title } ↗` );
			const url = safeSourceUrl( reference.url );
			if ( url ) {
				link.href = url;
				link.rel = "noreferrer noopener";
			}
			const item = document.createElement( "li" );
			item.append( link );
			sources.append( item );
		}
		article.append( createElement( "h4", "Archive references" ), sources );
		return article;
	} ) );
}

async function loadLeakers() {
	try {
		renderLeakers( await fetchJson( "data/leakers.json" ) );
	} catch {
		elements[ "leaker-list" ].replaceChildren();
		elements[ "leakers-disclaimer" ].textContent = "The individual-leaker index could not be loaded.";
	}
}

async function loadModel( modelId ) {
	selectedModel = catalog.models.find( ( model ) => model.id === modelId );
	const manifest = await fetchJson( selectedModel.manifest );
	const entry    = manifest.snapshots.find( ( snapshot ) => snapshot.id === manifest.latest );
	const snapshot = await fetchJson( entry.path );
	const timeline = manifest.timeline ? await fetchJson( manifest.timeline ) : { reports: [], sources: [] };
	currentSnapshot = {
		...snapshot
		, claims : [ ...timeline.reports, ...snapshot.claims ]
		, sources: [ ...timeline.sources, ...snapshot.sources ]
	};
	elements[ "model-name" ].textContent   = selectedModel.label;
	elements[ "reports-model" ].textContent = `${ selectedModel.shortLabel } reports`;
	renderResults();
}

async function selectModel() {
	try {
		await loadModel( elements.model.value );
	} catch {
		elements[ "load-error" ].textContent = "The selected model reports could not be loaded. Reload to try again, or open the JSON data directly.";
		elements[ "load-error" ].hidden = false;
		elements[ "result-count" ].textContent = "Reports unavailable";
	}
}

async function restoreLocation() {
	const filters = readFilters( location.search, catalog.models, catalog.defaultModel );
	elements.model.value  = filters.model;
	elements.search.value = filters.q;
	elements.sort.value   = filters.sort;
	await loadModel( filters.model );
}

async function initializeArchive() {
	try {
		catalog = await fetchJson( "data/index.json" );
		for ( const model of catalog.models ) {
			const option = createElement( "option", model.shortLabel );
			option.value = model.id;
			elements.model.append( option );
		}
		await Promise.all( [ loadLeakers(), restoreLocation() ] );
		elements.filters.addEventListener( "submit", ( event ) => event.preventDefault() );
		elements.model.addEventListener( "change", selectModel );
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
