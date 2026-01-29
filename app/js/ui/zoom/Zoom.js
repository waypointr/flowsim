/** *************************************************************************************************
User Summary
Allows the user to zoom in and out of the whiteboard. The zoom percentage is displayed in the input box.

Technical Summary
The Zoom function is used for managing the zoom functionality of the application. It allows the user to zoom in and out of the whiteboard, and the zoom percentage is displayed in an input box.

The Zoom function initializes several properties, including loopy (the application state), maxScale and minScale (the maximum and minimum zoom scales), lastZoom (the last zoom level), 
zoomInput (the input element for the zoom level), lastValidZoom (the last valid zoom level), and preventTool (a flag to prevent tools from working when the zoom input is focused).

The function sets up several event listeners on the zoomInput element:

A keydown event listener that prevents keyboard shortcuts from triggering and allows only certain keys (backspace, delete, enter, arrow right, arrow left, 0-9, numpad 0-9) to be used.
An input event listener that calls the oninput method when the input value changes.
A blur event listener that calls the zoomOrLastZoom method when the input loses focus, and sets up a mouseup event listener to set preventTool to false.
A focus event listener that sets preventTool to true when the input is focused.
A keyup event listener that calls the zoomOrLastZoom method and blurs the input when the enter key is pressed.
The mouseWheelZoom method is used to zoom in and out based on the mouse wheel movement. It checks the current mode of the application and adjusts the zoom scale accordingly.

************************************************************************************************** */
function Zoom(loopy) {
    const self = this;
    // how much the plus and minus zoom in and out by.
    const zoomButtonChange = .05;
    self.loopy = loopy;
    self.maxScale = 4;
    self.minScale = .25;
    self.lastZoom = 1;
    self.zoomInput = document.getElementById('zoomInputPercentage');
    self.lastValidZoom = 100;
    self.preventTool = false;

    // checks for valid keys
    self.zoomInput.addEventListener('keydown', function(event){
        // prevents keyboard shortcuts from triggering 
        event.stopPropagation();
        // allows the keys below to be used
        if (
            event.keyCode == 8 /* backspace */ ||
            event.keyCode == 46 /* delete */ ||
            event.keyCode == 13  /* enter */ ||
            event.keyCode == 37 /* arrow right */ ||
            event.keyCode == 39 /* arrow left */
        ){
            return;
        } 
        // prevents every other key except for 0-9 and numpad 0-9
        if ( 
            !(event.keyCode >= 48 && event.keyCode <= 57) /* keyboard 0-9*/ &&
            !(event.keyCode >= 96 && event.keyCode <= 105) /* numpad 0-9*/
        ){
            event.preventDefault();
            return;
        }

    });
    // prevents numbers over max from being entered
    self.zoomInput.addEventListener('input', function(event){
        self.oninput(event);  
    });
    // when you click out the zoomInput change to value entered if valid
    self.zoomInput.addEventListener('blur', function(event){
        self.zoomOrLastZoom(); 
        // prevents tools from triggering when clicking out
        subscribe('mouseup', () =>{
            self.preventTool = false;
        });
    });
    // when input is focused prevent tools from working
    self.zoomInput.addEventListener('focus', function(event){
        self.preventTool = true;
    });
    // adding so you can press enter to change zoom
    self.zoomInput.addEventListener('keyup', function(event){
        if (event.key === 'Enter' || event.keyCode === 13) {
            self.zoomOrLastZoom();
            self.zoomInput.blur();
            self.preventTool = false;
        }
    });

    // zoom for mousewheel towards the mouse pointer 
    self.mouseWheelZoom = function(mouse) {
        if (self.loopy.mode === Loopy.MODE_EDIT || self.loopy.mode === Loopy.MODE_PLAY) {
            let scale = loopy.offsetScale;
            const oldOffsetScale = loopy.offsetScale;
            if (mouse.wheel < 0) scale *= 1.1;
            if (mouse.wheel > 0) scale *= 0.9;
            loopy.offsetScale = withinLimits(scale);
            const old_m2M = mouseToMouse(mouse.x, mouse.y, oldOffsetScale, loopy.offsetX, loopy.offsetY);
            const new_m2M = mouseToMouse(mouse.x, mouse.y, loopy.offsetScale, loopy.offsetX, loopy.offsetY);
            loopy.offsetX += (new_m2M.x - old_m2M.x);
            loopy.offsetY += (new_m2M.y - old_m2M.y);
            
            calculatePercentage();
        }
    }

    // change to zoom typed if within limits, if not valid go to lastZoom
    self.zoomOrLastZoom = function() {
        let value = (self.zoomInput.value && self.zoomInput.value >= 25)? self.zoomInput.value/100 : self.lastZoom;
        let scale = withinLimits(value);
        loopy.offsetScale = scale;
        calculatePercentage();
    }

    self.zoomOut = function() {
        let scale = loopy.offsetScale - zoomButtonChange;
        loopy.offsetScale = withinLimits(scale);
        calculatePercentage();
    }

    self.zoomIn = function() {
        let scale = loopy.offsetScale + zoomButtonChange;
        loopy.offsetScale = withinLimits(scale);
        calculatePercentage();
    }

    // checks if input is within 0 and maxScale then if input is above min before setting last valid zoom
    // else set input to last valid zoom
    self.oninput = function (event) {
        let value = self.zoomInput.value;
        if(value >= 0 && value <= self.maxScale * 100){
            if(value == '' || value < self.minScale * 100) return;
            self.lastValidZoom = value;
        } else {
            self.zoomInput.value = self.lastValidZoom;
        }
    };

    // Keyboard shortcuts
    subscribe(`key/zoomout`, () => {
        self.zoomOut();
    });

    subscribe(`key/zoomin`, () => {
        self.zoomIn();
    });
}
// Updates the zoom percentage input with new percentage and sets last zoom
function calculatePercentage() {
    const percentage = parseInt(loopy.offsetScale * 100);
    if(loopy.zoom.zoomInput) {
        loopy.zoom.zoomInput.value = percentage;
    }
    loopy.zoom.lastZoom = loopy.offsetScale;
    publish('whiteboard/changed');
}
// Checks if scale is with in limits. If over or under set max or min values
function withinLimits(scale){
    if (scale > loopy.zoom.maxScale) {
        return loopy.zoom.maxScale;
    } else if (scale < loopy.zoom.minScale) {
        return loopy.zoom.minScale;
    }
    return scale;
}