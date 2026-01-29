function ModalIframe(config) {
    const self = this;

    // IFRAME
    const iframe = document.createElement('iframe');
    self.dom = iframe;
    iframe.width = config.width;
    iframe.height = config.height;

    // Show & Hide
    if (!config.manual) {
        config.page.onshow = function () {
            iframe.src = config.src;
        };
        config.page.onhide = function () {
            iframe.removeAttribute('src');
        };
    }
}