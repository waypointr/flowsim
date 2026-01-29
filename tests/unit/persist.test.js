// Bring in Chai for test assertions and expectations
const { assert } = require('chai');

// Bring in the files / functions that we need to test with

let { Node } = require('../../app/js/tools/node/Node.js');
let { Edge } = require('../../app/js/tools/edge/Edge.js');
let { Label } = require('../../app/js/tools/label/Label.js');
let { Loopy } = require('../../app/js/Loopy.js');          
const { getPersistWhiteboard } = require('../../app/js/storage/injector/injector.js');
const { bumpIdsToAvoidMergeCollision } = require('../../app/js/storage/persist.js');

const { describe } = require('mocha');



// create model to test
function initPersist() {
    PERSIST_WHITEBOARD = getPersistWhiteboard();
    PERSIST_WHITEBOARD[0] = [];
    PERSIST_WHITEBOARD[0][1] = {
        name: 'something', bit: 3, encode: (v) => v, decode: (v) => v,
    };
    PERSIST_WHITEBOARD[0][5] = {
        name: 'thing', bit: 3, encode: (v) => v, decode: (v) => v,
    };
    PERSIST_WHITEBOARD[0][2] = {
        name: 'otherThing', bit: 6, encode: (v) => v, decode: (v) => v,
    };
}

function extraInitPersist() {
    initPersist();

    if (typeof Node === 'undefined') { Node = () => {}; Node._CLASS_ = Node.name = 'Node'; }
    if (typeof Edge === 'undefined') { Edge = () => {}; Edge._CLASS_ = Edge.name = 'Edge'; }
    if (typeof Label === 'undefined') { Label = () => {}; Label._CLASS_ = Label.name = 'Label'; }
    if (typeof Loopy === 'undefined') { Loopy = () => {}; Loopy._CLASS_ = Loopy.name = 'Loopy'; }

    loopy = {
        whiteboard: {
            nodes: [
                { something: 7, thing: 1, otherThing: 42 },
                { something: 3, thing: 1, otherThing: 0 },
            ],
        },
    };
}

// cumulative import bumpIdsToAvoidMergeCollision 
describe('cumulative import bumpIdsToAvoidMergeCollision', function() {
    it('bumpIdsToAvoidMergeCollision bump newModel id to avoid active model ids', function() {
        // actual 
        const existingModel = { nodes: [{ id: 0, old: true }, { id: 1, old: true }] };
        const toBumpModel = { nodes: [{ id: 0 }, { id: 1 }, { id: 2 }], edges: [{ from: 0, to: 1 }, { from: 2, to: 1 }] };
        const res = bumpIdsToAvoidMergeCollision(toBumpModel, existingModel);
        let actual = JSON.stringify(res);
        // expected
        let expected = '{"nodes":[{"id":2},{"id":3},{"id":4}],"edges":[{"from":2,"to":3},{"from":4,"to":3}]}';
        assert.equal(actual, expected);
    });
    it ('bumpIdsToAvoidMergeCollision can use activeModel as reference', function() {
        // actual
        const existingModel = { nodes: [{ id: 0, old: true }, { id: 1, old: true }] };
        const toBumpModel = { nodes: [{ id: 0 }, { id: 1 }, { id: 2 }], edges: [{ from: 0, to: 1 }, { from: 2, to: 1 }] };
        const res = bumpIdsToAvoidMergeCollision(toBumpModel, existingModel);
        let actual = JSON.stringify(res);
        // expected
        let expected = '{"nodes":[{"id":2},{"id":3},{"id":4}],"edges":[{"from":2,"to":3},{"from":4,"to":3}]}';
        assert.equal(actual, expected);
    });
});
