/** *************************************************************************************************
User Summary
This allows users to control the font, font size, bold, italic, and underline properties of nodes, labels, and edges.

Technical Summary
This injector adds the following properties to the Node, Label, and Edge classes:
- fontSelection: The font of the text. The default value is 'Fredoka'.
- fontSize: The size of the text. The default value is 32.
- bold: The boldness of the text. The default value is 'normal'.
- italic: The italicization of the text. The default value is 'normal'.
- underline: The underlining of the text. The default value is 'normal'.

************************************************************************************************** */

const types = [Node, Label, Edge, Loopy];
const ltypes = ['node', 'label', 'edge', 'loopy'];
const persistIndex = [19, 6, 9, 1];
const sidebarIndex = [17, 6, 91, 1];
const sizeDefault = ['auto', 32, 32, 32];
const fontDefault = ['Fredoka', 'Roboto, sans-serif', 'Roboto, sans-serif', 'Fredoka'];


for(let i in types) {
    // Add font
        addStoredProperty(types[i], `${ltypes[i]}FontSelection`, {
            defaultValue: fontDefault[i],
            persist: persistIndex[i],
            sideBar: {
                index: sidebarIndex[i],
                id: `${ltypes[i]}FontSelection`,
                dropdown: true,
            },
        });
    
    if(ltypes[i] == 'loopy') {
        break;
    }
    // Add font size
    addStoredProperty(types[i], `${ltypes[i]}FontSize`, {
        defaultValue: sizeDefault[i],
        persist: persistIndex[i] + 1,
        sideBar: {
            index: sidebarIndex[i] + 1,
            id: `${ltypes[i]}FontSize`,
            dropdown: true,
        },
    });
    // Add bold
    addStoredProperty(types[i], `${ltypes[i]}Bold`, {
        defaultValue: 'normal',
        persist: persistIndex[i] + 2,
        sideBar: {
            index: sidebarIndex[i] + 2,
            id: `${ltypes[i]}Bold`,
            button: 'bold',
        },
    });
    // Add italic
    addStoredProperty(types[i], `${ltypes[i]}Italic`, {
        defaultValue: 'normal',
        persist: persistIndex[i] + 3,
        sideBar: {
            index: sidebarIndex[i] + 3,
            id: `${ltypes[i]}Italic`,
            button: 'italic',
        },
    });
    // Add italic
    addStoredProperty(types[i], `${ltypes[i]}Underline`, {
        defaultValue: 'normal',
        persist: persistIndex[i] + 4,
        sideBar: {
            index: sidebarIndex[i] + 4,
            id: `${ltypes[i]}Underline`,
            button: 'Underline',
        },
    });
}