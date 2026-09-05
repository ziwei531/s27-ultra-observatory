import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";

const catalog = JSON.parse( await readFile( "data/index.json", "utf8" ) );
const snapshot = JSON.parse( await readFile( catalog.snapshots.find( ( entry ) => entry.id === catalog.latest ).path, "utf8" ) );

test( "rendered geometry, artwork, keyboard access and accessibility", async ( { page }, testInfo ) => {
	const errors = [];
	page.on( "pageerror", ( error ) => errors.push( error.message ) );
	const response = await page.goto( "./" );
	expect( response.status() ).toBe( 200 );
	await expect( page.locator( ".claim" ) ).toHaveCount( snapshot.claims.length );
	await expect( page.locator( "#load-error" ) ).toBeHidden();
	await expect( page.locator( "#artwork" ) ).toBeVisible();
	expect( await page.locator( "#artwork" ).evaluate( ( image ) => image.complete && image.naturalWidth > 0 ) ).toBeTruthy();
	const geometry = await page.evaluate( () => {
		const main = document.querySelector( "main" ).getBoundingClientRect();
		const header = document.querySelector( "header" ).getBoundingClientRect();
		const evidence = document.querySelector( "#evidence" ).getBoundingClientRect();
		return { viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth, mainLeft: main.left, mainRight: main.right, headerLeftDelta: header.left - main.left, headerRightDelta: header.right - main.right, evidenceLeftDelta: evidence.left - main.left, evidenceRightDelta: evidence.right - main.right, grid: getComputedStyle( document.querySelector( ".archive-layout" ) ).gridTemplateColumns };
	} );
	expect( geometry.scrollWidth ).toBeLessThanOrEqual( geometry.viewport );
	expect( geometry.headerLeftDelta ).toBe( 0 );
	expect( geometry.headerRightDelta ).toBe( 0 );
	expect( geometry.evidenceLeftDelta ).toBe( 0 );
	expect( geometry.evidenceRightDelta ).toBe( 0 );
	await testInfo.attach( "geometry", { body: JSON.stringify( geometry, null, 2 ), contentType: "application/json" } );
	console.log( `Geometry ${ testInfo.project.name }: ${ JSON.stringify( geometry ) }` );
	await page.screenshot( { path: `test-results/${ testInfo.project.name }-overview.png`, fullPage: true } );
	await page.keyboard.press( "Tab" );
	await expect( page.getByText( "Skip to evidence", { exact: true } ) ).toBeFocused();
	await page.keyboard.press( "Enter" );
	await expect( page ).toHaveURL( /#evidence$/ );
	const accessibility = await new AxeBuilder( { page } ).withTags( [ "wcag2a", "wcag2aa", "wcag21aa" ] ).analyze();
	expect( accessibility.violations ).toEqual( [] );
	expect( errors ).toEqual( [] );
} );

test( "search, category, disputed and empty states, reset and source drawers", async ( { page } ) => {
	await page.goto( "./" );
	await expect( page.locator( ".claim" ) ).toHaveCount( snapshot.claims.length );
	await page.getByLabel( "Search the collection" ).fill( "Exynos" );
	await expect( page.locator( ".claim" ).first() ).toContainText( /Exynos/ );
	await page.getByLabel( "Category", { exact: true } ).selectOption( "Battery" );
	await expect( page.locator( "#empty" ) ).toBeVisible();
	await page.getByRole( "button", { name: "Reset filters" } ).click();
	await page.getByLabel( "Evidence state" ).selectOption( "disputed" );
	await expect( page.locator( ".claim" ) ).toHaveCount( snapshot.claims.filter( ( claim ) => claim.status === "disputed" ).length );
	await page.locator( ".claim summary" ).first().click();
	await expect( page.locator( ".claim details[open] .evidence-body" ) ).toBeVisible();
	await expect( page.locator( ".claim details[open] a" ).first() ).toHaveAttribute( "href", /^https:\/\// );
	await page.getByRole( "button", { name: "Reset filters" } ).click();
	await page.getByLabel( "Search the collection" ).fill( "<img src=x onerror=alert(1)>" );
	await expect( page.locator( "#empty" ) ).toBeVisible();
	await expect( page.locator( "#claims img" ) ).toHaveCount( 0 );
	await page.getByRole( "button", { name: "Reset filters" } ).click();
	await page.getByLabel( "Evidence state" ).selectOption( "superseded" );
	await expect( page.locator( ".claim" ) ).toHaveCount( snapshot.claims.filter( ( claim ) => claim.status === "superseded" ).length );
} );

test( "query persistence, chronological navigation and deep links", async ( { page } ) => {
	await page.goto( "?category=Battery&sort=oldest" );
	await expect( page.getByLabel( "Category", { exact: true } ) ).toHaveValue( "Battery" );
	await expect( page.locator( ".claim" ) ).toHaveCount( snapshot.claims.filter( ( claim ) => claim.category === "Battery" ).length );
	await page.reload();
	await expect( page.getByLabel( "Reading order" ) ).toHaveValue( "oldest" );
	await page.goto( "?category=Battery#claim-three-cameras" );
	await expect( page.locator( "#claim-three-cameras details" ) ).toHaveAttribute( "open", "" );
	await page.locator( "#claim-three-cameras .related a" ).click();
	await expect( page ).toHaveURL( /#claim-four-cameras$/ );
	await expect( page.locator( "#claim-four-cameras details" ) ).toHaveAttribute( "open", "" );
	await page.goBack();
	await expect( page ).toHaveURL( /#claim-three-cameras$/ );
	await expect( page.locator( "#claim-three-cameras details" ) ).toHaveAttribute( "open", "" );
} );

test( "snapshot switch and back retain immutable views (isolated synthetic fixture)", async ( { page } ) => {
	const fixture = structuredClone( snapshot );
	fixture.id = "2026-09-07";
	fixture.observedAt = "2026-09-07";
	fixture.title = "TEST FIXTURE ONLY";
	fixture.claims = fixture.claims.slice( 0, 2 ).map( ( claim ) => ( { ...claim, related: [], supersededBy: null } ) );
	const fixtureCatalog = structuredClone( catalog );
	fixtureCatalog.snapshots.push( { id: fixture.id, title: fixture.title, path: `data/snapshots/${ fixture.id }.json` } );
	await page.route( "**/data/index.json", ( route ) => route.fulfill( { json: fixtureCatalog } ) );
	await page.route( `**/data/snapshots/${ fixture.id }.json`, ( route ) => route.fulfill( { json: fixture } ) );
	await page.goto( "./" );
	await expect( page.locator( ".claim" ) ).toHaveCount( snapshot.claims.length );
	await page.getByLabel( "Viewing snapshot" ).selectOption( fixture.id );
	await expect( page.locator( ".claim" ) ).toHaveCount( 2 );
	await expect( page.locator( "#snapshot-download" ) ).toHaveAttribute( "href", `data/snapshots/${ fixture.id }.json` );
	await page.goBack();
	await expect( page.locator( ".claim" ) ).toHaveCount( snapshot.claims.length );
} );

test( "failed data requests show a usable error, not an empty success", async ( { page } ) => {
	await page.route( "**/data/index.json", ( route ) => route.fulfill( { status: 503, body: "Unavailable" } ) );
	await page.goto( "./" );
	await expect( page.getByRole( "alert" ) ).toContainText( "could not be loaded" );
	await expect( page.getByRole( "link", { name: "Open data" } ) ).toBeVisible();
} );

test( "320px and text enlargement do not overflow", async ( { page } ) => {
	await page.setViewportSize( { width: 320, height: 800 } );
	await page.goto( "./" );
	await expect( page.locator( ".claim" ) ).toHaveCount( snapshot.claims.length );
	expect( await page.evaluate( () => document.documentElement.scrollWidth <= innerWidth ) ).toBeTruthy();
	await page.setViewportSize( { width: 1280, height: 1000 } );
	await page.evaluate( () => { document.documentElement.style.fontSize = "200%"; } );
	expect( await page.evaluate( () => document.documentElement.scrollWidth <= innerWidth ) ).toBeTruthy();
} );
