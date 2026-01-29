/** ************************************************************************************************
User Summary
The Whiteboard is the canvas that the user sees and draws on. When the nodes, edges, and labels are drawn
they are added to the canvas for the user to interact with in edit mode or play mode. The camera
movement that happens in play mode is part of this class.

Technical Summary
The Whiteboard class is responsible for establishing the canvas and context for the whiteboard. It includes methods for adding and removing nodes, edges, and labels on the whiteboard. 
It also provides methods for updating, drawing, and managing these elements on the whiteboard.

The class has functionalities to import a saved whiteboard, clear the whiteboard, center it, and determine its boundaries. 
It can identify a node, edge, or label based on a point on the whiteboard.

It also has capabilities to manage an action queue, including adding and removing actions. 
The class can adjust the camera for load balancing and apply zoom transformations based on loopy offsets and canvas size.

It can determine the boundaries for load balancing and calculate the final offset values for this purpose. 
It can select the speed multiplier for camera movement and adjust the camera for load balancing.

The class can clear the nodes' work in progress and process initial work-in-progress units for each node. 
It can determine the maximum node id and update multiple inputs for load balancing and return ratio.

It includes safeguards to prevent a node from having excessive connections and an edge from connecting to itself or the same node. 
It can remove all associated TO and FROM edges and retrieve all edges with a start node and end node.

************************************************************************************************* */

