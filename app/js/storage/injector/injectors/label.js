/** *************************************************************************************************
User Summary
The functionality in this file sets various label properties such as location, text, and text color,
and is not interactive with end users.

Technical Summary
These functions define and injects various properties, such as (x,y) label location, text value and
color, and ability to add a clickable URL  into Loopy labels. X and Y
values are defined partly by scaling your canvas size (which likely means your screen resolution) to
accommodate for a link being opened across multiple devices. Inputted values for this are saved in a
user’s cache, so opening a link to a particular project across multiple devices - and subsequently
multiple accounts - would result in some properties not being saved.

************************************************************************************************** */

// This file regards everything to do with altering labels in Loopy
// This and the line below set x and y coordinates that scale depending on canvas size or user screensize
addStoredProperty(Label, 'x', { persist: { index: 0, serializeFunc: (v) => Math.round(v) } });
addStoredProperty(Label, 'y', { persist: { index: 1, serializeFunc: (v) => Math.round(v) } });
/* The text color of a label lasts across multiple iterations of opening the webpage due to "persist"
  Note that clearing you cache may lose saved changes! */
addStoredProperty(Label, 'textColor', {
    defaultValue: -1,
    persist: 4,
    sideBar: {
        index: 1,
        options: [-1, 0, 1, 2, 3, 4, 5],
        label: 'Text Color',
        advanced: true,
    },
});

// Sets properties for text a user inputs to be on a label
addStoredProperty(Label, 'text', {
    defaultValue: '...',
    immutableDefault: true,
    persist: {
        index: 2,
        deserializeFunc: decodeURIComponent,
    },
    sideBar: {
        index: 3,
        label: 'Label',
        textarea: true,
        // needs an onblur function for changes to be added to the actionQueue, so here as an empty function
        onblur: function() {},
    },
});
/* Allow the user to include a hyperlink in their label
By default the hyperlink option is blank until a user indicates otherwise */
addStoredProperty(Label, 'href', {
    defaultValue: '',
    /* Immutable properties always initialize blank, so users have to add them (in this case, a
      hyperlink) after the object has already been created */
    immutableDefault: true,
    persist: {
        index: 5,
        deserializeFunc: decodeURIComponent,
    },
    sideBar: {
        index: 4,
        label: 'Link to URL (optional)',
        advanced: true,
    },
});