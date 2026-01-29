const COLORS_HEX = {
    'RED': '#EA3E3E',
    'ORANGE': '#EA9D51',
    'YELLOW': '#FEEE43',
    'GREEN': '#BFEE3F', 
    'BLUE': '#7FD4FF',
    'PURPLE': '#A97FFF',
};

const COLORS = {
    0: COLORS_HEX.RED,
    1: COLORS_HEX.ORANGE,
    2: COLORS_HEX.YELLOW,
    3: COLORS_HEX.GREEN,
    4: COLORS_HEX.BLUE,
    5: COLORS_HEX.PURPLE,
};

// Keycodes to words mapping
const KEY_CODES = {
    17: 'control',
    91: 'control', // macs
    13: 'enter', // enter
    46: 'delete',
    32: 'space', // Play and Stop 

    78: 'ink', // Pe(N)cil
    86: 'drag', // Mo(V)e
    69: 'erase', // (E)rase
    84: 'label', // (T)ext
    83: 'save', // (S)ave
    82: 'redo', // (R)edo
    85: 'undo', // (U)ndo
    189: 'zoomout', // - zoomout
    187: 'zoomin', // = zoomin
    109: 'zoomout', // - zoomout keypad
    107: 'zoomin', // + zoomin keypad
    80: 'pause', // p pauses
};
