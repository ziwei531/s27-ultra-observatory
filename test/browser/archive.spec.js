import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";

const catalog = JSON.parse( await readFile( "data/index.json", "utf8" ) );
const snapshot = JSON.parse( await readFile( catalog.snapshots.find( ( entry ) => entry.id === catalog.latest ).path, "utf8" ) );
const timeline = JSON.parse( await readFile( "data/early-timeline.json", "utf8" ) );
const reportCount = snapshot.claims.length + timeline.reports.length;

for ( const viewport of [ { name: "desktop", width: 1280, height: 900 }, { name: "mobile", width: 390, height: 844 } ] ) {
	test( `${ viewport.name } reports-first layout is accessible and fits`, async ( { page }, testInfo ) => {
		const errors = [];
		page.on( "pageerror", ( error ) => errors.push( error.message ) );
		await page.setViewportSize( viewport );
		const response = await page.goto( "./" );
		expect( response.status() ).toBe( 200 );
		await expect( page.locator( ".report" ) ).toHaveCount( reportCount );
		await expect( page.getByRole( "heading", { name: "Reports", level: 1 } ) ).toBeVisible();
		await expect( page.locator( "#report-list" ) ).toBeVisible();
		expect( await page.locator( "#artwork" ).count() ).toBe( 0 );
		expect( await page.locator( "nav" ).count() ).toBe( 0 );
		expect( await page.locator( ".report" ).first().evaluate( ( element ) => getComputedStyle( element ).fontFamily ) ).toMatch( /system-ui|Segoe UI/ );
		expect( await page.evaluate( () => document.documentElement.scrollWidth <= innerWidth ) ).toBeTruthy();
		const accessibility = await new AxeBuilder( { page } ).withTags( [ "wcag2a", "wcag2aa", "wcag21aa" ] ).analyze();
		expect( accessibility.violations ).toEqual( [] );
		expect( errors ).toEqual( [] );
		await testInfo.attach( "viewport", { body: JSON.stringify( viewport ), contentType: "application/json" } );
	} );
}

test( "search is limited to report title and summary, and sources expand", async ( { page } ) => {
	await page.goto( "./" );
	await page.getByLabel( "Search reports" ).fill( "Exynos" );
	await expect( page.locator( ".report" ) ).toHaveCount( snapshot.claims.filter( ( report ) => `${ report.title } ${ report.summary }`.toLowerCase().includes( "exynos" ) ).length );
	await page.getByLabel( "Search reports" ).fill( "publisher-only-no-match" );
	await expect( page.locator( ".report" ) ).toHaveCount( 0 );
	await page.getByLabel( "Search reports" ).fill( "" );
	await page.getByLabel( "Reading order" ).selectOption( "oldest" );
	await expect( page.locator( ".report" ).first() ).toContainText( "Source date:" );
	await page.locator( ".report details summary" ).first().click();
	await expect( page.locator( ".report details[open] a" ).first() ).toHaveAttribute( "href", /^https:\/\// );
});
