function ComponentSlider(config) {
    // Inherit
    const self = this;
    Component.apply(self);

    // Preserve the config settings here so we don't need to reference the freakin' MATRIX to get them later
    for (let key in config) {
        self[key] = config[key];
    }

    // DOM: label + slider
    self.dom = document.querySelector(`div.component_slider[name="${config.name}"]`);
    const container = self.dom.closest('div.form-group');
    const sliderBG = self.dom.querySelector('img.component_slider_graphic');
    const pointer = self.dom.querySelector('img.component_slider_pointer');

    // if the slider form-group is missing the "not_in_play_mode" class, add it
    if (!container.classList.contains('not_in_play_mode')) {
        container.classList.add('not_in_play_mode');
    }
    
    const movePointer = function () {
        const value = self.getValue();
        const optionIndex = config.options.indexOf(value);
        const x = (optionIndex + 0.5) * (250 / config.options.length);
        pointer.style.left = `${x - 7.5}px`;
        let active = 0;
    };
    // On click... (or on drag)
    let isDragging = false;
    const onmousedown = function (event) {
        isDragging = true;
        sliderInput(event);
    };
    const onmouseup = function () {
        isDragging = false;
    };
    const onmousemove = function (event) {
        if (isDragging) sliderInput(event);
    };
    const sliderInput = function (event) {
        // What's the option?
        const index = event.x / 250;
        const optionIndex = Math.floor(index * config.options.length);
        const option = config.options[optionIndex];
        if (option === undefined) return;
        self.setValue(option);

        // Callback! (if any)
        if (config.oninput) {
            config.oninput(self, option);
        }

        // Move pointer there.
        movePointer();
    };
    _addMouseEvents(self.dom, onmousedown, onmousemove, onmouseup);

    // Show
    self.show = function () {
        movePointer();
    };

    // BG Color!
    self.setBGColor = function (color) {
        sliderBG.style.backgroundColor = color;
    };
}