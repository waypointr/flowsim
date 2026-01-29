/** *************************************************************************************************
User Summary
PageUI controls what the page is being displayed to the user.

Technical Summary
The PageUI class is used to control what page is being displayed to the user. The addPage function is used to add a page to the PageUI. 
The showPage function is used to show a page to the user. The hide function is used to hide a page from the user.

************************************************************************************************** */

function PageUI(dom) {
    const self = this;
    self.dom = dom;

    self.pages = [];
    self.addPage = function (id, page) {
        page.id = id;
        page.dom.classList.add("advanced");
        self.dom.appendChild(page.dom);
        self.pages.push(page);
    };
    self.currentPage = null;
    self.showPage = function (id) {
        let shownPage = null;
        for (let i = 0; i < self.pages.length; i++) {
            const page = self.pages[i];
            if (page.id === id) {
                page.show();
                shownPage = page;
            } else {
                page.hide();
            }
        }
        self.currentPage = shownPage;
        return shownPage;
    };
}
