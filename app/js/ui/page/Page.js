function Page() {
    const self = this;

    // DOM
    self.dom = document.createElement('div');
    self.show = function () { self.dom.style.display = 'block'; };
    self.hide = function () { self.dom.style.display = 'none'; };

    // Add Component
    self.addComponent = function (component) {
        self.dom.appendChild(component.dom); // add to DOM
        return component;
    };
}