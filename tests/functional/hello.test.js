const { navigateToVSMTool, getDriver } = require('./hooks/global.js');
const { assert } = require('chai');

describe('hello world', async function () {
    // Examples of how to use Selenium to interact with elements on the page and confirm their existence/values
    // const search = async (term) => {
    //     driver = getDriver();
    //
    //     // Automate DuckDuckGo search
    //     await driver.get('https://duckduckgo.com/');
    //     const searchBox = await driver.findElement(
    //         By.id('search_form_input_homepage'));
    //     await searchBox.sendKeys(term, Key.ENTER);

    //     // Wait until the result page is loaded
    //     await driver.wait(until.elementLocated(By.css('#links .result')));

    //     // Return page content
    //     const body = await driver.findElement(By.tagName('body'));
    //     return await body.getText();
    // };


    /**
     * Test definitions
     */

    it('should hello world', async function () {
        // The first content variable below is the intended way to interact with the tool.
        // The second content variable below is to ensure that the driver variable is the object we're expecting.
        // 
        // Might as well check both for contents as part of the test.
        const content = await navigateToVSMTool(); // this method navigates the driver to the VSM tool
        const content2 = await getDriver().getPageSource(); // getDriver() gets the driver to work with directly

        assert.isTrue(content.includes('window.loopy = new Loopy();'));
        assert.isTrue(content2.includes('window.loopy = new Loopy();'));
    });

});
