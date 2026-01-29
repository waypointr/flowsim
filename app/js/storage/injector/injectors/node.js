/** *************************************************************************************************
User Summary
This allows users to create and manipulate nodes. The nodes have various properties that determine
their appearance and behavior. The properties can be adjusted by the user.

Technical Summary
This code defines various properties for the Node class. The updateNodesize function adjusts
the radius of the selected node based on its size. Properties such as id, x, y, label, hue, size,
init, aggregationLatency, loadBalancingInput, returnRatioInput, generateVolume, generateInterval, and generateMax
into the node class. These properties control aspects like the node's position, label, color, size,
initial fill, maximum and minimum fill, aggregation latency, load balancing ratio, return ratio, self-generating items, and self-generating interval.
The sideBar objects provide configuration options and
UI labels for each property.

************************************************************************************************** */
// Node JSON [id, x, y, init, label, hue, size, aggregationLatency, interactive]
//             0  1  2  3     4      5    6         7                   12
const nodeMinSize = 1;
const nodeMaxSize = 999;
const nodeMinInit = 0;
const nodeMaxInit = 100;
const nodeMinaggregationLatency = 1;
const nodeMaxaggregationLatency = 999;
const nodeMinLoadBalancingRatio = 1;
const nodeMaxLoadBalancingRatio = 50;
const nodeMinReturnRatio = 0;
const nodeMaxReturnRatio = 100;
const nodeMaxTextLength = 54;
const nodeMaxLines = 6;
const minGenerateVolume = 0;
const maxGenerateVolume = 999;
const minGenerateInterval = 1;
const maxGenerateInterval = 99999;
const minGenerateMax = 1;
const maxGenerateMax = 99999;


function forceValidInputIfNotEmpty(input, value, id, valid) {
    if(input?.value != '') {
        forceValidInput(input, value, id, valid);
    }
    else if (input){
        input.value = value;
    }
}




function forceValidInput(input, value, id, valid) {
    if(input) {
        if (/^0+0/.test(input.value) && id == 'init') {
            input.value=0;
        }
        else if (!valid && input.value!='') {
                input.value = value;
        }
        if(input.value != ''){
            input.value = parseInt(input.value, 10);
        } else {
            input.value = '';
        }
    }
}

//cannot leave a field empty
function changeIfEmpty(input, oldValue) {
    if(input && input.value == '') {
        input.value=oldValue;
    }
}

function changeLabelIfEmpty(input) {
    changeIfEmpty(input, '?')
    return input.value;
}

function changeUnits(value) {
    changeUnitsActual(value, "Unit", "sizeUnits");
}
function changeDays(value) {
    changeUnitsActual(value, "Day", "latencyDays");
}

function changeGenerateItems(value) {
    changeUnitsActual(value, "item", "generateItems");
}

function changeGenerateTime(value) {
    changeUnitsActual(value, "day", "generateDays");
}

function changeUnitsActual(value, unit, unitId){
    if(value == 1){
        let span = document.getElementById(unitId);
        span.innerText = unit;
    } else {
        let span = document.getElementById(unitId);
        span.innerText = unit + "s";
    }
}

function checkMaxLabelLength(value, oldValue) {
    let input = document.getElementById('nodeText');
    const inputOneLine = input.value.replace(/[\r\n]+/gm, "");
    if(input.value && (input.value.length > (nodeMaxTextLength + nodeMaxLines) || inputOneLine > nodeMaxTextLength)) {
        input.value = oldValue;
    }
};

// This function highlights the node to and brings it into frame
function addHighlight(self) {
    let nodeFrom = loopy.sidebar.currentPage.target;
    let edgesTo = loopy.whiteboard.getEdgesByStartNode(nodeFrom);

    let nodeToId = self.id.slice(-1);
    let nodeTo = edgesTo[nodeToId].to;

    self.page.target.nodeRatioIsSelected = true;
    self.page.target.nodeRatioHighlight = nodeTo;

    for(let node of loopy.whiteboard.nodes) {
        if(node.nodeRatioHighlight != '') {
            loopy.whiteboard.nodeZoomToNode = true;
            break;
        }
    }

    loopy.whiteboard.getFinalOffsetValues();
}

// This function removes highlight and resets frame 
function removeHighlight(self, input, oldValue) {
    changeIfEmpty(input, oldValue);

    // remove load balance highlight
    self.page.target.nodeRatioIsSelected = false;
    self.page.target.nodeRatioHighlight = "";
    
    loopy.whiteboard.nodeZoomToNode = false;
}

// This function highlights the node to and brings it into frame for return ratio
function addHighlightReturnRatio(self) {
    let nodeFrom = loopy.sidebar.currentPage.target;
    let edgesFrom = loopy.whiteboard.getEdgesByEndNode(nodeFrom);

    let nodeToId = self.id.slice(-1);
    let nodeTo = edgesFrom[nodeToId].from;

    self.page.target.nodeRatioIsSelected = true;
    self.page.target.nodeRatioHighlight = nodeTo;

    for(let node of loopy.whiteboard.nodes) {
        if(node.nodeRatioHighlight != '') {
            loopy.whiteboard.nodeZoomToNode = true;
            break;
        }
    }
    
    loopy.whiteboard.getFinalOffsetValues();
}


