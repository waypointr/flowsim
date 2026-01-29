/** *************************************************************************************************
User Summary
The functionality in this file sets user name for the value stream, and the indicators for the value stream.

Technical Summary
These functions define and injects various properties, such as the value stream name and the indicators for the value stream. 
The value stream name is set to a default value of an empty string, and the indicators are set to default values of 70, 80, 100, and 150. 
The properties are also displayed in the sidebar, allowing users to modify and customize the properties of the value stream.

************************************************************************************************** */

const MAX_INDICATOR_LENGTH = 6;
const valueStreamMaxTextLength = 30;


//onblur
function validateAndPublish(input, oldValue) {
    let elem = document.getElementById(input.id)
    if(elem) {
        if(elem.value == '' || elem.value == '.') {
            elem.value=oldValue;
        }
        elem.value = input.value;
    }
}

//oninput
function forceValidBottleneckInput(input, oldValue){
    if(!input) {
        return;
    }
    //no multiple leading zeros
    if(/^0+0/.test(input.value)) {
        input.value=0;
    }
    //no more than 2 digits after decimals
    if(/.\d{3,}/.test(input.value)) {
        input.value = oldValue;
    }

    // Length
    if(input.value.length > MAX_INDICATOR_LENGTH) {
        input.value = oldValue;
    }
}

//cannot leave a field empty
function changeIfEmpty(input, oldValue) {
    if(input && input.value == '') {
        input.value=oldValue;
    }
    else {
        // updating the tab title and valueStreamName
        document.title = loopy.valueStreamNameInput;
        document.getElementById("valueStreamName").innerHTML = loopy.valueStreamNameInput;
    }
}

function checkMaxLabelLength(value) {
    if(value.dom.value.length > valueStreamMaxTextLength) {
        value.dom.value = value.dom.value.substr(0, valueStreamMaxTextLength);
    }
};

function checkIndicatorOrder(input, oldValue) {
    const bottleneckMessage = 'The % entries between different stages must not be the same and must be increasing from prior stages.';
    let yellow = document.getElementById('indicatorYellow');
    if(yellow && (Number(parseFloat(yellow.value).toFixed(2)) < 0.00 || yellow.value == '')) {
        return bottleneckMessage;
    }
    // red low
    let redLow = document.getElementById('indicatorRedLow');
    if(yellow && redLow && (Number(parseFloat(redLow.value).toFixed(2)) <= Number(parseFloat(yellow.value).toFixed(2)) || redLow.value == '')) {
        return bottleneckMessage;
    }
    // red medium
    let redMedium = document.getElementById('indicatorRedMedium');
    if(redLow && redMedium && (Number(parseFloat(redMedium.value).toFixed(2)) <= Number(parseFloat(redLow.value).toFixed(2)) || redMedium.value == '')) {
        return bottleneckMessage;
    }
    // red high
    let redHigh = document.getElementById('indicatorRedHigh');
    if(redMedium && redHigh && (Number(parseFloat(redHigh.value).toFixed(2)) <= Number(parseFloat(redMedium.value).toFixed(2)) || redHigh.value == '')) {
        return bottleneckMessage;
    }
    return '';
}


addStoredProperty(Loopy, 'valueStreamNameInput', {
    defaultValue: '',
    persist: 0,
    sideBar: {
        index: 0,
        id: 'valueStreamNameInput',
        onblur: changeIfEmpty,
        oninput: checkMaxLabelLength,
    }
});

const indicators = ['indicatorYellow', 'indicatorRedLow', 'indicatorRedMedium', 'indicatorRedHigh'];
const indicatorDefaults = ['70', '80', '100', '150'];
for(let i in indicators) {
    addStoredProperty(Loopy, indicators[i], {
        persist: 2 + parseInt(i),
        defaultValue: indicatorDefaults[i],
        sideBar: {
            index: 2 + parseInt(i),
            id: indicators[i],
            objType: 'Loopy',
            onblur: validateAndPublish,
            oninput: forceValidBottleneckInput,
            checkvalid: checkIndicatorOrder,
            bottleneck: true,
            inlineValidation: {
                elementId: 'bottleneckMessage',
                validate: (input, config, oldValue) => {
                    return checkIndicatorOrder(input, oldValue);
                }
             },
        },
    });
}

