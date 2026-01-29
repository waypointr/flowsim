function ComponentDropdown(config) {
    // Inherit
    const self = this;
    Component.apply(self);
    
    // Preserve the config settings here so we don't need to reference the freakin' MATRIX to get them later
    for (let key in config) {
        self[key] = config[key];
    }
    
    // DOM: label + dropdown
    self.dom = document.querySelector(`div.component_dropdown[name="${config.name}"]`);
    const container = self.dom.closest('div.form-group');
    const select = document.getElementById(config.id);
    // if the dropdown form-group is missing the "not_in_play_mode" class, add it
    if (!container.classList.contains('not_in_play_mode')) {
        container.classList.add('not_in_play_mode');
    }

    self.onchange = function() {
        self.setValue(select.value);
        
        if(config.onchange) {
            config.onchange(select.value);
        }
    }

    // Show
    self.show = function () {
        select.value = self.getValue();
    };

    select.addEventListener('change', self.onchange);
}