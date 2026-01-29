/*
User Summary
Edge.js is used for creating and managing connections between nodes in a graph. Edges are the
connection arrows between nodes. The edges pass signals from node to node.

Technical Summary
This JavaScript file defines an Edge class that represents the connections between nodes in a
application called Loopy. The Edge class has properties such as from, to, arc, rotation, signals,
and signalSpeed. The Edge class has methods for adding signals, updating signals, drawing signals,
and removing signals. The Edge class also has methods for updating and drawing the edge itself.
*/



// Array to hold all signals in the system
Edge.allSignals = [];
// Max number of signals allowed in the system
Edge.MAX_SIGNALS = 100;
// Max number of signals allowed on a single edge
Edge.MAX_SIGNALS_PER_EDGE = 10;
// Class name for the Edge object
Edge._CLASS_ = 'Edge';

// Constructor for the Edge object
function Edge(whiteboard, config) {
    const self = this;
    self._CLASS_ = 'Edge';

    // Reference to the Loopy object
    self.loopy = whiteboard.loopy;
    // Reference to the Whiteboard object
    self.whiteboard = whiteboard;
    // Configuration object for the Edge
    self.config = config;

    // Default values...
    const defaultProperties = {
        from: _makeErrorFunc("CAN'T LEAVE 'FROM' BLANK"),
        to: _makeErrorFunc("CAN'T LEAVE 'TO' BLANK"),
        arc: 100,
        rotation: 0,
    };
    setStoredPropertyDefaults(defaultProperties, Edge);
    _configureProperties(self, config, defaultProperties);

    // Get the source and target nodes
    self.from = whiteboard.getNode(self.from);
    self.to = whiteboard.getNode(self.to);

    // Array to hold all signals on this edge
    self.signals = [];
    // Array to hold the reversed signals
    self.reverseSignals = [];
    // Array to hold all signals while paused
    self.signalsPaused = [];
    self.reverseSignalsPaused = [];
    // Was paused pressed
    self.wasPaused = false;
    // Speed of the signals on this edge
    self.signalSpeed = 0;


    // Function to add a signal to the edge
    self.addSignal = function (signal) {
        
        // If there are too many signals in the system, ignore the new signal
        if (Edge.allSignals.length > Edge.MAX_SIGNALS) {
            return;
        }

        // If the edge already has too many signals, ignore the new signal
        if (self.signals.length > Edge.MAX_SIGNALS_PER_EDGE) {
            return;
        }

        // Re-create signal
        let age;
        if (signal.age === undefined) {
            age = 1000000; // actually just make signals last "forever".
        } else age = signal.age - 1;

        // Create a new signal object
        const newSignal = {
            delta: signal.delta,
            position: 0,
            scaleX: Math.abs(signal.delta),
            scaleY: signal.delta,
            color: colorAndTransparency(self.transparency),
            finalColor: colorAndTransparency(self.transparency),
            age,
        };

        // If the signal is expired (age <= 0), return and do nothing.
        if (age <= 0) return;

        // Add the new signal to the beginning of the signals array
        self.signals.unshift(newSignal); // it's a queue!

        // Add the new signal to the global array of signals
        Edge.allSignals.push(newSignal);
    };

    self.addReverseSignal = function (signal) {
        // If there are too many signals in the system, ignore the new signal
        if (Edge.allSignals.length > Edge.MAX_SIGNALS) {
            return;
        }

        // If the edge already has too many signals, ignore the new signal
        if (self.reverseSignals.length > Edge.MAX_SIGNALS_PER_EDGE) {
            return;
        }

        // Re-create signal
        let age;
        if (signal.age === undefined) {
            age = 1000000; // actually just make signals last "forever".
        } else age = signal.age - 1;

        // Create a new signal object
        const newSignal = {
            delta: signal.delta,
            position: 1,
            scaleX: Math.abs(signal.delta),
            scaleY: signal.delta,
            color: colorAndTransparency(self.transparency),
            finalColor: colorAndTransparency(self.transparency),
            age,
        };

        // If the signal is expired (age <= 0), return and do nothing.
        if (age <= 0) return;

        // Add the new signal to the beginning of the signals array
        self.reverseSignals.unshift(newSignal); // it's a queue!

        // Add the new signal to the global array of signals
        Edge.allSignals.push(newSignal);
    };

    self.updateSignals = function () {
        // Set default edge speed.
        const defaultEdgeSpeed = 50;
        // Calculate speed for that specfic edge.
        const edgeSpeed = (self.edgeSpeed - defaultEdgeSpeed) / 25;
        // Calculate speed based on loopy speed slider and edgeSpeed 
        let speed = (2 ** self.loopy.signalSpeed) * (2 ** edgeSpeed);
        // Limit max speed to 100
        if (speed > 100) speed = 100;
        // Calculate signalSpeed based on speed and arrow length
        self.signalSpeed = speed / (self.getArrowLength() / 1.5);

        // Move all signals along the arrow
        for (let i = 0; i < self.signals.length; i++) {
            const signal = self.signals[i];
            // var lastPosition = signal.position;
            signal.position += self.signalSpeed;

            // Signal position (for camera)
            const signalPosition = self.getPositionAlongArrow(signal.position);
            signal.x = (fx + Math.cos(a) * signalPosition.x - Math.sin(a) * signalPosition.y) / 2; // un-retina
            signal.y = (fy + Math.sin(a) * signalPosition.x + Math.cos(a) * signalPosition.y) / 2; // un-retina

            
        }

        // If any signals reach >=1, pass 'em along
        let lastSignal = self.signals[self.signals.length - 1];
        while (lastSignal && lastSignal.position >= 1) {
            lastSignal.color = lastSignal.finalColor;

            // Remove the signal from this edge
            self.removeSignal(lastSignal);
            lastSignal = self.signals[self.signals.length - 1];
        }
    };

    self.updateReverseSignals = function () {
        // Set default edge speed.
        const defaultEdgeSpeed = 50;
        // Calculate speed for that specfic edge.
        const edgeSpeed = (self.edgeSpeed - defaultEdgeSpeed) / 25;
        // Calculate speed based on loopy speed slider and edgeSpeed 
        let speed = (2 ** self.loopy.signalSpeed) * (2 ** edgeSpeed);
        // Limit max speed to 100
        if (speed > 100) speed = 100;
        // Calculate signalSpeed based on speed and arrow length
        self.signalSpeed = speed / (self.getArrowLength() / 1.5);

        // Move all signals along the arrow
        for (let i = 0; i < self.reverseSignals.length; i++) {
            const signal = self.reverseSignals[i];
            signal.position -= self.signalSpeed;

            // Signal position (for camera)
            const signalPosition = self.getPositionAlongArrow(signal.position);
            signal.x = (fx + Math.cos(a) * signalPosition.x - Math.sin(a) * signalPosition.y) / 2; // un-retina
            signal.y = (fy + Math.sin(a) * signalPosition.x + Math.cos(a) * signalPosition.y) / 2; // un-retina
        }

        // If any signals reach >=1, pass 'em along
        let lastSignal = self.reverseSignals[self.reverseSignals.length - 1];
        while (lastSignal && lastSignal.position <= 0) {
            lastSignal.color = lastSignal.finalColor;
            // Remove the signal from this edge
            self.removeReverseSignal(lastSignal);
            lastSignal = self.reverseSignals[self.reverseSignals.length - 1];
        }
    };



    self.removeSignal = function (signal) {
        // Remove the signal from the array and from the global array
        self.signals.splice(self.signals.indexOf(signal), 1);
        Edge.allSignals.splice(Edge.allSignals.indexOf(signal), 1);
    };
    self.removeReverseSignal = function (signal) {
        // Remove the signal from the array and from the global array
        self.reverseSignals.splice(self.reverseSignals.indexOf(signal), 1);
        Edge.allSignals.splice(Edge.allSignals.indexOf(signal), 1);
    };

    self.getSignalBoundingBox = function (signal) {
        const size = 40 * Math.max(Math.abs(signal.scaleX), Math.abs(signal.scaleY));
        return {
            left: signal.x - size / 2,
            right: signal.x + size / 2,
            top: signal.y - size / 2,
            bottom: signal.y + size / 2,
            cx: signal.x,
            cy: signal.y,
            weight: 1,
        };
    };
    self.drawSignals = function (ctx) {
        // Draw each one
        for (let i = 0; i < self.signals.length; i++) {
            // Get position to draw at
            const signal = self.signals[i];
            const signalPosition = self.getPositionAlongArrow(signal.position);
            const signalX = signalPosition.x;
            const signalY = signalPosition.y;

            // Transform
            ctx.save();
            ctx.translate(signalX, signalY);
            ctx.rotate(-a);

            // Signal's direction & size
            const size = 17; // HARD-CODED
            ctx.scale(signal.scaleX, signal.scaleY);
            ctx.scale(size, size);

            // Signal's age = alpha.
            if (signal.age === 2) {
                ctx.globalAlpha = 0.5;
            } else if (signal.age === 1) {
                ctx.globalAlpha = 0.25;
            }
            
            // Fade circle based on start transparency and signal postion. If 15% from end fade to 0;
            let transparency = (signal.position > .85)? 0 : self.transparency - (signal.position*100);
            drawCircleAndFade(ctx, transparency);

            // Restore
            ctx.restore();
        }
    };

    self.drawReverseSignals = function (ctx) {
        // Draw each one
        for (let i = 0; i < self.reverseSignals.length; i++) {
            // Get position to draw at
            const signal = self.reverseSignals[i];

            const signalPosition = self.getPositionAlongArrow(signal.position, true);
            const signalX = signalPosition.x;
            const signalY = signalPosition.y;

            // Transform
            ctx.save();
            ctx.translate(signalX, signalY);
            ctx.rotate(-a);

            // Signal's direction & size
            const size = 17; // HARD-CODED
            ctx.scale(signal.scaleX, signal.scaleY);
            ctx.scale(size, size);

            // Signal's age = alpha.
            if (signal.age === 2) {
                ctx.globalAlpha = 0.5;
            } else if (signal.age === 1) {
                ctx.globalAlpha = 0.25;
            }
            
            // Fade circle based on start transparency and signal postion. If 15% from end fade to 0;
            let transparency = (signal.position < .15)? 0 : self.transparency - ((1 - signal.position)*100);
            drawCircleAndFade(ctx, transparency);

            // Restore
            ctx.restore();
        }
    };

    const _listenerReset = subscribe('whiteboard/reset', () => {
        self.signals = [];
        self.reverseSignals = [];
        Edge.allSignals = [];
        self.signalsPaused = [];
        self.reverseSignalsPaused = [];
        self.wasPaused = false;
    });

    /// ///////////////////////////////////
    // UPDATE & DRAW /////////////////////
    /// ///////////////////////////////////

    // Update!
    self.labelX = 0;
    self.labelY = 0;
    let fx; let fy; let tx; let ty;
    let r; let dx; let dy; let w; let a; let h;
    let y; let a2;
    let arrowBuffer; let arrowDistance; let arrowAngle; let beginDistance; let beginAngle;
    let startAngle; let endAngle;
    let y2; let begin; let end;
    let arrowLength; let ax; let ay; let aa;
    // labelAngle,
    let lx; let ly; let
        labelBuffer; // BECAUSE I'VE LOST CONTROL OF MY LIFE.
    // self.update = function(speed){
    self.update = function () {
        /// /////////////////////////////////////////////
        // PRE-CALCULATE THE MATH (for retina canvas) //
        /// /////////////////////////////////////////////


        // Edge case: if arc is EXACTLY zero, whatever, add 0.1 to it.
        if (self.arc === 0) self.arc = 0.1;

        // Mathy calculations: (all retina, btw)
        fx = self.from.x * 2;
        fy = self.from.y * 2;
        tx = self.to.x * 2;
        ty = self.to.y * 2;
        if (self.from === self.to) {
            let { rotation } = self;
            rotation *= Math.TAU / 360;
            tx += Math.cos(rotation);
            ty += Math.sin(rotation);
        }
        dx = tx - fx;
        dy = ty - fy;
        w = Math.sqrt(dx * dx + dy * dy);
        a = Math.atan2(dy, dx);
        h = Math.abs(self.arc * 2);

        // From: http://www.mathopenref.com/arcradius.html
        r = (h / 2) + ((w * w) / (8 * h));
        y = r - h; // the circle's y-pos is radius - given height.
        a2 = Math.acos((w / 2) / r); // angle from x axis, arc-cosine of half-width & radius

        // Arrow buffer...
        arrowBuffer = 15;
        arrowDistance = (self.to.radius + arrowBuffer) * 2;
        arrowAngle = arrowDistance / r; // (distance/circumference)*TAU, close enough.
        beginDistance = (self.from.radius + arrowBuffer) * 2;
        beginAngle = beginDistance / r;

        // Arc it!
        startAngle = a2 - Math.TAU / 2;
        endAngle = -a2;
        if (h > r) {
            startAngle *= -1;
            endAngle *= -1;
        }
        if (self.arc > 0) {
            y2 = y;
            begin = startAngle + beginAngle;
            end = endAngle - arrowAngle;
        } else {
            y2 = -y;
            begin = -startAngle - beginAngle;
            end = -endAngle + arrowAngle;
        }

        // Arrow HEAD!
        arrowLength = 10 * 2;
        ax = w / 2 + Math.cos(end) * r;
        ay = y2 + Math.sin(end) * r;
        aa = end + Math.TAU / 4;

        // My label is...
        let l;
        l = '';

        if (self.customLabel) l = self.customLabel;
        self.label = l;

        // Label position
        const labelPosition = self.getPositionAlongArrow(0.5);
        lx = labelPosition.x;
        ly = labelPosition.y;

        // ACTUAL label position, for grabbing purposes
        self.labelX = (fx + Math.cos(a) * lx - Math.sin(a) * ly) / 2; // un-retina
        self.labelY = (fy + Math.sin(a) * lx + Math.cos(a) * ly) / 2; // un-retina

        // setting to use for clicking on edges
        self.fx = fx;
        self.fy = fy;
        self.a = a;

        // ...add offset to label
        labelBuffer = 18 * 2; // retina
        if (self.arc < 0) labelBuffer *= -1;
        ly += labelBuffer;

        /// ////////////////////////////////////
        // AND THEN UPDATE OTHER STUFF AFTER //
        // THE CALCULATIONS ARE DONE I GUESS //
        /// ////////////////////////////////////

        // Update signals
        self.updateSignals();
        self.updateReverseSignals();
    };

    // Get position along arrow, on what parameter?
    self.getArrowLength = function () {
        let angle;
        if (self.from === self.to) {
            return r * Math.TAU - 2 * self.from.radius;
        }
        // debugger
        if (y < 0) {
            // arc's center is above the horizon
            if (self.arc < 0) { // ccw
                angle = Math.TAU + begin - end;
            } else { // cw
                angle = Math.TAU + end - begin;
            }
        } else {
            // arc's center is below the horizon
            angle = Math.abs(end - begin);
        }

        return r * angle;
    };
    self.getPositionAlongArrow = function (param, reversed = false) {
        param = -0.05 + param * 1.1; // (0,1) --> (-0.05, 1.05)

        // If the arc's circle is actually BELOW the line...
        let begin2 = begin;
        if (y < 0) {
            // DON'T KNOW WHY THIS WORKS, BUT IT DOES.
            if (begin2 > 0) {
                begin2 -= Math.TAU;
            } else {
                begin2 += Math.TAU;
            }
        }

        // Get angle!
        const angle = begin2 + (end - begin2) * param;

        let rChanged;
        if (reversed) {
            rChanged = r + 50;

            return {
                x: w / 2 + Math.cos(angle) * rChanged,
                y: y2 + Math.sin(angle) * rChanged,
            };
        }

        // return x & y
        return {
            x: w / 2 + Math.cos(angle) * r,
            y: y2 + Math.sin(angle) * r,
        };
    };
    self.breakText = function () {
        const lines = self.label.split(/\n/);
        if (self.href) lines[0] = `🔗 ${lines[0]}`;
        return lines;
    };
    // Draw
    self.draw = function (ctx) { 
        if(loopy.pause && !self.wasPaused) {
            // adding current signals to pause array
            self.signalsPaused = [...self.signals];
            // removing all current signals
            for(let i = 0; i < self.signals.length; i++){
                self.removeSignal(self.signals[i]);
            }
            // clearing current signal array
            self.signals = [];

            // adding current reversed signals to pause array
            self.reverseSignalsPaused = [...self.reverseSignals];
            // removing all current reversed signals
            for(let i = 0; i < self.reverseSignals.length; i++){
                self.removeReverseSignal(self.reverseSignals[i]);
            }
            // clearing current signal array
            self.reverseSignals = [];

            // keep from running more than once
            self.wasPaused = true;
        } else if(!loopy.pause && self.wasPaused){
            // once unpaused add signals back
            self.signals = [...self.signalsPaused];
            self.reverseSignals = [...self.reverseSignalsPaused];
            // clear pause array
            self.signalsPaused = [];
            self.reverseSignalsPaused = [];
            // unpaused
            self.wasPaused = false;
        }

        // Width & Color
        ctx.lineWidth = 4 * 1 - 2;
        const gradient = ctx.createLinearGradient(0, 0, ax, ay);
        gradient.addColorStop(0.4, colorAndTransparency(self.transparency,self.edgeColor));
        ctx.strokeStyle = gradient;

        // Translate & Rotate!
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(a);

        let drawMe = true;
        if (self.loopy.mode === Loopy.MODE_PLAY && self.from.label === 'autoplay') drawMe = false;
        

        if (drawMe) {
            // Arc it!
            function drawArc(ctx, arc, w, y2, r, startAngle, end) {
                ctx.lineWidth = 5;
                ctx.save();
                ctx.beginPath();
                if (self.arc > 0) {
                    ctx.arc(w / 2, y2, r, startAngle, end, false);
                } else {
                    ctx.arc(w / 2, y2, r, -startAngle, end, true);
                }
                ctx.stroke();
                ctx.restore();
            }
            let baseOffset = 0;
            drawArc(ctx, self.arc, w, y2, r, startAngle, end);

            // Highlight!
            if (self.loopy.sidebar.currentPage.target === self && (self.loopy.mode != Loopy.MODE_PLAY)) {

                ctx.save();
                ctx.beginPath();
                if (self.arc > 0) {
                    ctx.arc(w / 2, y2, r, startAngle, end, false);
                } else {
                    ctx.arc(w / 2, y2, r, -startAngle, end, true);
                }

                ctx.strokeStyle = HIGHLIGHT_COLOR;
                ctx.lineWidth = 50;
                ctx.lineCap = "round";
                ctx.stroke();
                ctx.restore();
            }

            // Arrow HEAD!
            ctx.save();
            ctx.translate(ax, ay);
            if (self.arc < 0) ctx.scale(-1, -1);
            ctx.rotate(aa);
            drawArrow(ctx, arrowLength, self, 1, baseOffset);

            ctx.restore();

            // Stroke!
            ctx.stroke();

            // Draw label
            ctx.font = `${self.edgeItalic} ${self.edgeBold} ${self.edgeFontSize}px ${self.edgeFontSelection}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.save();
            ctx.translate(lx, ly);
            ctx.rotate(-a);
            ctx.fillStyle = colorAndTransparency(self.transparency);
            const lines = self.breakText();
            if(lines.length <= 1) {
                ctx.fillText(self.label, 0, 0);                           
                if(self.edgeUnderline == 'Underline') {
                    drawUnderline(ctx, self.label);
                }
            }
            else {
                ctx.translate(0, -(self.edgeFontSize * lines.length) / 3);
                for (let line of lines) {
                    ctx.fillText(line, 0, 0);
                    if(self.edgeUnderline == 'Underline') {
                        drawUnderline(ctx, line);
                    }
                    ctx.translate(0, self.edgeFontSize);
                }
            }
            ctx.restore();
        }
        // DRAW SIGNALS
        self.drawSignals(ctx);
        self.drawReverseSignals(ctx);

        // Restore
        ctx.restore();
    };

    /// ///////////////////////////////////
    // KILL EDGE /////////////////////////
    /// ///////////////////////////////////

    self.kill = function () {
        // Kill Listeners!
        unsubscribe('whiteboard/reset', _listenerReset);

        // Remove from parent!
        whiteboard.removeEdge(self);

        // Killed!
        publish('kill', [self]);
    };

    /// ///////////////////////////////////
    // HELPER METHODS ////////////////////
    /// ///////////////////////////////////

    self.isPointOnLabel = function (x, y) {
        // TOTAL HACK: radius based on TOOL BEING USED.
        let radius;
        if (self.loopy.tool === Loopy.TOOL_DRAG || self.loopy.tool === Loopy.TOOL_INK) radius = 40; // selecting, wide radius!
        else if (self.loopy.tool === Loopy.TOOL_ERASE) radius = 25; // no accidental erase
        else radius = 15; // you wanna label close to edges
        return _isPointInCircle(x, y, self.labelX, self.labelY, radius);
    };

    self.getBoundingBox = function () {
        // SPECIAL CASE: SELF-ARC
        if (self.from === self.to) {
            const perpendicular = a - Math.TAU / 4;
            let cx = fx + Math.cos(perpendicular) * -y2;
            let cy = fy + Math.sin(perpendicular) * -y2;
            cx /= 2; // un-retina
            cy /= 2; // un-retina

            const _radius = r / 2; // un-retina

            return {
                left: cx - _radius,
                top: cy - _radius,
                right: cx + _radius,
                bottom: cy + _radius,
            };
        }

        // THREE POINTS: start, end, and perpendicular with r
        const from = { x: self.from.x, y: self.from.y };
        const to = { x: self.to.x, y: self.to.y };
        const mid = {
            x: (from.x + to.x) / 2,
            y: (from.y + to.y) / 2,
        };

        const perpendicular = a - Math.TAU / 4;
        mid.x += Math.cos(perpendicular) * self.arc;
        mid.y += Math.sin(perpendicular) * self.arc;

        // TEST ALL POINTS

        let left = Infinity;
        let top = Infinity;
        let right = -Infinity;
        let bottom = -Infinity;
        const points = [from, to, mid];
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            const { x } = point;
            const { y } = point;
            if (left > x) left = x;
            if (top > y) top = y;
            if (right < x) right = x;
            if (bottom < y) bottom = y;
        }

        return {
            left,
            top,
            right,
            bottom,
        };
    };
}
function drawCircleAndFade(ctx, transparency) {
    ctx.beginPath();
    ctx.arc(0, 0, 1.2, 0, 2 * Math.PI);
    ctx.lineWidth = .5;
    ctx.strokeStyle = colorAndTransparency(transparency);
    ctx.stroke();
    ctx.fillStyle = colorAndTransparency(transparency,'s1');
    ctx.fill();
}
function drawAmountArrow(ctx, signalColor) {
    ctx.beginPath();
    ctx.moveTo(-2, 0);
    ctx.lineTo(0, -2);
    ctx.lineTo(2, 0);
    ctx.lineTo(1, 0);
    ctx.lineTo(1, 2);
    ctx.lineTo(-1, 2);
    ctx.lineTo(-1, 0);
    ctx.fillStyle = signalColor;
    ctx.fill();
}
function drawArrow(ctx, arrowLength, self, dir = 1, offset = 0, size = 1) {
    let arrowHead = new Image();
    arrowHead.src = arrowHeadColor(self.edgeColor);
    ctx.save();
    let transparency = self.transparency / 100;
    if(transparency < .1 && (self.loopy.mode != Loopy.MODE_PLAY)) transparency = .1;
    ctx.globalAlpha = transparency;
    ctx.drawImage(arrowHead, (-dir * arrowLength + offset) * size - 2, -arrowLength * size - 12);
    ctx.restore();
}

function arrowHeadColor(colorIndex = '-1') {
    let color;
    switch(colorIndex){
        // Gray
        case '-1':
            color = "css/icons/arrow-head-gray.png";
            break;
        // Red
        case '0':
            color = "css/icons/arrow-head-red.png";
            break;
        // Orange
        case '1':
            color = "css/icons/arrow-head-orange.png";
            break;
        // Yellow
        case '2':
            color = "css/icons/arrow-head-yellow.png";
            break;
        // Green
        case '3':
            color = "css/icons/arrow-head-green.png";
            break;
        // Blue
        case '4':
            color = "css/icons/arrow-head-blue.png";
            break;
        // Purple
        case '5':
            color = "css/icons/arrow-head-purple.png";
            break;
        // Gray
        default:
            color = "css/icons/arrow-head-gray.png";
            break;
    }
    return color;
}

function colorAndTransparency(transparency, colorIndex = '-1') {
    let color;
    // for when typing 1-9 limit to lowest which is 10. 
    if(transparency < 10 && (self.loopy.mode != Loopy.MODE_PLAY)) transparency = 10; 
    // setting color and transparency
    switch(colorIndex){
        // Edge color
        // Dark grey
        case '-1':
            color = `rgba(102, 102, 102, ${transparency/100})`;
            break;
        // Red
        case '0':
            color = `rgba(234, 62, 62, ${transparency/100})`;
            break;
        // Orange
        case '1':
            color = `rgba(234, 157, 81, ${transparency/100})`;
            break;
        // Yellow
        case '2':
            color = `rgba(254, 238, 67, ${transparency/100})`;
            break;
        // Green
        case '3':
            color = `rgba(191, 238, 63, ${transparency/100})`;
            break;
        // Light blue
        case '4':
            color = `rgba(127, 212, 255, ${transparency/100})`;
            break;
        // Purple
        case '5':
            color = `rgba(169, 127, 255, ${transparency/100})`;
            break;
        // Signal color
        // Light Grey
        case 's1':
            color = `rgba(230,230,230, ${transparency/100})`;
            break;
        // Dark Grey
        default:
            color = `rgba(102, 102, 102, ${transparency/100})`;
            break;
    }
    return color;
}
// Exporting for testing
exports.Edge = Edge;