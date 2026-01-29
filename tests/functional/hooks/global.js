require('chromedriver');

const { Builder, Browser, By, until} = require('selenium-webdriver');
const { Options } = require('selenium-webdriver/chrome.js');

let driver;

/**
 * Hooks for Mocha/Chai that run before and after every test
 * Specifically, these hooks set up a Chrome headless runner for Selenium, and shut that down, respectively.
 */
exports.mochaHooks = {
    async beforeEach() {
        // Microsoft uses a longer name for Edge
        let browser = process.env.BROWSER;
        // if (browser == 'edge') {
        //     browser = 'MicrosoftEdge';
        // }

        options = new Options();

        options.addArguments('--disable-dev-shm-usage');
        options.addArguments('--no-sandbox');
        options.addArguments('--headless');

        // make a new driver for the specified browser
        driver = await new Builder()
            .forBrowser(browser)
            .setChromeOptions(options)
            .build();
    },

    async afterEach() {
        if (driver) {
            // Take a screenshot of the result page
            // [..]

            // Close the browser
            await driver.quit();
        }
    }
};

/**
 * Export the Selenium driver itself, so we can run calls against it
 */
exports.getDriver = () => driver;

/**
 * Export the method for navigating to the Selenium version of the web app.
 * Additionally, return the HTML content in case light testing of that needs to occur.
 */
exports.navigateToVSMTool = async () => {
    await driver.get('http://localhost:8080/app/index.html'); // navigate to the hosted app

    // full page source is possible with driver.getPageSource(), if that ends up being more useful here
    const body = await driver.findElement(
        By.tagName('body')
    );

    return await body.getAttribute('innerHTML');
} 
