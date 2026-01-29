/** ************************************************************************************************
User Summary
This code is the base class of the simulation upon which the rest of the code is built. It contains
the base functionality for edit and play modes, saving or loading a Loopy file, and displaying the
simulation.

Technical Summary
The code defines constants for the modes edit and play, as well as the tools ink, drag, erase, and
label. The Loopy class comprises the main portion of the file. It initializes the window, mouse,
whiteboard, sidebar, mode (play/edit), and the toolbar. The functions update and draw contain code for
the visuals. Loopy additionally contains code for running play and edit modes, saving and loading
files, handling whiteboard changes and importing/exporting, and dealing with embedded mode.

************************************************************************************************* */

function Loopy(config) {
    // Constants to determine if the simulation is in play or edit mode
    Loopy.MODE_EDIT = 0;
    Loopy.MODE_PLAY = 1;

    // Constants to determine what tool to use when in edit mode
    Loopy.TOOL_INK = 0;
    Loopy.TOOL_DRAG = 1;
    Loopy.TOOL_ERASE = 2;
    Loopy.TOOL_LABEL = 3;
    Loopy.TOOL_UNDO = 4;
    Loopy.TOOL_REDO = 5;


    // Initialize default properties
    const self = this;
    self._CLASS_ = 'Loopy';

    self.loopyMode = 1;
    window.loopy = self;
    if(!config) {
        config = {};
    }
    self.config = config;

    const defaultProperties = {};

    
    setStoredPropertyDefaults(defaultProperties, Loopy);
    _configureProperties(self, config, defaultProperties);

    // Loopy: EMBED???
    self.embedded = _getParameterByName('embed');
    self.embedded = !!parseInt(self.embedded); // force to Boolean

    // Offset & Scale?!?!
    self.offsetX = 0;
    self.offsetY = 0;
    self.offsetScale = 1;

    // Mouse
    Mouse.init(document.getElementById('canvasses')); // TODO: ugly fix, ew
    

    // Whiteboard
    self.whiteboard = new Whiteboard(self);

    // Loopy: SPEED!
    self.signalSpeed = 3;

    // Sidebar
    self.sidebar = new Sidebar(self);
    self.sidebarSwitch = new SidebarSwitch(self);
    self.sidebar.showPage('Edit'); // start here
    self.lastPage = self;

    // Play/Edit/Pause mode
    self.mode = Loopy.MODE_EDIT;
    self.pause = false;

    // Tools
    self.toolbar = new Toolbar(self);
    self.tool = Loopy.TOOL_INK;
    self.ink = new Ink(self);
    self.drag = new Dragger(self);
    self.erase = new Eraser(self);
    self.label = new Labeller(self);
    self.redo = new Redoer(self);
    self.actions = new Actions(self);
    self.undo = new Undoer(self);
    self.zoom = new Zoom(self);

    self.daysElapsed = 0;
    self.valueStreamName = '';

    // Modal
    self.modal = new Modal(self);

    // URL 
    self.shortURL = '';


    // set the tab title
    if (!self.valueStreamName) {
        document.title = "VSiM";
    }

    /// ///////
    // INIT //
    /// ///////

    self.init = async function () {
        await self.loadFromURL(); // try it.
    };

    self.saveLoopyAttributes = function () {
        let loopyActions = {
            valueStreamNameInput: self.valueStreamNameInput,
            loopyFontSelection: self.loopyFontSelection,
            indicatorYellow: self.indicatorYellow,
            indicatorRedLow: self.indicatorRedLow,
            indicatorRedMedium: self.indicatorRedMedium,
            indicatorRedHigh: self.indicatorRedHigh,
        }

        return loopyActions;
    };

    /// ////////////////
    // UPDATE & DRAW //
    /// ////////////////

    // Update Mouse at 30 fps
    self.update = function () {
        Mouse.update();
        if (self.wobbleControls >= 0) self.wobbleControls -= 1; // wobble
        if (!self.modal.isShowing) { // modAl
            self.whiteboard.update(); // Whiteboard
        }
    };
    setInterval(self.update, 1000 / 30); // 30 FPS, why not.

    // Draw function for modal (sidebar information) and whiteboard (screen itself)
    self.draw = function () {
        if (!self.modal.isShowing) { // modAl
            self.whiteboard.draw(); // whiteboard
        }
        requestAnimationFrame(self.draw);
    };

    self.updateWhiteboardLabels = function () {
        // Only change on whole numbers
        let daysElapsedDisplay = Math.floor(self.daysElapsed);

        // set the font family
        valueStreamName.style.fontFamily = self.loopyFontSelection;

        valueStreamName.innerHTML = `<h3>  ${self.valueStreamNameInput}  </h3> <h3>  Days Elapsed: ${daysElapsedDisplay} </h3>`;
    }

    // TODO: Smarter drawing of Ink, Edges, and Nodes
    // (only Nodes need redrawing often. And only in PLAY mode.)

    /// ///////////////////
    // PLAY & EDIT MODE //
    /// ///////////////////

    subscribe('key/space', () => {
        if (loopy.mode == Loopy.MODE_EDIT) {
            loopy.setMode(Loopy.MODE_PLAY);
        }
        else {
            loopy.setMode(Loopy.MODE_EDIT);
        }
    });

    subscribe('key/pause', () => {
        if (loopy.mode == Loopy.MODE_PLAY){
            self.pauseToggle();
        } 
    });

    self.pauseToggle = function() {
        self.pause = !self.pause;
        const pauseButton = document.getElementById('pauseButton');
        const playButton = document.getElementById('playButton');
        if(!self.pause) {
            // disable play button and enable pause button
            playButton.disabled = true;
            pauseButton.disabled = false;

            // hide the sidebar
            document.body.classList.remove('sidebar-open');
            document.body.classList.add('sidebar-closed');
            sidebarSwitch.style.display = 'none';
            let vsn = document.getElementById('valueStreamName');
            vsn.classList.remove('nodeInspectOpen');
            publish('resize');

            document.getElementById('sidebar').classList.remove('sidebar-pause');
            document.getElementById('sidebarSwitch').classList.remove('sidebar-switch-pause');
        }
        else {
            // disable pause button and enable play button
            playButton.disabled = false;
            pauseButton.disabled = true;

            document.getElementById('sidebar').classList.add('sidebar-pause');
            document.getElementById('sidebarSwitch').classList.add('sidebar-switch-pause');
        }
    }

    self.showPlayTutorial = false;
    self.wobbleControls = -1;
    self.setMode = function (mode) {
        self.mode = mode;
        publish('loopy/mode');
        const sidebarClosedClass = 'sidebar-closed';
        const sidebarOpenedClass = 'sidebar-open';
        const body = document.body;
        const sidebarSwitch = document.getElementById("sidebarSwitch");
        const stop = document.getElementById('stopButton');
        const pause = document.getElementById('pauseButton');
        const play = document.getElementById('playButton');
        const actionMenu = document.getElementById("action_dropdown");
        const valueStreamName = document.getElementById("valueStreamName");

        if (mode === Loopy.MODE_PLAY && self.pause) {
            self.pauseToggle();
            return;
        }

        // Play mode!
        if (mode === Loopy.MODE_PLAY) {
            stop.disabled = false;
            pause.disabled = self.pause;
            play.disabled = !self.pause;

            valueStreamName.style.display = "block";
            valueStreamName.classList.remove('nodeInspectOpen');
            // hide the action menu
            actionMenu.style.display = "none";

            // if label is not changed remove it and set page to edit
            if (self.sidebar.currentPage.target._CLASS_ == 'Label' && 
                (self.sidebar.currentPage.target.text == '...' || self.sidebar.currentPage.target.text == '')
            ){
                self.sidebar.showPage('Loopy');
            }

            // Display the value stream name
            self.updateWhiteboardLabels();

            let interval = 250;
            // calculates the days elapsed
            if (!self.daysInterval) {
                self.daysInterval = setInterval(function () {
                    if(loopy.pause) return;
                    self.daysElapsed += (interval / 1000) * ((2 ** self.signalSpeed) / 8);

                    // Display the value stream name and days elapsed in real time
                    self.updateWhiteboardLabels();
                }, interval);
            }

            self.lastPage = self.sidebar.currentPage.target;

            self.whiteboard.olderOffset = false; // Camera Reset
            self.showPlayTutorial = true; // show once
            if (!self.embedded) self.wobbleControls = 45; // only if NOT embedded
            // self.sidebar.showPage('Edit'); // commenting out keeps the selected element showing on the sidebar
            self.sidebar.dom.setAttribute('mode', 'play');
            self.toolbar.dom.setAttribute('mode', 'play');
            document.getElementById('canvasses').removeAttribute('cursor'); // TODO: EVENT BASED

            // Activate autoplay nodes by sending a signal to them
            const autoplayNodes = loopy.whiteboard.nodes.filter((n) => n.label === 'autoplay' || n.label === 'autostart');
            for (const node of autoplayNodes) {
                node.takeSignal({
                    delta: 1,
                    color: node.hue,
                });
            }
            
            self.whiteboard.clearNodesWIP();
            self.whiteboard.nodesWithWIP();
            self.whiteboard.selfGenerateWorkItems();


            // hide the sidebar
            body.classList.remove(sidebarOpenedClass);
            body.classList.add(sidebarClosedClass);
            sidebarSwitch.style.display = 'none';
            publish('resize');
 
            // Reset whiteboard if not in play mode
        } else {
            publish('whiteboard/reset');
        }

        // Edit mode!
        if (mode === Loopy.MODE_EDIT) {
            self.pause = false;
            self.sidebar.edit(self.lastPage);

            // stop the timer and clear the interval
            clearInterval(self.daysInterval);
            self.daysInterval = null;
            self.daysElapsed = 0;

            
            // Hide the value stream name
            valueStreamName.style.display = "none";
            // Show the action menu
            actionMenu.style.display = "block";

            self.showPlayTutorial = false; // Stop showing tutorial
            self.wobbleControls = -1; // Disable wobble controls

            // configure sidebar and playbar for edit mode
            // self.sidebar.showPage('Edit'); // commenting out keeps the element selected in the sidebar after pressing stop
            self.sidebar.dom.setAttribute('mode', 'edit');
            self.toolbar.dom.setAttribute('mode', 'edit');
            document.getElementById('canvasses').setAttribute('cursor', self.toolbar.currentTool); // TODO: EVENT BASED

                        
            stop.disabled = true;
            pause.disabled = true;
            play.disabled = false;

            // show the sidebar 
            document.getElementById('sidebar').classList.remove('sidebar-pause');
            document.getElementById('sidebarSwitch').classList.remove('sidebar-switch-pause');
            body.classList.remove(sidebarClosedClass);
            body.classList.add(sidebarOpenedClass);
            sidebarSwitch.style.display = 'block';
            publish('resize');
        }
    };

    /// //////////////
    // SAVE & LOAD //
    /// //////////////

    self.dirty = false;

    // Dirty: unsaved changes
    subscribe('whiteboard/changed', () => {
        if (!self.embedded) self.dirty = true;
    });

    // Export whiteboard as json file
    // This is now the default, because exporting in a proprietary file format
    //   provides no value and only causes issues.
    subscribe('export/json', () => {
        const element = document.createElement('a');
        element.setAttribute('href', `data:text/plain;charset=utf-8,${serializeToHumanReadableJson()}`);
        element.setAttribute('download', 'system_whiteboard.vsim.json');

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    });

    // Load/import whiteboard from a file
    function importFileHandler(mergeWithCurrent) {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = (e) => {
            // noinspection JSUnresolvedVariable
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.readAsArrayBuffer(file);
            reader.onload = (readerEvent) => loopy.whiteboard.importWhiteboard(deserializeFromArrayBuffer(readerEvent.target.result), mergeWithCurrent);
        };
        input.click();
    }

    subscribe('load/file', () => importFileHandler(false));
    subscribe('import/file', () => importFileHandler(true));

    // Create a URL for whiteboard
    self.saveToURL = function (embed) {
        // Create link
        const uri = serializeToUrl(embed);
        const base = window.location.origin + window.location.pathname;
        let historyLink = `${base}?${uri}`;

        // NO LONGER DIRTY!
        self.dirty = false;

        // PUSH TO HISTORY
        try {
            window.history.replaceState(null, null, historyLink);
        } catch (e) {
            window.location.hash = uri;
            historyLink = `${base}#${uri}`;
        }
        
        return historyLink;
    };



    // "BLANK START" DATA:

    // old proprietary data format
    // const _blankData = '[[[1,403,223,0,%22something%22,4,15,5],[2,405,382,0,%22something%2520else%22,5,15,5]],[[2,1,94,0],[1,2,89,0]],2%5D';

    // this gets updated frequently, so make the JSON easily droppable in-place for replacement
    const _blankData = `{"globals":{"valueStreamNameInput":"Product Value Stream","loopyFontSelection":"Fredoka","indicatorYellow":"70","indicatorRedLow":"100","indicatorRedMedium":"200","indicatorRedHigh":"500"},"nodes":[{"id":66,"x":-2700,"y":2600,"init":"100","label":"Start","hue":4,"size":"999","aggregationLatency":"1","loadBalancingInput":1,"loadBalancingInput0":1,"loadBalancingInput1":1,"loadBalancingInput2":1,"loadBalancingInput3":1,"loadBalancingInput4":1,"loadBalancingInput5":1,"loadBalancingInput6":1,"loadBalancingInput7":1,"loadBalancingInput8":1,"loadBalancingInput9":1,"nodeFontSelection":"Fredoka","nodeFontSize":"52","nodeBold":"bold","nodeItalic":"normal","nodeUnderline":"normal","returnRatioInput0":0,"returnRatioInput1":0,"returnRatioInput2":0,"returnRatioInput3":0,"returnRatioInput4":0,"returnRatioInput5":0,"returnRatioInput6":0,"returnRatioInput7":0,"returnRatioInput8":0,"returnRatioInput9":0},{"id":65,"x":-2700,"y":2800,"init":0,"label":"Start\nQueue","hue":4,"size":"1","aggregationLatency":"1","loadBalancingInput":1,"loadBalancingInput0":1,"loadBalancingInput1":1,"loadBalancingInput2":1,"loadBalancingInput3":1,"loadBalancingInput4":1,"loadBalancingInput5":1,"loadBalancingInput6":1,"loadBalancingInput7":1,"loadBalancingInput8":1,"loadBalancingInput9":1,"nodeFontSelection":"Fredoka","nodeFontSize":"60","nodeBold":"normal","nodeItalic":"normal","nodeUnderline":"normal","returnRatioInput0":0,"returnRatioInput1":0,"returnRatioInput2":0,"returnRatioInput3":0,"returnRatioInput4":0,"returnRatioInput5":0,"returnRatioInput6":0,"returnRatioInput7":0,"returnRatioInput8":0,"returnRatioInput9":0},{"id":67,"x":-2700,"y":3000,"init":0,"label":"New\nIdea","hue":4,"size":"3","aggregationLatency":"1","loadBalancingInput":1,"loadBalancingInput0":1,"loadBalancingInput1":1,"loadBalancingInput2":1,"loadBalancingInput3":1,"loadBalancingInput4":1,"loadBalancingInput5":1,"loadBalancingInput6":1,"loadBalancingInput7":1,"loadBalancingInput8":1,"loadBalancingInput9":1,"nodeFontSelection":"Fredoka","nodeFontSize":"60","nodeBold":"normal","nodeItalic":"normal","nodeUnderline":"normal","returnRatioInput0":0,"returnRatioInput1":0,"returnRatioInput2":0,"returnRatioInput3":0,"returnRatioInput4":0,"returnRatioInput5":0,"returnRatioInput6":0,"returnRatioInput7":0,"returnRatioInput8":0,"returnRatioInput9":0},{"id":68,"x":-2500,"y":3000,"init":0,"label":"Secure\nFunding","hue":4,"size":"20","aggregationLatency":"30","loadBalancingInput":1,"loadBalancingInput0":1,"loadBalancingInput1":1,"loadBalancingInput2":1,"loadBalancingInput3":1,"loadBalancingInput4":1,"loadBalancingInput5":1,"loadBalancingInput6":1,"loadBalancingInput7":1,"loadBalancingInput8":1,"loadBalancingInput9":1,"nodeFontSelection":"Fredoka","nodeFontSize":"56","nodeBold":"normal","nodeItalic":"normal","nodeUnderline":"normal","returnRatioInput0":"0","returnRatioInput1":0,"returnRatioInput2":0,"returnRatioInput3":0,"returnRatioInput4":0,"returnRatioInput5":0,"returnRatioInput6":0,"returnRatioInput7":0,"returnRatioInput8":0,"returnRatioInput9":0},{"id":52,"x":-2350,"y":2800,"init":"0","label":"Feature\nDefinition","hue":4,"size":"5","aggregationLatency":"3","loadBalancingInput":1,"loadBalancingInput0":1,"loadBalancingInput1":1,"loadBalancingInput2":1,"loadBalancingInput3":1,"loadBalancingInput4":1,"loadBalancingInput5":1,"loadBalancingInput6":1,"loadBalancingInput7":1,"loadBalancingInput8":1,"loadBalancingInput9":1,"nodeFontSelection":"Fredoka","nodeFontSize":"52","nodeBold":"normal","nodeItalic":"normal","nodeUnderline":"normal","returnRatioInput0":0,"returnRatioInput1":0,"returnRatioInput2":0,"returnRatioInput3":0,"returnRatioInput4":0,"returnRatioInput5":0,"returnRatioInput6":0,"returnRatioInput7":0,"returnRatioInput8":0,"returnRatioInput9":0},{"id":69,"x":-2200,"y":3000,"init":0,"label":"Prioritization","hue":4,"size":"3","aggregationLatency":"2","loadBalancingInput":1,"loadBalancingInput0":1,"loadBalancingInput1":1,"loadBalancingInput2":1,"loadBalancingInput3":1,"loadBalancingInput4":1,"loadBalancingInput5":1,"loadBalancingInput6":1,"loadBalancingInput7":1,"loadBalancingInput8":1,"loadBalancingInput9":1,"nodeFontSelection":"Fredoka","nodeFontSize":"48","nodeBold":"normal","nodeItalic":"normal","nodeUnderline":"normal","returnRatioInput0":0,"returnRatioInput1":0,"returnRatioInput2":0,"returnRatioInput3":0,"returnRatioInput4":0,"returnRatioInput5":0,"returnRatioInput6":0,"returnRatioInput7":0,"returnRatioInput8":0,"returnRatioInput9":0},{"id":53,"x":-2050,"y":2800,"init":0,"label":"Design","hue":4,"size":"9","aggregationLatency":"7","loadBalancingInput":1,"loadBalancingInput0":1,"loadBalancingInput1":1,"loadBalancingInput2":1,"loadBalancingInput3":1,"loadBalancingInput4":1,"loadBalancingInput5":1,"loadBalancingInput6":1,"loadBalancingInput7":1,"loadBalancingInput8":1,"loadBalancingInput9":1,"nodeFontSelection":"Fredoka","nodeFontSize":"60","nodeBold":"normal","nodeItalic":"normal","nodeUnderline":"normal","returnRatioInput0":0,"returnRatioInput1":0,"returnRatioInput2":0,"returnRatioInput3":0,"returnRatioInput4":0,"returnRatioInput5":0,"returnRatioInput6":0,"returnRatioInput7":0,"returnRatioInput8":0,"returnRatioInput9":0},{"id":56,"x":-1900,"y":3000,"init":0,"label":"Build","hue":4,"size":"10","aggregationLatency":"5","loadBalancingInput":1,"loadBalancingInput0":"10","loadBalancingInput1":1,"loadBalancingInput2":1,"loadBalancingInput3":1,"loadBalancingInput4":1,"loadBalancingInput5":1,"loadBalancingInput6":1,"loadBalancingInput7":1,"loadBalancingInput8":1,"loadBalancingInput9":1,"nodeFontSelection":"Fredoka","nodeFontSize":"52","nodeBold":"normal","nodeItalic":"normal","nodeUnderline":"normal","returnRatioInput0":"20","returnRatioInput1":0,"returnRatioInput2":0,"returnRatioInput3":0,"returnRatioInput4":0,"returnRatioInput5":0,"returnRatioInput6":0,"returnRatioInput7":0,"returnRatioInput8":0,"returnRatioInput9":0},{"id":60,"x":-1750,"y":2800,"init":0,"label":"Deploy","hue":4,"size":"6","aggregationLatency":"7","loadBalancingInput":1,"loadBalancingInput0":1,"loadBalancingInput1":1,"loadBalancingInput2":1,"loadBalancingInput3":1,"loadBalancingInput4":1,"loadBalancingInput5":1,"loadBalancingInput6":1,"loadBalancingInput7":1,"loadBalancingInput8":1,"loadBalancingInput9":1,"nodeFontSelection":"Fredoka","nodeFontSize":"56","nodeBold":"normal","nodeItalic":"normal","nodeUnderline":"normal","returnRatioInput0":"40","returnRatioInput1":0,"returnRatioInput2":0,"returnRatioInput3":0,"returnRatioInput4":0,"returnRatioInput5":0,"returnRatioInput6":0,"returnRatioInput7":0,"returnRatioInput8":0,"returnRatioInput9":0},{"id":63,"x":-1600,"y":3000,"init":0,"label":"Measure","hue":4,"size":"5","aggregationLatency":"1","loadBalancingInput":1,"loadBalancingInput0":1,"loadBalancingInput1":1,"loadBalancingInput2":1,"loadBalancingInput3":1,"loadBalancingInput4":1,"loadBalancingInput5":1,"loadBalancingInput6":1,"loadBalancingInput7":1,"loadBalancingInput8":1,"loadBalancingInput9":1,"nodeFontSelection":"Fredoka","nodeFontSize":"52","nodeBold":"normal","nodeItalic":"normal","nodeUnderline":"normal","returnRatioInput0":0,"returnRatioInput1":0,"returnRatioInput2":0,"returnRatioInput3":0,"returnRatioInput4":0,"returnRatioInput5":0,"returnRatioInput6":0,"returnRatioInput7":0,"returnRatioInput8":0,"returnRatioInput9":0}],"edges":[{"from":66,"to":65,"arc":0,"rotation":0,"edgeColor":"4","transparency":100,"edgeSpeed":50,"customLabel":"","edgeFontSelection":"Roboto, sans-serif","edgeFontSize":32,"edgeBold":"normal","edgeItalic":"normal","edgeUnderline":"normal"},{"from":56,"to":60,"arc":0,"rotation":0,"edgeColor":"4","transparency":100,"edgeSpeed":50,"customLabel":"","edgeFontSelection":"Roboto, sans-serif","edgeFontSize":32,"edgeBold":"normal","edgeItalic":"normal","edgeUnderline":"normal"},{"from":60,"to":63,"arc":0,"rotation":0,"edgeColor":"4","transparency":100,"edgeSpeed":50,"customLabel":"","edgeFontSelection":"Roboto, sans-serif","edgeFontSize":32,"edgeBold":"normal","edgeItalic":"normal","edgeUnderline":"normal"},{"from":67,"to":68,"arc":0,"rotation":0,"edgeColor":"4","transparency":100,"edgeSpeed":50,"customLabel":"","edgeFontSelection":"Roboto, sans-serif","edgeFontSize":32,"edgeBold":"normal","edgeItalic":"normal","edgeUnderline":"normal"},{"from":68,"to":52,"arc":0,"rotation":0,"edgeColor":"4","transparency":100,"edgeSpeed":50,"customLabel":"","edgeFontSelection":"Roboto, sans-serif","edgeFontSize":32,"edgeBold":"normal","edgeItalic":"normal","edgeUnderline":"normal"},{"from":65,"to":67,"arc":0,"rotation":0,"edgeColor":"4","transparency":100,"edgeSpeed":50,"customLabel":"","edgeFontSelection":"Roboto, sans-serif","edgeFontSize":32,"edgeBold":"normal","edgeItalic":"normal","edgeUnderline":"normal"},{"from":69,"to":53,"arc":0,"rotation":0,"edgeColor":"4","transparency":100,"edgeSpeed":50,"customLabel":"","edgeFontSelection":"Roboto, sans-serif","edgeFontSize":32,"edgeBold":"normal","edgeItalic":"normal","edgeUnderline":"normal"},{"from":52,"to":69,"arc":0,"rotation":0,"edgeColor":"4","transparency":100,"edgeSpeed":50,"customLabel":"","edgeFontSelection":"Roboto, sans-serif","edgeFontSize":32,"edgeBold":"normal","edgeItalic":"normal","edgeUnderline":"normal"},{"from":53,"to":56,"arc":0,"rotation":0,"edgeColor":"4","transparency":100,"edgeSpeed":50,"customLabel":"","edgeFontSelection":"Roboto, sans-serif","edgeFontSize":32,"edgeBold":"normal","edgeItalic":"normal","edgeUnderline":"normal"}],"labels":[{"x":-2150,"y":2500,"text":"Product Value Stream","textColor":-1,"href":"","labelFontSelection":"Roboto, sans-serif","labelFontSize":"76","labelBold":"bold","labelItalic":"normal","labelUnderline":"normal"},{"x":-2150,"y":3150,"text":"Getting Started:\n1. Click the Edit Pen and draw a few circles\n2. Draw a line between the circles\n3. Click on the circles to enter capacity and processing time\n4. Hit Play","textColor":-1,"href":"","labelFontSelection":"Roboto, sans-serif","labelFontSize":32,"labelBold":"normal","labelItalic":"normal","labelUnderline":"normal"}]}`
        .replaceAll('\n', '\\n')
        .replaceAll('\t', '')
        .replace(/\s{2,}/g, '').trim(); // remove the spacing at the front that we use for better readability

    // Create a model from a URL
    self.loadFromURL = async function () {
        let data = _getParameterByName('data');
        // if this is a new tool, this will be used to zoom out to fit the default template
        let newVsmModel = true;  
        
        if (!data) data = window.location.href.split('?')[1];
        if (!data) data = window.location.href.split('#')[1];

        // empty whiteboard data serializes to SAAA for the "save as link"
        if (data == 'SAAA') {
            // remove the ?SAAA from the end of the URL so the user is working with a plain instance with no URL params
            window.history.pushState({}, document.title, window.location.pathname);

            return; // nothing to load
        }

        if (data) {
            data = JSON.parse(
                stringFromBase64(
                    decodeURIComponent(data)
                )
            );
            data = decompressJSONdata(data);
            newVsmModel = false;
        }
        else {
            data = JSON.parse(_blankData);
        }
        loopy.whiteboard.importWhiteboard(data, false, newVsmModel);
    };

    /// ////////////////////////
    /// ///// EMBEDDED? ////////
    /// ////////////////////////

    self.init().catch((err) => {});

    // Check if embedded mode is enabled
    if (self.embedded) {
        // Hide UI elements
        self.toolbar.dom.style.display = 'none';
        self.sidebar.dom.style.display = 'none';
        document.getElementById('sidebarSwitch').style.display = 'none';
        self.playbar = document.getElementById("playbar");

        // If *NO UI AT ALL*
        const noUI = !!parseInt(_getParameterByName('no_ui')); // force to Boolean
        if (noUI) {
            self.playbar.dom.style.display = 'none';
        }

        // Fullscreen canvas
        document.getElementById('canvasses').setAttribute('fullscreen', 'yes');
        self.playbar.dom.setAttribute('fullscreen', 'yes');
        publish('resize');

        // Center & SCALE The Whiteboard
        self.whiteboard.center(true);
        subscribe('resize', () => {
            self.whiteboard.center(true);
        });

        // Autoplay!
        self.setMode(Loopy.MODE_PLAY);

        // Also, HACK: auto signal
        let signal = _getParameterByName('signal');
        if (signal) {
            signal = JSON.parse(signal);
            const node = self.whiteboard.getNode(signal[0]);
            node.takeSignal({
                delta: signal[1],
                color: node.hue,
            });
        }
    }

    self.startNew = function (excludeStartingNodes) {
        let url = window.location.pathname;

        // if excludeStartingNodes is truthy, then we want the canvas completely blank... even excluding the nodes that are given when first visiting the page
        if (excludeStartingNodes) {
            url = '?SAAA';

            window.location.href = url;
        }
        
        window.location.reload();
    }

    // NOT DIRTY, THANKS
    self.dirty = false;

    // SHOW ME, THANKS
    document.body.style.opacity = '';

    // GO.
    requestAnimationFrame(self.draw);
    
    // Prevent context mneu from showing up
    window.addEventListener('contextmenu', (event) =>{
        event.preventDefault();
    });

    self.sidebar.edit(self);
}

// Exporting for testing
exports.Loopy = Loopy;