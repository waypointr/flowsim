/** *************************************************************************************************
User Summary
This code also the user to undo the last action performed on the whiteboard. The user can also redo the last action that was undone. 
The user can undo and redo the last 5 actions performed on the whiteboard.

Technical Summary:
The Actions class is used to store the actions performed on the whiteboard. The actions are stored in the actionsQueue array.
The actionsQueueIndex is used to keep track of the current action that the user is on. The addAction function is used to add the action to the actionsQueue array.
The canRedo function is used to check if the user can redo the last action. The canUndo function is used to check if the user can undo the last action.
The updateWhiteBoardFromCurrentIndex function is used to update the whiteboard to the current action that the user is on.

************************************************************************************************** */
function Actions(loopy) {

    const self = this;
    self.loopy = loopy;

    // Queue to hold actions for undo and redo
    self.actionsQueue = [];
    self.actionsQueueIndex = -1;

    self.addAction = function(action, loopyActions) {

        let storedAction = {
            nodes: [],
            edges: [],
            labels: [],
            loopyWhiteboard: [],
        };

        // add the action to the actions queue
        for (let i = 0; i < action.nodes.length; i++) {
            storedAction.nodes[i] = {...action.nodes[i]};
            storedAction.nodes[i].unsubscribeAll();
            action.nodes[i].unsubscribeAll();
        }

        for (let i = 0; i < action.edges.length; i++) {
            storedAction.edges[i] = {...action.edges[i]};
        }

        for (let i = 0; i < action.labels.length; i++) {
            storedAction.labels[i] = {...action.labels[i]};
        }

        storedAction.loopyWhiteboard = {...loopyActions};

        if(self.actionsQueueIndex >= 0) {
            // removing the end of the actions queue
            self.actionsQueue = self.actionsQueue.slice(0, self.actionsQueueIndex+1);
        }

        // increment the index
        self.actionsQueueIndex++;

        if (self.actionsQueueIndex == self.actionsQueue.length || self.actionsQueueIndex == 0) {
            // adding the new action to the actions queue
            self.actionsQueue.push(storedAction);
        }

        // only track last 5 actions
        if (self.actionsQueue.length > 6) {
            self.actionsQueue.shift();
            // decrement the actionsQueueIndex
            self.actionsQueueIndex--;
        };

    };

    self.canRedo = function () {
        let tempCount = self.actionsQueue.length - 1;
        return tempCount !== self.actionsQueueIndex
    };

    self.canUndo = function() {
        // can't undo if index is 0
        return loopy.actions.actionsQueueIndex >= 1;
    };

    self.updateWhiteBoardFromCurrentIndex = function () {

        let nodes = loopy.actions.actionsQueue[loopy.actions.actionsQueueIndex].nodes;
        let edges = loopy.actions.actionsQueue[loopy.actions.actionsQueueIndex].edges;
        let labels = loopy.actions.actionsQueue[loopy.actions.actionsQueueIndex].labels;
        let loopyVariables = loopy.actions.actionsQueue[loopy.actions.actionsQueueIndex].loopyWhiteboard;

        nodes = nodes.map(node => { return Object.assign({}, node); });
        edges = edges.map(edge => { return Object.assign({}, edge); });
        labels = labels.map(label => { return Object.assign({}, label); });

        // removing nodes, edges, and labels from the whiteboard
        loopy.whiteboard.clear();
       
        // adding the nodes, edges and labels to the whiteboard
        // nodes
        for (let i = 0; i <nodes.length; i++) {

            for (const prop in nodes[i]) {
                if (typeof(nodes[i][prop]) == "function") {
                    continue;
                }

                nodes[i].config[prop] = nodes[i][prop];
            }

            // update the node
            loopy.whiteboard.addNode(nodes[i].config, false);
        }

        //edges
        for (let i = 0; i <edges.length; i++) {
            // update edge configs
            for (const prop in edges[i]) {
                if (typeof(edges[i][prop]) == "function")
                    continue;

                if (["from", "to"].includes(prop)) {

                    edges[i].config[prop] = edges[i][prop].id;
                }
                else{
                    edges[i].config[prop] = edges[i][prop];
                }
            }

            // update the edge
            loopy.whiteboard.addEdge(edges[i].config, false);
        }

        // labels
        for (let i = 0; i <labels.length; i++) {

            for (const prop in labels[i]) {
                if (typeof(labels[i][prop]) != "function") {
                    labels[i].config[prop] = labels[i][prop];
                }
            }

            //update the label
            loopy.whiteboard.addLabel(labels[i].config, false);
        }

        // call the update function
        loopy.whiteboard.update();

        // Loopy
        for (let prop of Object.getOwnPropertyNames(loopyVariables)){
            loopy[prop] = loopyVariables[prop];
            document.getElementById(prop).value = loopyVariables[prop];
        }

        // update the title
        if (loopy.valueStreamNameInput == '') {
            document.title = 'FlowSim';
        }
        else {
            document.title = loopy.valueStreamNameInput;
        }

        // changes sidebar back to default
        loopy.sidebar.showPage('Loopy');

        publish('whiteboard/changed');

    };

}