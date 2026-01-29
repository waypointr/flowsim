function SidebarSwitch(loopy) {
    let self = this;
    
    const CSS_CLASS_OPEN = 'sidebar-open';
    const CSS_CLASS_CLOSED = 'sidebar-closed';    

    self.dom = document.getElementById('sidebarSwitch');

    // When the sidebar switch is clicked, toggle sidebar visibility
    self.dom.onclick = function () {
        if (self.isVisible()) {
            document.body.classList.add(CSS_CLASS_CLOSED);
            document.body.classList.remove(CSS_CLASS_OPEN);

            if (loopy.pause) {
                let vsn = document.getElementById('valueStreamName');
                vsn.classList.remove('nodeInspectOpen');
                self.dom.classList.remove('sidebar-switch-pause');
            }
        }
        else {
            document.body.classList.add(CSS_CLASS_OPEN);
            document.body.classList.remove(CSS_CLASS_CLOSED);

            if (loopy.pause) {
                let vsn = document.getElementById('valueStreamName');
                vsn.classList.add('nodeInspectOpen');
                self.dom.classList.add('sidebar-switch-pause');
            }
        }

        publish('resize');
    };

    self.isVisible = function () {
        return document.body.classList.contains(CSS_CLASS_OPEN);
    };
}
