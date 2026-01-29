/** *************************************************************************************************
User Summary
The Sidebar or “Menu Bar” is on the right side of the screen. Users can Switch between Simple and
Advanced mode, save or load a file, and see examples of simulations. After the user selects a Node,
Edge, or Label they can edit the attributes in the Menu Bar.

Technical Summary
The Sidebar function manages the sidebar component and its pages, providing navigation and
structure. SidebarPage represents a specific page within the sidebar, handling content and user
interactions. Component is a generic base for creating customizable components with common
properties and events. ComponentInput, ComponentSlider, and ComponentButton extend Component to
create input, slider, and button components respectively, with specific event handling and
functionality.

************************************************************************************************** */

function Sidebar(loopy) {
    const self = this;
    PageUI.call(self, document.getElementById('sidebar'));

    // Edit method to show the page for editing a particular object
    self.edit = function (object) {
        self.showPage(object._CLASS_);
        
        self.currentPage.edit(object);
    };

    self.goBackToTop = function () {
        self.showPage('Loopy'); // Show the top-level "Loopy" page in the sidebar
    };

    self.deleteActiveComponent = function () {
        self.currentPage.target.kill();
        self.showPage('Loopy');
        publish('actionsQueue');
    };

    // Go back to main when the thing you're editing is killed
    subscribe('kill', (object) => {
        if (self.currentPage.target === object) {
            self.showPage('Loopy');
        }
    });

    /// /////////////////////////////////////////////////////////////////////////////////////////
    // ACTUAL PAGES ////////////////////////////////////////////////////////////////////////////
    /// /////////////////////////////////////////////////////////////////////////////////////////

    function processLabelFunction(component, page) {
        if (!component.labelFunc) return;

        let label = component.dom?.closest('div.form-group')?.querySelector('label');

        if (label) {
            label.innerHTML = component.labelFunc(page.target[component.name], page.target);
        }
    }

    function addLoadBalancingFields(page) {
        let nodeEdges = loopy.whiteboard.getEdgesByStartNode(page.target);
        let nodeEdgesLength = nodeEdges.length;

        let endNodeEdges = loopy.whiteboard.getEdgesByEndNode(page.target);
        let endNodeEdgesLength = endNodeEdges.length;

        hide(`loadBalancingLabel`);
        hide(`returnRatioLabel`);
        hide('loadBalancingDiv');
        hide('returnRatioDiv');

        // first hide all of them
        for (let i = 0; i < 10; i++) {
            hide(`loadBalancingInput${i}`);
            hide(`colon_${i}`);
            hide(`return_ratio_colon_${i}`);
            hide(`returnRatioInput${i}`);
            hide(`return_ratio_per_${i}`);
        }

        // show load balance
        if (nodeEdgesLength > 1) {
            show('loadBalancingDiv');
            show(`loadBalancingLabel`, 'inline');
            // now show them
            for (let i = 0; i < nodeEdgesLength; i++) {
                show(`loadBalancingInput${i}`, 'inline');
                if (i != nodeEdgesLength -1) {
                    show(`colon_${i}`, 'inline');
                }
            }
        }

        // show return ratio
        if (endNodeEdgesLength > 0) {
            show('returnRatioDiv');
            show(`returnRatioLabel`, 'inline');
            // now show them
            for (let i = 0; i < endNodeEdgesLength; i++) {
                show(`returnRatioInput${i}`, 'inline');
                show(`return_ratio_per_${i}`, 'inline');
                if (i != endNodeEdgesLength -1) {
                    show(`return_ratio_colon_${i}`, 'inline');
                }
            }
        }
    }


    // Node page
    (function () {
        const page = new SidebarPage('sidebar_node');
        registerSidebarComponents(page, Node);
        // commenting out to help with undo
        // page.onshow = () => page.getComponent('label').select(); // Focus on the label field
        page.onedit = () => {
            for (let component of page.components) {
                component.setBGColor(COLORS[page.target.hue]);

                processLabelFunction(component, page);   
            }
            addLoadBalancingFields(page);

        };

        self.addPage('Node', page);
    }());

    // Edge page
    (function () {
        const page = new SidebarPage('sidebar_edge');
        registerSidebarComponents(page, Edge);
        // commenting out to help with undo
        // page.onshow = () => page.getComponent('customLabel').select(); // Focus on the label field
        page.onedit = () => {
            for (let component of page.components) {
                processLabelFunction(component, page);
            }
        };
        self.addPage('Edge', page);
    }());

    // Label page
    (function () {
        const page = new SidebarPage('sidebar_label');
        registerSidebarComponents(page, Label);
        page.onshow = () => page.getComponent('text').select(); // Focus on the text field
        page.onhide = function () {
            
            // remove labels if the text remians "..." or empty string
            if (self.currentPage) {
                if(self.currentPage.target.text == "..." || self.currentPage.target.text == "") {
                    loopy.whiteboard.removeLabel(self.currentPage.target, false);
                }
            }

            // If you'd just edited it...
            if (!page.target) return;
        };
        page.onedit = () => {
            for (let component of page.components) {
                processLabelFunction(component, page);
            }
        };
        self.addPage('Label', page);
    }());

    // Loopy page
    (function () {
        const page = new SidebarPage('sidebar_loopy');
        page.target = window.loopy; // Set the target of the page to the loopy object
        registerSidebarComponents(page, Loopy);
        page.onedit = () => {};
        self.addPage('Loopy', page);
    }());

    // Node Inspect
    (function () {
        const page = new SidebarPage('sidebar_node_inspect');
        page.target = loopy; // Set the target of the page to the loopy object
        page.onedit = () => {};
        self.addPage('Inspect', page);
    }());

    // Ctrl-S to SAVE
    subscribe('key/save', () => {
        publish('modal', ['saveMethodChoosing']);
    });
}
