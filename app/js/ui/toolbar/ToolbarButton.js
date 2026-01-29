function ToolbarButton(toolbar, config) {
    const self = this;
    self.id = config.id; // Button ID

    // Icon
    self.dom = document.createElement('div');
    self.dom.setAttribute('class', 'toolbar_button');
    self.dom.style.backgroundImage = `url('${config.icon}')`;

    // Tooltip!
    self.dom.setAttribute('data-balloon', config.tooltip);
    self.dom.setAttribute('data-balloon-pos', 'right');

    // Selected?
    self.select = function () {
        self.dom.setAttribute('selected', 'yes'); // Mark the button as selected by setting the "selected" attribute to "yes"
        if (self.id === 'redo' || self.id === 'undo') {
            self.deselect();
        }
    };
    self.deselect = function () {
        self.dom.setAttribute('selected', 'no'); // Mark the button as deselected by setting the "selected" attribute to "no"
    };

    // On Click
    self.callback = function () {
        config.callback(); // Invoke the callback function specified in the button configuration\
        
        // if undo is clicked, don't select it on toolbar
        if (self.id === "undo" || self.id === "redo") {
            // turn the undo button grey
            self.dom.setAttribute('selected', 'yes');

            // after .225 seconds turn the undo button back to normal
            setTimeout(function() {
                self.dom.setAttribute('selected', 'no');
            }, 225);

            return;
        }

        toolbar.selectButton(self); // Call the selectButton function in the toolbar and pass it the current button instance
    };
    self.dom.onclick = self.callback; // Assign the callback function to the onclick event of the button
}