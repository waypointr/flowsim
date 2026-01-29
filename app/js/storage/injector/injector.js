/*
User Summary
Injector provides a way to set properties for the whiteboard of edges, nodes, labels, and loopy.

Technical Summary
The addStoredProperty function is used to add properties to the whiteboard of edges, nodes, labels, and loopy. 
The function takes in the object type, property name, and configuration object as parameters. 

The configuration object can contain the default value of the property, whether the property is immutable, and whether the property should be persisted. 
The registerSidebarComponents function is used to register the properties in the sidebar of a given page. 
The setStoredPropertyDefaults function is used to set the default values of the injected properties in the target configuration. 
The setPageTargetForTextboxInputEvents function is used to apply initial property effects to a given element. 
The get_PERSIST_TYPE_array function returns an array of persistable types. 
The objTypeToTypeIndex function converts an object type to its corresponding type index. 
The getPersistWhiteboard function returns the PERSIST_WHITEBOARD array.
*/

// A loopy implementation of SOLID Open–closed principle
// ^ Don't believe this. It's a lie. This is a hacky workaround for a lack of foresight in the original design of Loopy.
// ^^ AI auto-completed the above sentence to describe this after I wrote "don't believe this". It's right.
//    I think the original author was aiming for immutability, since OCP refers to classes and interfaces.
const PERSIST_WHITEBOARD = [];
const EDIT_WHITEBOARD = [];

/*
    Event handlers and callbacks
    - onNodeInit
    - onNodeTakeSignal
    - onNodeSendSignal
    - onEdgeAddSignal
    - onLoopyInit
    - onPlayReset

 */

/**
 *
 * @param objType : Object class like Node, Edge or Loopy
 * @param propertyName: String, name of the property
 * @param config : Object with optional : defaultValue, immutableDefault, persist*1, sideBar*2
 * *1 : if no persist Object given => don't persist this property
 * persist = {index, [serializeFunc], [deserializeFunc]}
 * *2 :
 * sideBar = {
 *   index,
 *   options: slider enum,
 *   label: string || func,
 *   advanced: boolean
 * }
 *
 */
if (typeof module !== 'undefined' && module.exports) {
    var { Node } = require("./../../tools/node/Node.js");
    var { Edge } = require("./../../tools/edge/Edge.js");
    var { Label } = require('./../../tools/label/Label.js');
var { Loopy } = require('./../../Loopy.js');

}

function addStoredProperty(objType, propertyName, config = {}) {
    
    // If the object type doesn't have a default property object, create it
    if (!objType.default) objType.default = {};

    // Set the default value of the property
    if (typeof config.defaultValue === 'undefined') config.defaultValue = 0;
    if (typeof objType.default[propertyName] !== 'undefined') throw `objType.default[propertyName] collision with ${propertyName}`;
    objType.default[propertyName] = config.defaultValue;

    const typeIndex = get_PERSIST_TYPE_array().indexOf(objType);

    // Create an entry in the EDIT_WHITEBOARD array for the property
    if (!EDIT_WHITEBOARD[typeIndex]) EDIT_WHITEBOARD[typeIndex] = [];
    if (config.sideBar) {
        if (EDIT_WHITEBOARD[typeIndex][config.sideBar.index]) throw `sideBar position collision : ${config.sideBar.index} ${propertyName}`;

        const sideBarData = config.sideBar;
        sideBarData.name = propertyName;
        sideBarData.defaultValue = config.defaultValue;
        EDIT_WHITEBOARD[typeIndex][config.sideBar.index] = sideBarData;
        

        // noinspection JSUnresolvedVariable
        // If the property is not immutable, update the default value when the user changes it
        if (!config.immutableDefault) EDIT_WHITEBOARD[typeIndex][config.sideBar.index].updateDefault = (value) => objType.default[propertyName] = value;
    }

    // Create an entry in the PERSIST_WHITEBOARD array for the property if persistence is enabled
    if (typeof config.persist !== 'undefined') {
        if (typeof config.persist !== 'object' && isFinite(parseInt(config.persist))) config.persist = { index: config.persist };
        if (isNaN(parseInt(config.persist.index))) throw 'in injectProperty, if config.persist, config.persist.index is required';
        if (!PERSIST_WHITEBOARD[typeIndex]) PERSIST_WHITEBOARD[typeIndex] = [];
        if (PERSIST_WHITEBOARD[typeIndex][config.persist.index]) throw `config.persist.index collision : ${JSON.stringify(PERSIST_WHITEBOARD[typeIndex][config.persist.index])}`;
        const persist = { name: propertyName };

        // Set serialization and deserialization functions if provided, else use the identity functions
        persist.serializeFunc = config.persist.serializeFunc ? config.persist.serializeFunc : (v) => v;
        persist.deserializeFunc = config.persist.deserializeFunc ? config.persist.deserializeFunc : (v) => v;
        persist.defaultValue = config.defaultValue;
        
        PERSIST_WHITEBOARD[typeIndex][config.persist.index] = persist;
    }
}

