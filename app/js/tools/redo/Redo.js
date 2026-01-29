/*******************
  
  REDO
 
 *******************/

function Redoer (loopy) {
    const self = this;

    //Redo
    self.redo = function () {

        if(!loopy.actions.canRedo()) {
            return;
        }

        loopy.actions.actionsQueueIndex++;

        loopy.actions.updateWhiteBoardFromCurrentIndex();
    };
}