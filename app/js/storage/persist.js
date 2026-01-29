/** *************************************************************************************************
User Summary
This code provides a set of functions for injecting and manipulating properties in objects,
configuring their default values, and updating their representations. It is used to serialize,
deserialize, save, and load loopy whiteboards.

technical summary
The code is divided into two main parts: the injector and the persist functions. The injector
is used to inject properties into objects, configure their default values, and update their
representations. The persist functions are used to serialize, deserialize, save, and load loopy
whiteboards.

How replacement keys work:
The replacement keys simply replace a long key (i.e. 'loadBalancingInput0') with a short key (i.e. 'f').
This saves a crap ton of space in the json, allowing for a much smaller file/url size. Globals, nodes, 
edges, and labels all map to the same replacement key array (i.e. 'a' applies to node init, edge transparency,
label text, and global loopyFontSelection).


************************************************************************************************** */
if (typeof module !== 'undefined' && module.exports) {
    var { objTypeToTypeIndex } = require("./injector/injector.js");
}

function stringToBase64(string) {
    return btoa(string);
}

function stringFromBase64(base64_string) {
    return atob(base64_string);
}



const replacementKeys = ['a', 'b', 'c', 'd', 'e','f', 'g', 'h', 'i', 'j','k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't','u', 'v', 'w', 'z'];
for(let i = 0; i<100; i++) {
    replacementKeys.push(`${i}`)
}
 //shortens all json data by replacing long keys with shortened ones and removing default values
 // note: don't use x and y as those are already taken
function compressJSONData(data){
    const nodeKeys = Object.keys(Node.default).filter(key => !['x', 'y'].includes(key));
    const edgeKeys = Object.keys(Edge.default).filter(key => !['x', 'y'].includes(key));
    const labelKeys = Object.keys(Label.default).filter(key => !['x', 'y'].includes(key));
    const globalKeys = Object.keys(Loopy.default);

    // shortening global data
    globalKeys.forEach(function(longKey, k) {
        // replace key with shorter key if it is not the default the value 
        if(data.globals[longKey] != globalKeys[longKey]) {
            const shortKey = replacementKeys[k];
            data.globals[shortKey] = data.globals[longKey];
        }
        // delete default value (either replaced by shorter key or unnecessary since it is default anyways)
        delete data.globals[longKey]; 
    });
    
    // shortening node data
    data.nodes.forEach(function(node) {
        nodeKeys.forEach(function(longKey, k) {
                // replace key with shorter key if it is not the default the value 
                if(node[longKey] != Node.default[longKey]) { 
                    const shortKey = replacementKeys[k];
                    node[shortKey] = node[longKey];
                }
                // delete default value (either replaced by shorter key or unnecessary since it is default anyways)
                delete node[longKey]; 
        });
    });

    // shorteneing edge data
    data.edges.forEach(function(edge) {
        edgeKeys.forEach(function(longKey, k) {
            // replace key with shorter key if it is not the default the value 
            if(edge[longKey] != Edge.default[longKey]) {
                const shortKey = replacementKeys[k];
                edge[shortKey] = edge[longKey];
            }
            // delete default value (either replaced by shorter key or unnecessary since it is default anyways)
            delete edge[longKey];                
        });
    });

    // shorteneing label data
    data.labels.forEach(function(label) {
        labelKeys.forEach(function(longKey, k) {
            // replace key with shorter key if it is not the default the value 
            if(label[longKey] != Label.default[longKey]) {
                const shortKey = replacementKeys[k];
                label[shortKey] = label[longKey];
            }
            // delete default value (either replaced by shorter key or unnecessary since it is default anyways)
            delete label[longKey];

        });
    });
    return data
}

// Replaces shortened JSON keys from compressJSONdata with original keys
function decompressJSONdata(data) {
    const nodeKeys = Object.keys(Node.default).filter(key => !['x', 'y'].includes(key));
    const edgeKeys = Object.keys(Edge.default).filter(key => !['x', 'y'].includes(key));
    const labelKeys = Object.keys(Label.default).filter(key => !['x', 'y'].includes(key));
    const globalKeys = Object.keys(Loopy.default);

    // Globals
    // Replaces short key with original key
    replacementKeys.forEach(function(shortKey, k) {
            if(data.globals[shortKey]) {
                const longKey = globalKeys[k];
                data.globals[longKey] = data.globals[shortKey];
                delete data.globals[shortKey];
            }
    });

    // Nodes
    data.nodes.forEach(function(node) {
        // Replaces short key with original key
        replacementKeys.forEach(function(shortKey, k) {
            if(node[shortKey]) {
                const longKey = nodeKeys[k];
                node[longKey] = node[shortKey];
                delete node[shortKey];
            }
        });
    });

    // Edges
    data.edges.forEach(function(edge) {
        // Replaces short key with original key
        replacementKeys.forEach(function(shortKey, k) {
            if(edge[shortKey]) {
                const longKey = edgeKeys[k];
                edge[longKey] = edge[shortKey];
                delete edge[shortKey];
            }   
        });
    });

    // Labels
    data.labels.forEach(function(label) {
        // Replaces short key with original key
        replacementKeys.forEach(function(shortKey, k) {
            if(label[shortKey]) {
                const longKey = labelKeys[k];
                label[longKey] = label[shortKey];
                delete label[shortKey];
            }
        });
    });

    return data;
}


// Used in serializeToHumanReadableJson
// Function to save an object to a human readable JSON object
function humanReadableJsonPersistProps(objToPersist) {
    const typeIndex = objTypeToTypeIndex(objToPersist);
    const persist = {};
    // Iterate over the properties defined in the PERSIST_WHITEBOARD for the given typeIndex
    for (const i in PERSIST_WHITEBOARD[typeIndex]) persist[PERSIST_WHITEBOARD[typeIndex][i].name] = PERSIST_WHITEBOARD[typeIndex][i].serializeFunc(objToPersist[PERSIST_WHITEBOARD[typeIndex][i].name]);
    return persist;
}

// Used when importing whiteboard 
// Adjusts id's of nodes and edges to avoid conflict when importing new model 
function bumpIdsToAvoidMergeCollision(toBumpWhiteboard, existingWhiteboard = loopy.whiteboard) {
    const nodesBumpAmount = existingWhiteboard.nodes.length;
    for (let i = toBumpWhiteboard.nodes.length - 1; i >= 0; i--) {
        const oldId = i;
        const newId = nodesBumpAmount + oldId;
        toBumpWhiteboard.nodes[oldId].id = newId;
        toBumpWhiteboard.edges.forEach((edge) => {
            if (edge.from === oldId) edge.from = newId;
            if (edge.to === oldId) edge.to = newId;
        });
    }
    const bumpedWhiteboard = toBumpWhiteboard;
    return bumpedWhiteboard;
}

// Used for "save as link" button
// Creates various possible urls from data and returns the one with the smallest size
function serializeToUrl(embed) {
    const alternatives = [];
    for (let x = 0; x < 4; x++) {
        alternatives.push(
            encodeURIComponent(
                stringToBase64(
                    serializeToHumanReadableJson(embed)
                )
            )
        );
    }
    const minSized = alternatives.reduce((acc, cur) => (cur.length > acc.size ? acc : { size: cur.length, content: cur }), { size: +Infinity, content: '' });
    return minSized.content;
}

// Loads data from array buffer
// covers legacy json, human-readable json, and binary data
function deserializeFromArrayBuffer(dataInArrayBuffer) {
    const enc = new TextDecoder('utf-8');
    const content = enc.decode(dataInArrayBuffer);
    
    return deserializeFromHumanReadableJson(content);
}

// Used when exporting file as json 
// converts data to human-readablejson
function serializeToHumanReadableJson(embed) {
    // converts data to json
    let json = {
        globals: humanReadableJsonPersistProps(loopy),
        nodes: loopy.whiteboard.nodes.map((n) => humanReadableJsonPersistProps(n)),
        edges: loopy.whiteboard.edges.map((n) => humanReadableJsonPersistProps(n)),
        labels: loopy.whiteboard.labels.map((n) => humanReadableJsonPersistProps(n)),
    };

    json = compressJSONData(json);

    // adds embed if necessary
    if (embed) json.globals.embed = true;
    return JSON.stringify(json);
}

// Used in deserializeFromArrayBuffer
// parses data from JSON format
function deserializeFromHumanReadableJson(dataString) {
    return decompressJSONdata(JSON.parse(dataString));
}

// Export for persist.test.js
exports.bumpIdsToAvoidMergeCollision = bumpIdsToAvoidMergeCollision;
