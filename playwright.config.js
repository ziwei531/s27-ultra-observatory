import { defineConfig } from "@playwright/test";

export default defineConfig( {
	  testDir: "./test/browser"
	, timeout: 30000
	, retries: 0
	, reporter: [ [ "list" ], [ "html", { open: "never" } ] ]
	, use: { baseURL: process.env.SITE_URL ?? "http://127.0.0.1:4173/s27-ultra-observatory/", trace: "retain-on-failure" }
	, projects: [
		  { name: "desktop", use: { browserName: "chromium", viewport: { width: 1440, height: 1000 } } }
		, { name: "mobile", use: { browserName: "chromium", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } }
	]
	, webServer: process.env.SITE_URL ? undefined : { command: "npm run serve", url: "http://127.0.0.1:4173/s27-ultra-observatory/", reuseExistingServer: !process.env.CI }
} );
