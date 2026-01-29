/*
User Summary
This file sets properties for edges, such as start and end points, curvature, rotation, strength,
sign behavior, filtering, and signal interpretation. These properties allow customization and
control over the behavior and appearance of edges within a system or application.

Technical Summary
The addStoredProperty function is used to define and inject various properties into the "edge" object.
These properties determine the behavior, appearance, and configuration options for edges. Each
addStoredProperty call adds a specific property, such as "from," "to," "arc," "rotation,"
"color", "transparency", and "speed". The properties are assigned default values and can be persisted, meaning they can be
stored and retrieved when needed. Additionally, the code sets up sidebars with user interface
elements to allow users to modify and customize the properties of edges.
*/

// Edge features
const edgeMinAllowed = 1;
const edgeMinTransparency = 10;
const edgeMaxTransparency = 100;
const edgeMinSpeed = 1;
const edgeMaxSpeed = 100;

function forceValidInput(input, value, id, valid) {
    if(input) {
        if (!valid && input.value!='') {
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

// Define a function to convert a bit to a reference
const bitToRefAnything = (b) => b;
const edgeMaxTextLength = 100;

function forceEdgeMaxLength(value, oldValue) {
    let input = document.getElementById('edgeText');
    const inputOneLine = input.value.replace(/[\r\n]+/gm, "");
    if(input.value && inputOneLine.length > edgeMaxTextLength) {
        input.value = oldValue;
    }
}



// Inject "from" property into "edge" object
addStoredProperty(
    Edge,
    'from',
    {
        persist: {
            index: 0,
            serializeFunc: (v) => v.id, // Serialize function for persistence
        },
    },
);
// Inject "to" property into "edge" object
addStoredProperty(Edge, 'to', { persist: { index: 1, serializeFunc: (v) => v.id } });
// Inject "arc" property into "edge" object
addStoredProperty(Edge, 'arc', { persist: { index: 2, serializeFunc: (v) => Math.round(v) } });
// Inject "rotation" property into "edge" object
addStoredProperty(Edge, 'rotation', { persist: { index: 3, serializeFunc: (v) => Math.round(v) } });
// Inject color into edge object
addStoredProperty(Edge, "edgeColor",{
    defaultValue: '-1',
    persist:4,
    sideBar:{
        index: 5,
        options: ['-1','0','1','2','3','4','5'],
    },
});
// Inject transparency property into edge
addStoredProperty(Edge, 'transparency', {
    defaultValue: 100,
    persist: 5,
    sideBar: {
        id: 'transparency',
        index: 3,
        allowLowerMin: edgeMinAllowed,
        min: edgeMinTransparency,
        max: edgeMaxTransparency,
        fancyInput: true,
        inlineValidation: {
            elementId: 'transparencyMessage',
            validate: (input, config) => {
               if (input.value < config.min) {
                  return 'Transparency must be between 10% - 100%';
               }
         
               return '';      
            }
         },
        onblur: changeIfEmpty,
        oninput: forceValidInput,
    },
});
// Inject edgeSpeed property into edge
addStoredProperty(Edge, 'edgeSpeed', {
    defaultValue: 50,
    persist: 6,
    sideBar: {
        id: 'edgeSpeed',
        index: 4,
        min: edgeMinSpeed,
        max: edgeMaxSpeed,
        fancyInput: true,
        onblur: changeIfEmpty,
        oninput: forceValidInput,
    },
});
// Inject custom name/label into edge object
addStoredProperty(Edge, 'customLabel', {
    defaultValue: '',
    persist: {
        index: 8,
        deserializeFunc: decodeURIComponent,
    },
    sideBar: {
        index: 90,
        label: 'Custom Name', // ⚙
        textarea: true,
        onbeforeinput: forceEdgeMaxLength,
        onblur: function() {},
    },
});
