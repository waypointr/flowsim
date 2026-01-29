/*
User Summary
When a user is in Edit mode and clicks the Hand icon - MO(V)E - in the toolbar or hits control + v,
they can enter drag/move mode. When the user clicks and drags an object, it moves around on screen.
  *If a user clicks-and-drags during “Play” mode, the screen itself moves rather than the individual
objects

Technical Summary
This JavaScript file defines a Dragger function, which is used to manage the dragging of objects (nodes, labels, edges) or the entire scene in a graphical application called Loopy.

The Dragger function takes a loopy object as a parameter, which represents the application state. 
It initializes several properties, including dragging (the object being dragged), offsetX and offsetY (the offset of the mouse position from the object's position).

The function subscribes to the mousedown event. When this event is triggered, the function checks the current mode of the application and the mouse button pressed. 
If the application is in play mode and the camera mode is 2, or if the right mouse button is pressed, it sets dragging to represent the entire scene and stores the current mouse position in offsetX and offsetY.

If the application is in edit mode, the function checks if the current tool is the drag tool and if the right mouse button is not pressed. 
If these conditions are met, it checks if a node, label, or edge is under the mouse cursor. 
If an object is found, it sets dragging to this object, calculates the offset of the mouse position from the object's position, and opens the sidebar to edit the object.

If no object is found under the mouse cursor, it sets dragging to represent the entire scene.
*/

/* This function lets user move on-screen objects while in Edit (MOVE) mode or move the screen
itself around in Play mode */
function Dragger(loopy) {
    // Identifies Loopy as app
    const self = this;
    self.loopy = loopy;

    // Dragging anything?
    self.dragging = null;
    self.offsetX = 0;
    self.offsetY = 0;

    // Checks if you're in play mode and moves screen around instead of objects
    subscribe('mousedown', () => {
        if ((self.loopy.mode === Loopy.MODE_PLAY && loopy.cameraMode === 2) || Mouse.button == 2) {
            self.dragging = { _CLASS_: 'Scene' };
            self.offsetX = Mouse.x;
            self.offsetY = Mouse.y;
        }

        // ONLY WHEN EDITING w DRAG and not mouse button 2
        if (self.loopy.mode !== Loopy.MODE_EDIT) return;
        if (self.loopy.tool !== Loopy.TOOL_DRAG) return;
        if (Mouse.button == 2 || self.loopy.zoom.preventTool) return;

        // Any node under here? If so, start dragging!
        const dragNode = loopy.whiteboard.getNodeByPoint(Mouse.x, Mouse.y);
        if (dragNode) {
            self.dragging = dragNode;
            self.offsetX = Mouse.x - dragNode.x;
            self.offsetY = Mouse.y - dragNode.y;
            loopy.sidebar.edit(dragNode); // and edit!
            sidebarSingleOrPluralLabels(dragNode);
            return;
        }

        // Any label under here? If so, start dragging!
        const dragLabel = loopy.whiteboard.getLabelByPoint(Mouse.x, Mouse.y);
        if (dragLabel) {
            self.dragging = dragLabel;
            self.offsetX = Mouse.x - dragLabel.x;
            self.offsetY = Mouse.y - dragLabel.y;
            loopy.sidebar.edit(dragLabel); // and edit!
            return;
        }

        // Any edge under here? If so, start dragging!
        const dragEdge = loopy.whiteboard.getEdgeByPoint(Mouse.x, Mouse.y);
        if (dragEdge) {
            self.dragging = dragEdge;
            self.offsetX = Mouse.x - dragEdge.labelX;
            self.offsetY = Mouse.y - dragEdge.labelY;
            loopy.sidebar.edit(dragEdge); // and edit!
            return;
        }

        self.dragging = { _CLASS_: 'Scene' };
        self.offsetX = Mouse.x;
        self.offsetY = Mouse.y;
    });

    // Drags and moves the "Scene" if the user is in Play mode
    subscribe('mousemove', () => {
        if ((self.loopy.mode === Loopy.MODE_PLAY || Mouse.button) && self.dragging && self.dragging._CLASS_ === 'Scene') {
            loopy.offsetX += (Mouse.x - self.offsetX);
            loopy.offsetY += (Mouse.y - self.offsetY);
        }

        // ONLY WHEN EDITING w DRAG and not mouse button 2
        if (self.loopy.mode !== Loopy.MODE_EDIT) return;
        if (self.loopy.tool !== Loopy.TOOL_DRAG) return;
        if (Mouse.button == 2) return;

        // moving scene/zoom
        if (self.dragging && self.dragging._CLASS_ === 'Scene') {
            loopy.offsetX += (Mouse.x - self.offsetX);
            loopy.offsetY += (Mouse.y - self.offsetY);
        }
        // If you're dragging a NODE, move it around!
        if (self.dragging && self.dragging._CLASS_ === 'Node') {
            // Whiteboard's been changed!
            publish('whiteboard/changed');

            const node = self.dragging;
            node.x = Mouse.x - self.offsetX;
            node.y = Mouse.y - self.offsetY;

            // update coz visual glitches
            loopy.whiteboard.update();
        }

        // If you're dragging an EDGE, move it around!
        if (self.dragging && self.dragging._CLASS_ === 'Edge') {
            // Whiteboard's been changed!
            publish('whiteboard/changed');

            const edge = self.dragging;
            const labelX = Mouse.x - self.offsetX;
            const labelY = Mouse.y - self.offsetY;

            if (edge.from !== edge.to) {
                // The Arc: whatever label *Y* is, relative to angle & first node's pos
                const fx = edge.from.x; const fy = edge.from.y; const tx = edge.to.x; const
                    ty = edge.to.y;
                const dx = tx - fx; const
                    dy = ty - fy;
                const a = Math.atan2(dy, dx);

                // Calculate arc
                const points = [[labelX, labelY]];
                const translated = _translatePoints(points, -fx, -fy);
                const rotated = _rotatePoints(translated, -a);
                const newLabelPoint = rotated[0];

                // ooookay.
                edge.arc = -newLabelPoint[1]; // WHY NEGATIVE? I DON'T KNOW.
            } else {
                // For SELF-ARROWS: just get angle & mag for label.
                const dx = labelX - edge.from.x;
                const dy = labelY - edge.from.y;
                const a = Math.atan2(dy, dx);
                let mag = Math.sqrt(dx * dx + dy * dy);

                // Minimum mag
                const minimum = edge.from.radius + 25;
                if (mag < minimum) mag = minimum;

                // Update edge
                edge.arc = mag;
                edge.rotation = a * (360 / Math.TAU) + 90;
            }

            // update coz visual glitches
            loopy.whiteboard.update();
        }

        // If you're dragging a LABEL, move it around!
        if (self.dragging && self.dragging._CLASS_ === 'Label') {
            // Whiteboard's been changed!
            publish('whiteboard/changed');

            const label = self.dragging;
            label.x = Mouse.x - self.offsetX;
            label.y = Mouse.y - self.offsetY;

            // update coz visual glitches
            loopy.whiteboard.update();
        }
    });
    subscribe('mouseup', () => {

        // if we're dragging a node, label, or edge add it to the queue
        if (self.dragging && ['Node', 'Edge', 'Label'].includes(self.dragging._CLASS_)) {
            publish('actionsQueue');
        }

        // Let go!
        self.dragging = null;
        self.offsetX = 0;
        self.offsetY = 0;

    });

    // move the canvas when two fingers slide on trackpad
    self.trackpadMove = function (deltaX, deltaY) {
        loopy.offsetX -= deltaX;
        loopy.offsetY -= deltaY;
    };
}
