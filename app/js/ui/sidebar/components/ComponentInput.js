/** *************************************************************************************************
User Summary
This is text input component that is used to edit the properties of the nodes, edges, and labels on the whiteboard.

Technical Summary
The ComponentInput class is used to control input events in a textbox or input box. 
It provides validation for the component by identifying the propNames and ids that are being changed.

************************************************************************************************** */
function ComponentInput(config) {
    // Inherit
    const self = this;
    Component.apply(self);
    // Preserve the config settings here so we don't need to reference the freakin' MATRIX to get them later
    for (let key in config) {
        self[key] = config[key];
    }

    let tag = (config.textarea ? 'textarea' : 'input');
    let input = document.querySelector(`${tag}[name="${config.name}"]`);
    
    if (config.id) {
        input.setAttribute('id', config.id);
    }

    input.addEventListener('keypress', function (event) { 
        if(config.fancyInput) {
            return event.charCode >= 48 && event.charCode <= 57;
        }
    });
    input.addEventListener('keyup', function(event){
        if(tag == 'textarea') return;
        if (event.key === 'Enter' || event.keyCode === 13) {
            input.blur();
        }
    });
    

    // DOM events
    self.onkeydown = function (event) {
        event.stopPropagation(); // STOP IT FROM TRIGGERING KEY.js

        if (event.code === 'Delete' && !input.value) {
            self.page.target.kill();
        }
    };


    self.oninput = function () {
        if(config.fancyInput) {
            let valid;
            if(config.hasOwnProperty('max') && config.hasOwnProperty('min')){
                let min = (config.hasOwnProperty('allowLowerMin'))? config.allowLowerMin : config.min;
                valid = testValidValues(parseInt(input.value, 10), min, config.max);
            }
            if(!valid){
                if (config.oninput) {
                    let value = (input && input.value==0) ? '' : self.getValue();
                    config.oninput(input, value, config.id || null, valid);
                    return;
                }
            }

            self.setValue(input.value);
            
            
            // Sends value if input is valid
            if (config.oninput) {
                config.oninput(input, self.getValue(), config.id || null, valid);
            }
        } else if(config.bottleneck) {
            config.oninput(input, self.getValue());
            self.setValue(input.value);
                       
        }
        else {
            if(config.onbeforeinput) {
                config.onbeforeinput(self, self.getValue());
            }
            self.setValue(input.value);
            
            // Callback! (if any)
            if (config.oninput) {
                config.oninput(self, self.getValue());
            }

        }
    };

    self.onblur = function () {
        let canPublish = true;
        let hasBeenChanged = false;
        if(config.hasOwnProperty('inlineValidation') && config.inlineValidation.elementId && config.inlineValidation.validate){
            let elementId = config.inlineValidation.elementId;
            let validation = config.inlineValidation.validate(input, config, self.oldValue);
            toggleMessage(elementId, validation);
        }
        let value = (input && input.value =='') ? self.oldValue : self.getValue();
        if(config.onblur){
            if(config.multipleInputs) {
                config.onblur(self, input, self.oldValue);
            } 
            // bottleneck status indicators
            else if(config.bottleneck) {
                if(config.checkvalid() != ''){
                    value = self.lastValidBlur;
                    input.value = self.lastValidBlur;
                    canPublish = false;
                } else {
                    self.lastValidBlur = self.getValue();
                } 
                config.onblur(input, self.lastValidBlur);
            }
            else {
                if(config.hasOwnProperty('allowLowerMin') && value < config.min){
                    value = self.oldValue;
                    input.value = self.oldValue;
                    canPublish = false;
                }
                const newValue = config.onblur(input, self.oldValue);
                    if(newValue) {
                        value = newValue;
                    }
            }
            if (input.value != self.oldValue) {
                hasBeenChanged = true;
            }
            self.setValue(value);
            
        }
        

        
 
        self.oldValue = self.getValue();

        // Prevents actions queue from being updated if the text is empty or invalid
        if(canPublish && hasBeenChanged && (self.bg != "text" || (self.bg == "text" && (self.oldValue != "..." && self.oldValue != "")))) {
            // add to actions queue 
            publish('actionsQueue');
        }

    };

    self.onfocus = function () {
        self.oldValue = self.getValue();
        if(config.onfocus) {
            config.onfocus(self);
        }
        // sets bottleneck blur value for validation
        if(config.bottleneck) {
            self.lastValidBlur = self.getValue();
        }
    };

    
    self.onchange = function () {
        let value = (input && input.value =='') ? self.oldValue : self.getValue();
        if(config.onchange) {
            config.onchange(value);
        }
    };

    // Attach the DOM events to the form element that's already in HTML

    input.addEventListener('keydown', self.onkeydown);
    input.addEventListener('input', self.oninput);
    input.addEventListener('blur', self.onblur);
    input.addEventListener('focus', self.onfocus);
    input.addEventListener('change', self.onchange);


    // Show
    self.show = function () {
        input.value = self.getValue();
        if(config.hasOwnProperty('inlineValidation') && config.inlineValidation.elementId){
            toggleMessage(config.inlineValidation.elementId);
        }
    };

    // Select
    self.select = function () {
        setTimeout(() => { input.select(); }, 10);
    };
}

// determine if value is valid and keep old value if not
function testValidValues(value, min, max) {
    //return false if below min and above max
    return !(value > max || value < min);
}

function toggleMessage(elementId, validation = '') {
    const hideMessageClass = 'component_inputInvalidMessageHidden';
    const showMessageClass = 'component_inputInvalidMessageShow';
    const message = document.getElementById(elementId);
    if(message){
        message.innerHTML = validation;
        if(validation) {
            message.classList.remove(hideMessageClass);
            message.classList.add(showMessageClass);
        } else {
            message.classList.remove(showMessageClass);
            message.classList.add(hideMessageClass);
        }
    }
}