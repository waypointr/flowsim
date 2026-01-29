function ComponentButton(config) {
    // Inherit
    const self = this;
    Component.apply(self);
    // Preserve the config settings here so we don't need to reference the freakin' MATRIX to get them later
    for (let key in config) {
        self[key] = config[key];
    }

    const button = document.getElementById(config.id);
    self.onchange = function() {
        if(button.checked){
            self.setValue(config.button);

        } else {
            self.setValue('normal');
        }
    };
    // Show
    self.show = function () {
        button.value = self.getValue();
        if(button.value == 'normal') {
            button.checked = false;
        }
        else {
            button.checked = true;
        }
    };

    button.addEventListener('change', self.onchange);
}