function Whiteboard(loopy) {
    const self = this;
    self.loopy = loopy;
    
    // Properties
    self.speed = 0.05;

    loopy.cameraMode = 2;

    // Create canvas & context
    const canvas = _createCanvas();
    const ctx = canvas.getContext('2d');
    self.canvas = canvas;
    self.context = ctx;

    // Applying zoom for selected load balance
    self.nodeZoomToNode = false;
    self.finalOffsetX = "";
    self.finalOffsetY = "";
    self.finalOffsetScale = "";

    self.overallIdleTime = 0;

    /// ////////////////
    // NODES //////////
    /// ////////////////

    // Nodes
    self.nodes = [];
    self.getNode = function (ID) {
        // loop through the nodes
        for (const element of self.nodes) {
            if (element.id == ID) {
                return element;
            }
        }
    };

    // Add Node
    self.addNode = function (config, addToQueue) {

        // Add Node
        const node = new Node(self, config);
        let isFirstNode = false;

        if (self.nodes.length == 0) {
            isFirstNode = true;
        }

        self.nodes.push(node);

        // NOTE: !node.id is supposed to trigger for a node missing an id, but it also
        // triggers for node.id == 0. This could cause bugs in the future.
        if (!node.id) {

            if (isFirstNode) {
                node.id = 0;
            }
            else {
                let nodeMax = self.getNodeIdMax();
                node.id = nodeMax + 1;
            }
        }

        setPageTargetForTextboxInputEvents(node);
        self.update();

        // Whiteboard's been changed!
        publish('whiteboard/changed');

        if(addToQueue != false) {
            publish('actionsQueue');
        }

        return node;

    };

    // Remove Node
    self.removeNode = function (node, addToQueue) {

        if (node) node.unsubscribeAll();

        // Remove from array
        self.nodes.splice(self.nodes.indexOf(node), 1);

        // Remove all associated TO and FROM edges
        for (let i = 0; i < self.edges.length; i++) {
            const edge = self.edges[i];
            if (edge.to === node || edge.from === node) {
                edge.kill();
                i--; // move index back, coz it's been killed
            }
        }

        // Whiteboard's been changed!
        publish('whiteboard/changed');

        if(addToQueue != false) {
            publish('actionsQueue', [true]);
        }

    };

    // makes sure id's don't overlap
    self.getNodeIdMax = function () {
        let max = 0;
        for(let node of self.nodes) {
            if(node.id > max) {
                max = node.id;
            }
        }
        return max;
    }
    
    // sets the work in progress of every node to 0 and clears all setTimeouts
    self.clearNodesWIP = function() {
        for(let node of self.nodes) {
            node.wip = 0;
            for(let timeout of node.timeouts) {
                clearTimeout(timeout.timeout);
            }
            node.timeouts = [];
        }
    }

    // Processes initial wip units for every node
    // Used when initially playing or resetting whiteboard
    self.nodesWithWIP = function(){

        self.nodes.forEach((n) => n.loadBalancePopulate());
        self.nodes.forEach((n) => n.nodeSentToPopulate());
        self.nodes.forEach((n) => n.returnRatioPopulate());


        const nodes = self.nodes.filter((n) => n.init > 0);
        for (const node of nodes) {
            const wip = Math.round((node.init / 100) * node.size);
            for(let i = 0; i < wip; i++) {
                node.totalNumOfWorkItems++;
                node.processSignal({
                    delta: 1,
                    color: node.hue,
                });
            }     
        }
    }

    self.selfGenerateWorkItems = function(){
        const nodes = self.nodes.filter((n) => n.generateVolume > 0);
        for(const node of nodes) {
            node.selfGenerate();
        }
    }

    /// ////////////////
    // EDGES //////////
    /// ////////////////

    // Edges
    self.edges = [];

    // Add edge
    self.addEdge = function (config, addToQueue) {

        // check if node can add more connections
        if (!self.canAddMoreEdgesFromNode(config.from) || !self.canAddMoreEdgesToNode(config.to) || self.edgeTryingToConnectToSelf(config) || self.edgeTryingToConnectToSameNode(config)) {
            return null;
        }

        // Add Edge
        const edge = new Edge(self, config);
        self.edges.push(edge);
        setPageTargetForTextboxInputEvents(edge);
        self.update();

        // Whiteboard's been changed!
        publish('whiteboard/changed');
        
        if(addToQueue != false) {
            publish('actionsQueue');
        }

        return edge;
    };

    // Remove edge
    self.removeEdge = function (edge, addToQueue) {

        if(edge){
            let node = edge.from;
            let edgeList = self.getEdgesByStartNode(node);
            let edgeListLength = edgeList.length;
            let edgeIndex;

            // Finding edge index
            for (let i = 0; i < edgeListLength; i++){
                if(edgeList[i].to == edge.to){
                    edgeIndex = i;
                    break;
                }
            }

            let returnRationode = edge.to;
            let returnRatioEdgeList = self.getEdgesByEndNode(returnRationode);
            let returnRatioedgeListLength = returnRatioEdgeList.length;
            let returnRatioedgeIndex;
            
            for (let i = 0; i < returnRatioedgeListLength; i++){
                if(returnRatioEdgeList[i].from == edge.from){
                    returnRatioedgeIndex = i;
                    break;
                }
            }


            // From the edgeIndex updating values after the current edge
            self.updateMultiInputs("loadBalancingInput", edgeIndex, node, 1);
            self.updateMultiInputs("returnRatioInput", returnRatioedgeIndex, returnRationode, 0);
        }
        

        // Remove edge
        self.edges.splice(self.edges.indexOf(edge), 1);

        // Whiteboard's been changed!
        publish('whiteboard/changed');
        if(loopy.sidebar.currentPage.target._CLASS_ == 'Node') {
            loopy.sidebar.currentPage.onedit();
        }
        if(addToQueue != false) {
            publish('actionsQueue', [true]);
        }

    };

    self.updateMultiInputs = function(elemid, edgeIndex, node, defaultValue){
        for(let i = edgeIndex; i < 9; i++){
            node[`${elemid}${i}`] = node[`${elemid}${i+1}`];
            let elem = document.getElementById(`${elemid}${i}`);
            if(elem){
                elem.value = node[`${elemid}${i+1}`];
            } 
        }
        node[`${elemid}9`] = defaultValue;
    };

    // prevents a node from having too many connections
    self.canAddMoreEdgesFromNode  = function (nodeId) {

        const maxConnection = 10;

        // get start node
        const node = self.getNode(nodeId);

        // get the number of edges
        const length = self.getEdgesByStartNode(node).length;

        if (length >= maxConnection ) {

            const errorDetails = {
                title: 'Too Many Connectors',
                message: 'A node can only connect to 10 nodes.'
             };
            // popup
            publish("modal", ["error", errorDetails]);

            return false;
        }
        return true;
    };

    // prevents a node from having too many connections
    self.canAddMoreEdgesToNode  = function (nodeId) {

        const maxConnection = 10;

        // get start node
        const node = self.getNode(nodeId);

        // get the number of edges
        const length = self.getEdgesByEndNode(node).length;

        if (length >= maxConnection ) {

            const errorDetails = {
                title: 'Too Many Connectors',
                message: 'A node can only connect to 10 nodes.'
             };
            // popup
            publish("modal", ["error", errorDetails]);

            return false;
        }
        return true;
    };

    self.edgeTryingToConnectToSelf = function (config) {
        return config.to == config.from;
    };

    self.edgeTryingToConnectToSameNode = function (config) {
       for(let edge of self.edges){
            if(edge.from.id == config.from && edge.to.id == config.to){
                return true;
            }
       }
        return false;
    };


    // Get all edges with start node
    self.getEdgesByStartNode = function (startNode) {
        return self.edges.filter((edge) => (edge.from === startNode));
    };
    // Get all edges with end node
    self.getEdgesByEndNode = function (endNode) {
        return self.edges.filter((edge) => (edge.to === endNode));
    };

    /// ////////////////
    // LABELS /////////
    /// ////////////////

    // Labels
    self.labels = [];

    // Add label
    self.addLabel = function (config, addToQueue) {

        // Add label
        const label = new Label(self, config);
        self.labels.push(label);
        setPageTargetForTextboxInputEvents(label);
        self.update();

        // Whiteboard's been changed!
        publish('whiteboard/changed');
        
        if(addToQueue != false) {

            // only adds to queue if the label is changed from ...
            if (label.config.text != "..." && label.config.text != "") {
                publish('actionsQueue');
            }
        }

        return label;
    };

    // Remove label
    self.removeLabel = function (label, addToQueue) {

        // Remove label
        self.labels.splice(self.labels.indexOf(label), 1);

        // Whiteboard's been changed!
        publish('whiteboard/changed');
        
        if(addToQueue != false) {
            publish('actionsQueue', [true]);
        }
    };


    /// ////////////////
    // UPDATE & DRAW //
    /// ////////////////

    let _canvasDirty = false;

    // Calls the update method in the edge and Node classes on all edges and nodes
    self.update = function () {
        // Update edges THEN nodes
        for(let edge of self.edges) {
            edge.update();
        }

        let sum = 0;
        for(let node of self.nodes) {
            // calculate overall idle time for the whiteboard
            node.update();
            sum += node.idleTime;
        }


        self.overallIdleTime = sum;


        // Dirty!
        _canvasDirty = true;
    };

    // SHOULD WE DRAW?
    const drawCountdownFull = 7 * 60; // two-second buffer!
    let drawCountdown = drawCountdownFull;

    // ONLY IF MOUSE MOVE / CLICK
    subscribe('mousemove', () => { drawCountdown = drawCountdownFull; });
    subscribe('mousedown', () => { drawCountdown = drawCountdownFull; });

    // OR INFO CHANGED
    subscribe('whiteboard/changed', () => {
        if (self.loopy.mode === Loopy.MODE_EDIT) drawCountdown = drawCountdownFull;
    });


    // add actions to the queue
    subscribe('actionsQueue', (removed) => {
        // !removed helps with the eraser tool
        if (!removed) {
            const loopyActions = loopy.saveLoopyAttributes();
            loopy.actions.addAction(self, loopyActions);
        }
    });



    // OR RESIZE or RESET
    subscribe('resize', () => { drawCountdown = drawCountdownFull; });
    subscribe('whiteboard/reset', () => { 
        drawCountdown = drawCountdownFull;
        self.clearNodesWIP();
        self.overallIdleTime = 0;
     });
    subscribe('loopy/mode', () => {
        if (loopy.mode === Loopy.MODE_PLAY) {
            drawCountdown = drawCountdownFull * 2;
        } else {
            drawCountdown = drawCountdownFull;
        }
    });

    // Draws all Nodes, edges, labels on the canvas
    self.draw = function () {
        // SHOULD WE DRAW?
        // ONLY IF ARROW-SIGNALS ARE MOVING
        for(let edge of self.edges) {
            if (edge.signals.length > 0) {
                drawCountdown = drawCountdownFull;
                break;
            }
        }

        // DRAW???????
        drawCountdown--;
        if (drawCountdown <= 0) return;

        // Also only draw if last updated...
        if (!_canvasDirty) return;
        _canvasDirty = false;

        // Need to remove
        if (self.nodeZoomToNode) {
            self.moveCameraLoadBalance();
        }

        // Clear!
        ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);

        // Translate
        ctx.save();
        applyZoomTransform(ctx);

        // Draw labels THEN edges THEN nodes
        for (let label of self.labels) label.draw(ctx);
        for (let edge of self.edges) edge.draw(ctx);
        for (let node of self.nodes) node.draw(ctx);

        if (loopy.mode == Loopy.MODE_PLAY) {
            for(let node of self.nodes) {
                node.drawFloatDisplay(ctx);
                node.bottleneckStatus(ctx);
            }
        }

        // Restore
        ctx.restore();
    };

    /// ///////////////
    // import Whiteboard //
    /// ///////////////

    // Imports saved loopy whiteboards, also allows for current whiteboard to be merged with saved whiteboard
    self.importWhiteboard = (newWhiteboard, mergeWithCurrent = false, newVsmModel = false) => {
        if (mergeWithCurrent) newWhiteboard = bumpIdsToAvoidMergeCollision(newWhiteboard);
        else self.clear();

        for (const key in newWhiteboard.globals)loopy[key] = newWhiteboard.globals[key];
        if (loopy.embed) loopy.embedded = 1;

        // import entities data.
        newWhiteboard.nodes.forEach((n) => self.addNode(n));
        newWhiteboard.edges.forEach((n) => self.addEdge(n));
        newWhiteboard.labels.forEach((n) => self.addLabel(n));

        setTimeout(() => {
            const need = self.getBounds();
            const available = document.getElementById('canvasses');
            if (need.left < 0 || need.top < 0 || need.right > available.clientWidth || need.bottom > available.clientHeight) self.center(true);
            else self.center(false);
            // If showing default model, zoom out
            if(newVsmModel) {
                self.loopy.zoom.zoomOut();
            }
            // Otherwise, show the actual zoom percentage
            else{
                calculatePercentage();
            }
        }, 0); // do it when loopy is fully load, else it's sheety

    };

    // Clears the canvas
    self.clear = function () {
        // Just kill ALL nodes.
        while (self.nodes.length > 0) {
            self.nodes[0].kill();
        }

        // Just kill ALL labels.
        while (self.labels.length > 0) {
            self.labels[0].kill();
        }
    };

    /// /////////////////
    // HELPER METHODS //
    /// /////////////////

    // Gets node based on x,y cords. Helps with checking if you clicked on a node.
    self.getNodeByPoint = function (x, y, buffer) {
        for (let i = self.nodes.length - 1; i >= 0; i--) { // top-down
            const node = self.nodes[i];
            if (node.isPointInNode(x, y, buffer)) return node;
        }
        return null;
    };

    // Gets edge based on x,y cords. Helps with checking if you clicked on a edge.
    self.getEdgeByPoint = function (x, y, erase) {
        for (let i = self.edges.length - 1; i >= 0; i--) { // top-down
            const edge = self.edges[i];

            // converting the mouse coordinates into coordinates relative to the edge
            let lx = (2 * x * Math.cos(edge.a) - edge.fx * Math.cos(edge.a) + 2 * y * Math.sin(edge.a) - edge.fy * Math.sin(edge.a)) / (Math.pow(Math.cos(edge.a), 2) + Math.pow(Math.sin(edge.a), 2));
            let ly = (2 * y * Math.cos(edge.a) - edge.fy * Math.cos(edge.a) - 2 * x * Math.sin(edge.a) + edge.fx * Math.sin(edge.a)) / (Math.pow(Math.sin(edge.a), 2) + Math.pow(Math.cos(edge.a), 2));

            let buffer = 50;
            if (erase) {
                buffer = 20;
            }
            // loops through the connector position to see if the clicked point is within the buffer
            for (let j = 0; j < 1; j += .01) { // .01 is terrible for efficiency but had to be used for really long edges
                let positionAlongArrow = edge.getPositionAlongArrow(j);
                let positionAlongArrowX = positionAlongArrow.x;
                let positionAlongArrowY = positionAlongArrow.y;

                if (lx <= positionAlongArrowX + buffer && lx >= positionAlongArrowX - buffer && ly <= positionAlongArrowY + buffer && ly >= positionAlongArrowY - buffer) {
                    return edge;
                }
            }
        }
        return null;
    };

    // Gets label based on x,y cords. Helps with checking if you clicked on a label.
    self.getLabelByPoint = function (x, y) {
        for (let i = self.labels.length - 1; i >= 0; i--) { // top-down
            const label = self.labels[i];
            if (label.isPointInLabel(x, y)) return label;
        }
        return null;
    };

    // Click to edit!
    subscribe('mouseclick', () => {
        // ONLY WHEN EDITING (and NOT erase)
        if (self.loopy.mode !== Loopy.MODE_EDIT) return;
        if (self.loopy.tool === Loopy.TOOL_ERASE) return;

        // Did you click on a node? If so, edit THAT node.
        const clickedNode = self.getNodeByPoint(Mouse.x, Mouse.y);
        if (clickedNode) {
            loopy.sidebar.edit(clickedNode);
            sidebarSingleOrPluralLabels(clickedNode);
            return;
        }

        // Did you click on a label? If so, edit THAT label.
        const clickedLabel = self.getLabelByPoint(Mouse.x, Mouse.y);
        if (clickedLabel) {
            loopy.sidebar.edit(clickedLabel);
            return;
        }

        // Did you click on an edge? If so, edit THAT edge.
        const clickedEdge = self.getEdgeByPoint(Mouse.x, Mouse.y);
        if (clickedEdge) {
            loopy.sidebar.edit(clickedEdge);
            return;
        }

        // If the tool LABEL? If so, TRY TO CREATE LABEL.
        if (self.loopy.tool === Loopy.TOOL_LABEL) {
            loopy.label.tryMakingLabel();
            return;
        }

        // Otherwise, go to main Edit page.
        loopy.sidebar.showPage('Loopy');
    });

    // Allows for zoom on the canvas
    subscribe('mousewheel', (mouse) => {
        // ONLY WHEN EDITING (or MODE_PLAY in freeCam)
        loopy.zoom.mouseWheelZoom(mouse);
    });

    // Centering & Scaling. Help get bounds of all object for all cameraModes.
    self.getBounds = function (visible = true) {
        // If no nodes & no labels, forget it.
        if (self.nodes.length === 0 && self.labels.length === 0) return;

        let bounds = {};
        // Get bounds of ALL objects...
        const _testObjects = function (objects) {
            for(let obj of objects) {
                if (obj.hide === true) continue;
                bounds = mergeBounds(bounds, obj.getBoundingBox());
            }

        };
        _testObjects(self.nodes);
        _testObjects(self.edges);
        _testObjects(self.labels);
        return bounds;
    };

    self.fitBounds = function (size) {
        const bounds = self.getBounds();

        if (!bounds) {
            return;
        }

        let addX = 0;
        let addY = 0;
        let ratio = 1;
        if (bounds.left < 0) addX -= bounds.left;
        if (bounds.top < 0) addY -= bounds.top;
        if (bounds.right > size || bounds.right - bounds.left > size) {
            addX -= bounds.left;
            ratio = Math.min(ratio, size / (bounds.right - bounds.left));
        }
        if (bounds.bottom > size || bounds.bottom - bounds.top > size) {
            addY -= bounds.top;
            ratio = Math.min(ratio, size / (bounds.bottom - bounds.top));
        }
        self.nodes.forEach((n) => { n.x = (n.x + addX) * ratio; n.y = (n.y + addY) * ratio; });
        self.labels.forEach((n) => { n.x = (n.x + addX) * ratio; n.y = (n.y + addY) * ratio; });
    };


    // Adds a speed multiplier so that camera moves faster when farther away and slows down when closer
    self.chooseSpeedMultiplier = function (offsetDiff, speed, ratio) {
        const multiplier = offsetDiff / speed / ratio;
        if (multiplier > 1) {
            return multiplier;
        } 
        return 1; 
    }

    self.moveCameraLoadBalance = function () {

        // speed at which x and y move
        const speed = 15;
        // buffer so value are not the same when comparing
        const speedOffset = 5;
        // Slows down multiplier
        const speedRatio = 10;
        // speed at which scale moves
        const scaleSpeed = 0.01;
        // speeds up visual zoom
        const scaleSpeedMultiplier = 4;
        // buffer so value are not the same when comparing
        const scaleSpeedOffset = 0.1;
        // slows down scale ratio
        const scaleRatio = 2;

        // stops the animation once reached and before zoom
        let xStop = false;
        let yStop = false;
        let scaleStop = false;

        // Offset x
        if (Math.abs(loopy.offsetX - self.finalOffsetX) >= speed + speedOffset) {
            const multiplier = self.chooseSpeedMultiplier(Math.abs(loopy.offsetX - self.finalOffsetX), speed + speedOffset, speedRatio);
            // Greater than
            if (loopy.offsetX > self.finalOffsetX) {
                loopy.offsetX = loopy.offsetX - (speed * multiplier);
            // Less than
            } else if (loopy.offsetX < self.finalOffsetX) {
                loopy.offsetX = loopy.offsetX + (speed * multiplier);            
            }
        } else {
            xStop = true;
        }
        // Offset y
        if (Math.abs(loopy.offsetY - self.finalOffsetY) >= speed + speedOffset) {
            const multiplier = self.chooseSpeedMultiplier(Math.abs(loopy.offsetY - self.finalOffsetY), speed + speedOffset, speedRatio);
            // Greater than
            if (loopy.offsetY > self.finalOffsetY) {
                loopy.offsetY = loopy.offsetY - (speed * multiplier);
            // Less than
            } else if (loopy.offsetY < self.finalOffsetY) {
                loopy.offsetY = loopy.offsetY + (speed * multiplier);            
            }
        } else {
            yStop = true;
        }
        // Offset Scale
        if(xStop && yStop && (Math.abs(loopy.offsetScale - self.finalOffsetScale) >= scaleSpeedOffset + scaleSpeed)) {
            const multiplier = self.chooseSpeedMultiplier(Math.abs(loopy.offsetScale - self.finalOffsetScale), scaleSpeedOffset + scaleSpeed, scaleRatio);
            let scale;
            if (loopy.offsetScale > self.finalOffsetScale) {
                scale = loopy.offsetScale - (scaleSpeed * scaleSpeedMultiplier * multiplier);
            
            } else if (loopy.offsetScale < self.finalOffsetScale) {
                scale = loopy.offsetScale + (scaleSpeed * scaleSpeedMultiplier * multiplier);
            }   
            // check to see if scale is in bounds
            loopy.offsetScale = withinLimits(scale);
            // update zoom percentage and sets last zoom
            calculatePercentage(); 
        } else {
            scaleStop = true;
        }

        // stops animation
        if (xStop && yStop && scaleStop) {
            self.nodeZoomToNode = false;
        }
    };



    // Get the bounds for load balance
    self.getBoundsForLoadBalance = function (startNode, endNode) {
        let bounds = {};
        // Get bounds of both nodes
        for (let node of [startNode, endNode]) {
            bounds = mergeBounds(bounds, node.getBoundingBox());
        }

        return bounds;
    };

    self.getFinalOffsetValues = function() {
        let bounds;
        let left ;
        let top;
        let right;
        let bottom;
        let cx;
        let cy;

        for (let node of self.nodes) {
            if (node.nodeRatioHighlight != "") {
                bounds = self.getBoundsForLoadBalance(node, node.nodeRatioHighlight);
                left = bounds.left
                top = bounds.top;
                right = bounds.right;
                bottom = bounds.bottom;

                cx = (left + right) / 2;
                cy = (top + bottom) / 2;
            }
        }

        const canvasses = document.getElementById('canvasses');
        const fitWidth = canvasses.clientWidth - (_PADDING * 2);
        const fitHeight = canvasses.clientHeight - (_PADDING * 2);

        // set the final offset x and y
        self.finalOffsetX = ((_PADDING + fitWidth) / 2 - cx);
        self.finalOffsetY = ((_PADDING + fitHeight) / 2 - cy);

        const w = right - left;
        const h = bottom - top;

        // Wider or taller than screen?
        const whiteboardRatio = w / h;
        const screenRatio = fitWidth / fitHeight;
        let scaleRatio;
        if (whiteboardRatio > screenRatio) {
            // wider...
            scaleRatio = fitWidth / w;
        } else {
            // taller...
            scaleRatio = fitHeight / h;
        }
        // set the final offset scale
        self.finalOffsetScale = scaleRatio / 2;


    }





    // Centers the camera bases on the bounds of the scene
    self.center = function (andScale, loadBalance = false) {

        // If no nodes & no labels, forget it.
        if (self.nodes.length === 0 && self.labels.length === 0) return;

        // Get bounds of ALL objects...
        let bounds = self.getBounds();
        let { left, top, right, bottom } = bounds;

        // Re-center!
        const canvasses = document.getElementById('canvasses');
        const fitWidth = canvasses.clientWidth - (_PADDING * 5);
        const fitHeight = canvasses.clientHeight - (_PADDING * 5);

        let cx = (left + right) / 2;
        let cy = (top + bottom) / 2;

        loopy.offsetX = (_PADDING * 9 + fitWidth) / 2 - cx;
        loopy.offsetY = (_PADDING + fitHeight) / 2 - cy;

        // SCALE.
        if (andScale) {
            const w = right - left;
            const h = bottom - top;

            // Wider or taller than screen?
            const whiteboardRatio = w / h;
            const screenRatio = fitWidth / fitHeight;
            let scaleRatio;
            if (whiteboardRatio > screenRatio) {
                // wider...
                scaleRatio = fitWidth / w;
            } else {
                // taller...
                scaleRatio = fitHeight / h;
            }

            // Loopy, then!
            loopy.offsetScale = scaleRatio;
        }
    };
}