let index = 0;
let persist = 1;
// Inject a property into the Node class
// Property: id
addStoredProperty(Node, 'id', { persist: { index: 0 } });
// Property: x
addStoredProperty(Node, 'x', { persist: { index: 1, serializeFunc: (v) => Math.round(v) } });
// Property: y
addStoredProperty(Node, 'y', { persist: { index: 2, serializeFunc: (v) => Math.round(v) } });
/**
 * toggleable visibility in play mode (visible, hidden in play mode, hidden when dead)
 *
 * custom image url (to load an image for the circle
 *
 * borderless switch (if borderless, scale it up a bit and remove borders)
 */
// Property: label
addStoredProperty(Node, 'label', {
    defaultValue: '?',
    immutableDefault: true,
    persist: {
        index: 4,
        deserializeFunc: decodeURIComponent,
    },
    sideBar: {
        index: 1,
        label: 'Name',
        textarea: true,
        onbeforeinput: checkMaxLabelLength,
        onblur: changeLabelIfEmpty,
    },
});

// Property: hue
addStoredProperty(Node, 'hue', {
    defaultValue: 0,
    persist: 5,
    sideBar: {
        index: 2,
        options: [0, 1, 2, 3, 4, 5],
        label: 'Color',
    },
});

// Property: init (initial fill)
addStoredProperty(Node, 'init', {
    defaultValue: 0,
    persist: 3,
    sideBar: {
        id: 'init',
        index: 3,
        min: nodeMinInit,
        max: nodeMaxInit,
        objType: 'Node',
        fancyInput: true,
        onblur: changeIfEmpty,
        oninput: forceValidInput,
    },
});

// Property: size
addStoredProperty(Node, 'size', {
    defaultValue: 15,
    persist: 6,
    sideBar: {
        id: 'size',
        index: 4,
        max: nodeMaxSize,
        min: nodeMinSize,
        objType: 'Node',
        fancyInput: true,
        onblur: changeIfEmpty,
        oninput: forceValidInput,
        onchange: changeUnits,
    },
});


// Property: aggregationLatency (time delay)
addStoredProperty(Node, 'aggregationLatency', {
    defaultValue: 5,
    persist: 7,
    sideBar: {
        id: 'aggregationLatency',
        index: 5,
        min: nodeMinaggregationLatency,
        max: nodeMaxaggregationLatency,
        objType: 'Node',
        fancyInput: true,
        onblur: changeIfEmpty,
        oninput: forceValidInput,
        onchange: changeDays,
    },
});

// Load balance inputs 0-9
// 0 is hidden by default because its not populating correctly
addStoredProperty(Node, 'loadBalancingInput', {
    defaultValue: 1,
    persist: 8,
    sideBar: {
        id: 'loadBalancingInput',
        multipleInputs: true,
        index: 6,
        min: nodeMinLoadBalancingRatio,
        max: nodeMaxLoadBalancingRatio,
        fancyInput: true,
        onfocus: addHighlight,
        onblur: removeHighlight,
        oninput: forceValidInput,
    },
});

for(let i = 0; i < 10; i++) {
    const idVal = `loadBalancingInput${i}`;
    const persistIndex = i + 9;
    const sideBarIndex = i + 7; 
    addStoredProperty(Node, idVal, {
        defaultValue: 1,
        persist: persistIndex,
        sideBar: {
            id: idVal,
            multipleInputs: true,
            index: sideBarIndex,
            min: nodeMinLoadBalancingRatio,
            max: nodeMaxLoadBalancingRatio,
            fancyInput: true,
            onfocus: addHighlight,
            onblur: removeHighlight,
            oninput: forceValidInput,
        },
    });
}

for(let i = 0; i < 10; i++) {
    const idVal = `returnRatioInput${i}`;
    const persistIndex = i + 24;
    const sideBarIndex = i + 22; 
    addStoredProperty(Node, idVal, {
        defaultValue: 0,
        persist: persistIndex,
        sideBar: {
            id: idVal,
            multipleInputs: true,
            index: sideBarIndex,
            min: nodeMinReturnRatio,
            max: nodeMaxReturnRatio,
            fancyInput: true,
            onfocus: addHighlightReturnRatio,
            onblur: removeHighlight,
            oninput: forceValidInput,
        },
    });
}


// Self generating items
addStoredProperty(Node, `generateVolume`, {
    defaultValue: 0,
    persist: 35,
    sideBar: {
        id: `generateVolume`,
        index: 33,
        fancyInput: true,
        min: minGenerateVolume,
        max: maxGenerateVolume,
        onblur: changeIfEmpty,
        oninput: forceValidInput,
        onchange: changeGenerateItems,
    },
});

addStoredProperty(Node, `generateInterval`, {
    defaultValue: 1,
    persist: 36,
    sideBar: {
        id: `generateInterval`,
        index: 34,
        fancyInput: true,
        min: minGenerateInterval,
        max: maxGenerateInterval,
        onblur: changeIfEmpty,
        oninput: forceValidInput,
        onchange: changeGenerateTime,
    },
});

addStoredProperty(Node, `generateMax`, {
    defaultValue: null,
    persist: 37,
    sideBar: {
        id: `generateMax`,
        index: 35,
        fancyInput: true,
        blankAllowed: true,
        min: minGenerateMax,
        max: maxGenerateMax,
        oninput: forceValidInputIfNotEmpty,
        // needs an onblur function for changes to be added to the actionQueue, so here as an empty function
        onblur: function() {}, 
    }

})