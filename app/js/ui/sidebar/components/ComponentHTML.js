function ComponentHTML(config) {
    // Inherit
    const self = this;
    Component.apply(self);

    // Preserve the config settings here so we don't need to reference the freakin' MATRIX to get them later
    for (let key in config) {
        self[key] = config[key];
    }

    // just a div
    self.dom = document.createElement('div');
    
    self.dom.innerHTML = config.html;
}