// Injects properties into the sidebar of a given page
function registerSidebarComponents(page, objType) {
    const typeIndex = objTypeToTypeIndex(objType);
    
    for (const i in EDIT_WHITEBOARD[typeIndex]) {
        if (EDIT_WHITEBOARD[typeIndex].hasOwnProperty(i)) {
            const feat = EDIT_WHITEBOARD[typeIndex][i];
            const componentConfig = feat;
            componentConfig.bg = feat.name;
            
            // Add different types of components depending on the type of the property
            if (feat.options) page.registerComponent(feat.name, new ComponentSlider(componentConfig));
            else if(feat.dropdown) page.registerComponent(feat.name, new ComponentDropdown(componentConfig));
            else if(feat.button) page.registerComponent(feat.name, new ComponentButton(componentConfig));
            else if (feat.html) page.registerComponent(feat.name, new ComponentHTML(componentConfig));
            else page.registerComponent(feat.name, new ComponentInput(componentConfig));
        }
    }
}

// Populates target configurations with the default values of injected properties
function setStoredPropertyDefaults(targetConfig, objType) {
    for (const i in objType.default) {
        if (objType.default.hasOwnProperty(i)) {
            targetConfig[i] = objType.default[i];
        }
    }
}

// Applies initial property effects to a given element
function setPageTargetForTextboxInputEvents(element) {
    const typeIndex = objTypeToTypeIndex(element);
    for (const i in EDIT_WHITEBOARD[typeIndex]) {
        if (EDIT_WHITEBOARD[typeIndex][i].oninput) EDIT_WHITEBOARD[typeIndex][i].oninput({ page: { target: element } }, element[i]);
    }
}

// Returns an array of persistable types
function get_PERSIST_TYPE_array() {
    return [
        Node,
        Edge,
        Label,
        Loopy,
    ];
}

// Converts an object type to its corresponding type index
function objTypeToTypeIndex(objType) {
    if (typeof objType === 'object') objType = objType._CLASS_;
    const PERSIST_TYPE = get_PERSIST_TYPE_array();
    for (const i in PERSIST_TYPE) {
        if (PERSIST_TYPE.hasOwnProperty(i)) {
            if (
                objType === i
            || objType === PERSIST_TYPE[i]
            || objType === PERSIST_TYPE[i].name
            || objType === `${PERSIST_TYPE[i].name}s`
            || objType === PERSIST_TYPE[i].name.toLowerCase()
            || objType === `${PERSIST_TYPE[i].name.toLowerCase()}s`
            || objType === PERSIST_TYPE[i]._CLASS_
            || objType === `${PERSIST_TYPE[i]._CLASS_}s`
            || objType === PERSIST_TYPE[i]._CLASS_.toLowerCase()
            || objType === `${PERSIST_TYPE[i]._CLASS_.toLowerCase()}s`
            ) return parseInt(i);
        }
    }
    return 3; // default : Loopy global state
    // throw `${objType} unknown`;
}

function getPersistWhiteboard() {
    return PERSIST_WHITEBOARD;
}

// export for testing
exports.getPersistWhiteboard = getPersistWhiteboard;
exports.objTypeToTypeIndex = objTypeToTypeIndex;
