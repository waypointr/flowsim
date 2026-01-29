/** *************************************************************************************************
User Summary
The components are what are loaded into the sidebar. The components are used to edit the properties of the nodes, edges, and labels on the whiteboard.

Technical Summary
The Component class is used to control what component is being displayed to the user. The show function is used to show the component to the user.
The getValue function is used to get the value of the component. The setValue function is used to set the value of the component.
If the value of the component is changed, the model is updated and the whiteboard is changed.
Also provides validation for the component by identifying the propNames and ids that are being changed.

************************************************************************************************** */
function Component() {
    const self = this;
    self.dom = null;
    self.page = null;
    self.propName = null;
    self.show = function () {
        // TO IMPLEMENT
    };
    self.getValue = function () {
        return self.page.target[self.propName];
    };
    self.setValue = function (value) {

        // Edit the value!
        self.page.target[self.propName] = value;

        const loadBalance = ['loadBalancingInput0','loadBalancingInput1','loadBalancingInput2','loadBalancingInput3','loadBalancingInput4','loadBalancingInput5','loadBalancingInput6',
            'loadBalancingInput7','loadBalancingInput8','loadBalancingInput9'];
        const returnRatio = ['returnRatioInput0','returnRatioInput1','returnRatioInput2','returnRatioInput3','returnRatioInput4','returnRatioInput5','returnRatioInput6',
        'returnRatioInput7','returnRatioInput8','returnRatioInput9'];
        
        const propNames = ['loopyMode', 'colorLogic', 'label', 'customLabel', 'text'];
        const ids = ['size', 'init', 'aggregationLatency', 'transparency', 'edgeSpeed', 'indicatorYellow', 'indicatorRedLow', 'indicatorRedMedium', 'indicatorRedHigh', 
                   'valueStreamNameInput', 'generateVolume', 'generateInterval', 'generateMax'];

        const actionNotFromPropName = !propNames.includes(self.propName);
        const actionNotFromId = !loadBalance.includes(self.id) && !returnRatio.includes(self.id) && !ids.includes(self.id);
        // Model's been changed!
        publish('whiteboard/changed');
        if(actionNotFromPropName && actionNotFromId) {
            if (self.page.target._CLASS_ != "Label" || (self.page.target._CLASS_ == "Label" && (self.page.target.text != "..." && self.page.target.text != ""))) {
                // add to actions queue
                publish('actionsQueue');
            }
        }
        
        self.page.onedit(); // callback!
    };
    self.setBGColor = function () {};
}