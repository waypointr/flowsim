/**********************************

UNDO

**********************************/

function Undoer(loopy) {
    const self = this;
        
    // Undo
    self.undo = function() {
         if(!loopy.actions.canUndo()) {
            return;
        }

        // decrease the actions queue index
        loopy.actions.actionsQueueIndex--;

        loopy.actions.updateWhiteBoardFromCurrentIndex();
    };
}