// Helper function to get offsetScale, offsetX, offsetY of loopy and the canvas width and height to calculate the real offset.
function offsetToRealOffset(scale, offsetX, offsetY) {
    const canvasses = document.getElementById('canvasses');
    const CW = canvasses.clientWidth - _PADDING - _PADDING;
    const CH = canvasses.clientHeight - _PADDING_BOTTOM - _PADDING;
    // const tx = offsetX*2*scale + canvasses.clientWidth*(1 - scale) - _PADDING*(2 + scale)
    let translateX = offsetX * 2;
    let translateY = offsetY * 2;
    translateX -= CW + _PADDING;
    translateY -= CH + _PADDING;
    translateX = scale * translateX;
    translateY = scale * translateY;
    translateX += CW + _PADDING;
    translateY += CH + _PADDING;
    if (loopy.embedded) {
        translateX += _PADDING; // dunno why but this is needed
        translateY += _PADDING; // dunno why but this is needed
    }
    return { scale, translateX, translateY };
}

// Applies the zoom transformation based on the loopy offsets and canvas size
function applyZoomTransform(ctx) {
    // Translate to center, (translate, scale, translate) to expand to size
    const real = offsetToRealOffset(loopy.offsetScale, loopy.offsetX, loopy.offsetY);
    ctx.setTransform(real.scale, 0, 0, real.scale, real.translateX, real.translateY);
}
// camera misc
function fitToBounds() {
    const canvasses = document.getElementById('canvasses');
    const fitWidth = canvasses.clientWidth - _PADDING - _PADDING;
    const fitHeight = canvasses.clientHeight - _PADDING_BOTTOM - _PADDING;
    return {
        left: _PADDING,
        top: _PADDING,
        right: fitWidth + _PADDING,
        bottom: fitHeight + _PADDING,
        cx: (_PADDING + fitWidth) / 2,
        cy: (_PADDING + fitHeight) / 2,
    };
}
function calcWidthHeight(bounds) {
    bounds.width = bounds.right - bounds.left;
    bounds.height = bounds.bottom - bounds.top;
}
function calcCenteredWidthHeight(bounds) {
    if (typeof bounds.cx === 'undefined' || typeof bounds.cy === 'undefined') {
        bounds.cx = (bounds.right + bounds.left) / 2;
        bounds.cy = (bounds.bottom + bounds.top) / 2;
    }
    bounds.width = 2 * Math.max(bounds.right - bounds.cx, bounds.cx - bounds.left);
    bounds.height = 2 * Math.max(bounds.bottom - bounds.cy, bounds.cy - bounds.top);
}


