function ComponentOutput(config) {
    // Inherit
    const self = this;
    Component.apply(self);

    // Preserve the config settings here so we don't need to reference the freakin' MATRIX to get them later
    for (let key in config) {
        self[key] = config[key];
    }

    // DOM: just a readonly input that selects all when clicked
    self.dom = _createInput('component_output');
    
    self.dom.setAttribute('readonly', 'true');
    self.dom.setAttribute('id', 'modal_read_only_input');
    self.dom.onclick = function () {
        self.dom.select();
    };

    // Output the string!
    self.output = function (string) {
        self.dom.value = string;
    };
}