function SidebarPage(pageId) {
    // TODO: be able to focus on next component with an "Enter".

    const self = this;
    self.target = null;

    // DOM
    self.dom = document.querySelector(`#${pageId}`);
    self.hide = function () { self.dom.style.display = 'none'; self.onhide(); };
    self.show = function () {
        self.dom.style.display = 'block';
        // self.dom.classList.remove("compact");
        // if(self.dom.offsetHeight>innerHeight) self.dom.classList.add("compact");
        self.onshow();
    };

    // Components
    self.components = [];
    self.componentsByID = {};
    self.registerComponent = function (propName, component) {
        // This used to support only one argument
        // That's no longer going to be the case. Only need to add component 
        //    if it's an input of some sort.
        if (!component) {
            return;
        }

        component.page = self; // tie to self
        component.propName = propName; // tie to propName

        // The Component* classes should be setting their own DOM but, if it somehow gets here without one, look for an input with that name
        if (!component.dom) {
            component.dom = document.querySelector(`input[name="${propName}"]`);
        }
        
        // self.dom.appendChild(component.dom); // add to DOM

        // remember component
        self.components.push(component);
        self.componentsByID[propName] = component;

        // return!
        return component;
    };
    self.getComponent = function (propName) {
        return self.componentsByID[propName];
    };

    // Edit
    self.edit = function (object) {
        // New target to edit!
        self.target = object;
        // Show each property with its component
        for (let i = 0; i < self.components.length; i++) {
            self.components[i].show();
        }

        // Callback!
        self.onedit();
    };

    // TO IMPLEMENT: callbacks
    self.onedit = function () {};
    self.onshow = function () {};
    self.onhide = function () {};

    // Start hiding!
    self.hide();
}