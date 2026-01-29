/** *************************************************************************************************
User Summary
When a user clicks any of the following in the sidebar – see examples, how to, credits, save as link,
save as file, load from file, load from url, import extra file, embed in your blog, and make a GIF of
 your loopy design. Depending on which button is clicked a modal page will appear on the user’s
 screen displaying more information or a hyperlink to a new page is launched. The user can click
 outside of the popup window or click the X on the top right of the window to hide it.

Technical Summary
The Modal class is a subclass of PageUI. It is responsible for displaying modal pages to the user. The
modal pages are displayed in a popup window on the user’s screen. The modal pages are created using
the Page class. The modal pages are created using the addPage method. The modal pages are displayed
using the show method. The modal pages are hidden using the hide method. 

************************************************************************************************** */

function Modal(loopy) {
    const self = this;
    self.loopy = loopy;
    PageUI.call(self, document.getElementById('modal_page'));

    // Keep track of page titles for displaying in the modal
    self.pageTitles = {};

    // Is showing?
    self.isShowing = false;

    // show/hide
    self.show = function (pageName) {

        document.getElementById('modal_container').setAttribute('show', 'yes');

        // hide some modal elements for the access code modal
        if (pageName == 'access_code') {
            document.getElementById('modal_close_button').style.display = 'none';
            document.getElementById('modal_footer').style.display = 'none';
        }
        else {
            document.getElementById('modal_close_button').style.display = 'flex';
            document.getElementById('modal_footer').style.display = 'flex';
        }

        // Only show copy url button on save to url modal
        if(pageName == 'save_link') {
            document.getElementById('modal_copy_url').style.display = 'flex';
            document.getElementById('modal_buttons').classList.add('modal-buttons');
        }
        else{
            document.getElementById('modal_copy_url').style.display = 'none';
            document.getElementById('modal_buttons').classList.remove('modal-buttons');
        }

        self.isShowing = true;
        document.getElementById('valueStreamName').classList.add('valueStreamNameModalOpen');
    };

    self.hide = function () {
        // If no modal page is currently shown, nothing to hide
        if (!self.currentPage) {
            return;
        }
        document.getElementById('modal_container').setAttribute('show', 'no');
        if (self.currentPage.onhide) self.currentPage.onhide();
        self.isShowing = false;
        document.getElementById('valueStreamName').classList.remove('valueStreamNameModalOpen');
    };
    self.addPageTitle = function (pageName, pageTitle) {
        self.pageTitles[pageName] = pageTitle;
    };
    self.updateTitle = function (pageName) {
        let pageTitle = self.pageTitles[pageName] || '';

        document.querySelector('.modal-title').innerHTML = pageTitle;
    };
    self.updateErrorPage = function (page, options) {
        
        if(document.getElementById('error-message') == null){
            const desc = page.addComponent(new ComponentHTML({
                html: `<p id='error-message'>${options.message || "Something caused an Error" }</p>`,
            }));
            desc.dom.style.fontSize = '15px';
        } else {
            document.querySelector('#error-message').innerHTML =  options.message || "Something caused an Error";
        }
        document.querySelector('.modal-title').innerHTML = options.title || "Error";
    }

    // Onclick events for closing the modal, which need to be attached to the buttons and the modal background
    // Since the modal dialog is a child of the modal background, its clicks shouldn't propagate up to the background and trigger a close
    document.getElementById('modal_container').onclick = self.hide;
    document.getElementById('modal_dialog').onclick = function (event) {
        event.stopPropagation();
    };

    for (const btn of document.querySelectorAll('button.modal-close')) {
        btn.onclick = self.hide;
    }

    // Show... what page?
    subscribe('modal', (pageName, opt = '') => {
        self.show(pageName);
        self.updateTitle(pageName);

        const page = self.showPage(pageName);

        // Do something
        if (page.onshow) page.onshow(opt);

        // Dimensions
        const modalContent = document.querySelector('div.modal-content');
        modalContent.style.width = `${page.width}px`;
        modalContent.style.height = `${page.height}px`;

    });

    /// ////////////////
    // PAGES! /////////
    /// ////////////////

    // Save as link
    (function () {
        const page = new Page();
        page.width = 560;
        page.height = 285;
        const linkIntro = page.addComponent(new ComponentHTML({
            html: 'Use this link to keep track of or share this diagram:',
        }));
        linkIntro.dom.style.fontSize = '15px';

        const output = page.addComponent(new ComponentOutput({}));

        const linkWarning = page.addComponent(new ComponentHTML({
            html: '<br />Be sure to save it somewhere safe, as your work may be lost without it!',
        }));
        linkWarning.dom.style.fontSize = '15px';

        page.onshow = async function () {
            // Copy-able link
            output.output('Generating link...');

            let link = loopy.saveToURL();

            // is.gd sees localhost or similar as a bad URL, so local testing needs to use flowsim.ai
            link = link.replace(/127\.0\.0\.1:\d+/, 'flowsim.ai').replace(/localhost:\d+/, 'flowsim.ai');

            const body = {
                "url" : link
            }

            const shortcode_response = await fetch('https://api.tinyurl.com/create', {
                method: "POST",
                headers: {
                    "Authorization": "Bearer uGkSnSZPKOXzMi5BUGSBxbJ5EtA5FA2CVcCimCJD8xUnw3TnRwbMjt2hbS6F",
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            })
            .then(response => response.json())
            .catch(err => console.log(err));

            if (shortcode_response?.errors.length == 0) {
                const shortLink = shortcode_response.data.tiny_url;
                output.output(shortLink);    
                self.loopy.shortURL = shortLink;
            }
            else {
                let errorMessage = `Error generating short link`;
                if(shortcode_response) {
                    let errorResponse = shortcode_response.errors[0];
                    for(let i = 1; i<shortcode_response.errors.length; i++) {
                        errorResponse = `, ${shortcode_response.errors[i]}`;
                    }
                    errorMessage = `${errorMessage}: ${errorResponse}`;
                }
                console.log(errorMessage);
                output.output(link);
                self.loopy.shortURL = link;
            }
            
            output.dom.select();
        };

        // or, tweet it
        self.addPage('save_link', page);
        self.addPageTitle('save_link', 'Save as Link');
    }());

    // Access Code
    (function () {
        const page = new Page();
        page.width = 560;
        page.height = 285;
        const accessIntro = page.addComponent(new ComponentHTML({
            html: 'Please enter the access code',
        }));
        accessIntro.dom.style.fontSize = '20px';
        accessIntro.dom.style.textAlign = 'center';
        accessIntro.dom.style.paddingBottom = '25px';

        const accessInput = page.addComponent(new ComponentHTML({
            html: `<form id="access_code_form" onsubmit="loopy.getAccessCode(event)">
                        <input id="access_code_input" name="access_code_input"/>
                        <button type="submit">Submit</button>
                    </form>`,
        }));
        accessInput.dom.style.textAlign = 'center';

        const errorMessage = page.addComponent(new ComponentHTML({
            html: `Incorrect Access Code`,
        }));
        errorMessage.dom.style.textAlign = 'center';
        errorMessage.dom.style.color = 'red';
        errorMessage.dom.style.display = 'none';
        errorMessage.dom.style.display = 'none';
        errorMessage.dom.setAttribute("id", "error_message");

        self.addPage('access_code', page);
        self.addPageTitle('access_code', 'Enter Access Code');
    }());

    // Embed
    (function () {
        const page = new Page();
        page.width = 760;
        page.height = 600;

        // ON UPDATE DIMENSIONS
        let iframeSRC;
        const _onUpdate = function () {
            iframeSRC = loopy.saveToURL(true);
            const embedCode = `<iframe width="${width.getValue()}" height="${height.getValue()}" style="border: 0;" src="${iframeSRC}"></iframe>`;
            output.output(embedCode);
            iframe.src = iframeSRC;
        };

        // THE SHTUFF
        const sidebar = document.createElement('div');
        sidebar.style.width = '150px';
        sidebar.style.height = '440px';
        sidebar.style.float = 'left';
        page.dom.appendChild(sidebar);

        // FIXME: dedup
        // Label
        let label = document.createElement('div');
        label.style.marginTop = '10px';
        label.style.marginBottom = '20px';
        label.innerHTML = 'PREVIEW &rarr;';
        sidebar.appendChild(label);

        // FIXME: dedup
        // Label 2
        label = document.createElement('div');
        label.style.fontSize = '15px';
        label.innerHTML = 'what size do you want your embed to be?';
        sidebar.appendChild(label);

        // Size!
        const width = _createNumberInput(_onUpdate);
        sidebar.appendChild(width.dom);
        // FIXME: dedup
        label = document.createElement('div');
        label.style.display = 'inline-block';
        label.style.fontSize = '15px';
        label.innerHTML = '&nbsp;×&nbsp;';
        sidebar.appendChild(label);
        const height = _createNumberInput(_onUpdate);
        sidebar.appendChild(height.dom);

        // FIXME: dedup
        // Label 3
        label = document.createElement('div');
        label.style.fontSize = '15px';
        label.innerHTML = "<br><br>copy this code into your website's html:";
        sidebar.appendChild(label);

        // Output!
        const output = new ComponentOutput({});
        output.dom.style.fontSize = '12px';
        sidebar.appendChild(output.dom);

        // FIXME: dedup
        // Label 3
        label = document.createElement('div');
        label.style.fontSize = '15px';
        label.style.textAlign = 'right';
        label.innerHTML = "<br><br>(note: the REMIX button lets someone else, well, remix your model! don't worry, it'll just be a copy, it won't affect the original.)";
        sidebar.appendChild(label);

        // IFRAME
        const iframe = page.addComponent(new ModalIframe({
            page,
            manual: true,
            src: '',
            width: 500,
            height: 440,
        })).dom;
        iframe.style.float = 'right';
        page.onshow = function () {
            // Default dimensions
            width.setValue(500);
            height.setValue(440);

            // The iframe!
            iframeSRC = loopy.saveToURL(true);
            iframe.src = iframeSRC;

            // Select to copy-paste
            _onUpdate();
            output.dom.select();
        };
        page.onhide = function () {
            iframe.removeAttribute('src');
        };
        self.addPage('embed', page);
        self.addPageTitle('embed', 'Embed in your Blog');
    }());

    // urlRemoteFile
    (function () {
        const page = new Page();
        page.width = 560;
        page.height = 265;
        const desc = page.addComponent(new ComponentHTML({
            html: `Upload your .vsim.json file into a website (with CORS header allowing ${location.host}) then add it url to this one :`,
        }));
        desc.dom.style.fontSize = '15px';
        const output = page.addComponent(new ComponentOutput({}));
        output.output(`${location.href.split('?')[0].split('#')[0]}?url=https://where_your_uploaded_file_is_located/your_file.vsim`);

        const label = document.createElement('div');
        label.style.fontSize = '15px';
        label.style.marginTop = '6px';
        
        page.dom.appendChild(label);

        self.addPage('urlRemoteFile', page);
        self.addPageTitle('urlRemoteFile', 'Load from URL');
    }());

    // keyboardShortcuts
    (function () {
        const page = new Page();
        page.width = 560;
        page.height = 420;

        let keyboardShortcuts = [];

        for (let keycode in KEY_CODES) {
            if (['enter', 'control', 'delete', 'space', 'zoomin', 'zoomout'].includes(KEY_CODES[keycode])) {
                continue;
            }

            let toolName = KEY_CODES[keycode].substring(0,1).toUpperCase() + KEY_CODES[keycode].substring(1); // capitalize the first letter
            let keyboardLetter = String.fromCharCode(keycode);

            let alternateToolNames = {
                "Ink": "Pencil",
                "Label": "Text",
                "Drag": "Move"
            };

            // if the tool name is called something else from what's stored with the keycodes, change it to the right name instead
            if (toolName in alternateToolNames) {
                toolName = alternateToolNames[toolName];
            }

            keyboardShortcuts.push(`<tr><td>${toolName}</td><td>${keyboardLetter}</td></tr>`);
        }

        keyboardShortcuts.push(`<tr><td>Play / Stop</td><td>Space</td></tr>`); // add play and stop separately because they use the same key
        keyboardShortcuts.push(`<tr><td>Zoom In </td><td>+</td></tr>`); // add zoom in once because two separate key
        keyboardShortcuts.push(`<tr><td>Zoom Out </td><td>-</td></tr>`); // add zoom out once because two separate key
        keyboardShortcuts.sort(); // sort alphabetically for display

        const desc = page.addComponent(new ComponentHTML({
            html: `
                    <table width="300">
                        ${keyboardShortcuts.join('\n')}
                    </table>
                `.trim(),
        }));
        desc.dom.style.fontSize = '15px';

        
        self.addPage('keyboardShortcuts', page);
        self.addPageTitle('keyboardShortcuts', 'Keyboard Shortcuts');
    }());


    // saveMethodChoosing
    (function () {
        const page = new Page();
        page.width = 560;
        page.height = 265;
        const desc = page.addComponent(new ComponentHTML({
            html: `
                    <a class="save-option" onclick='publish("modal",["save_link"])'>
                        <i class="bi bi-link-45deg"></i>
                        Save as Link
                    </a>
                    <a class="save-option" onclick='publish("export/json"); document.getElementById("modal_container").click();' data-dismiss="modal">
                        <i class="bi bi-box-arrow-down"></i>
                        Save as File
                    </a>
                `,
        }));
        desc.dom.style.fontSize = '15px';

        self.addPage('saveMethodChoosing', page);
        self.addPageTitle('saveMethodChoosing', 'Choose a Save Option');
    }());    

    // Node Edge Limit Error Popup
    (function () {
        const page = new Page();
        page.width = 560;
        page.height = 275;

        page.onshow = function(opt) {
            self.updateErrorPage(page, opt);
        }

        self.addPage('error', page);
    }());
}

//Copy to clipboard
function copyLink() {
    // If the protocol is https use the new clipboard API
    if (window.location.protocol == 'https:') {
        navigator.clipboard.writeText(loopy.shortURL);
    } else {
        // Old deprecated way of copying to clipboard used for http
        const textArea = document.createElement("textarea");
        textArea.value = loopy.shortURL;
        textArea.style.visibility = 'hidden';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('Unable to copy to clipboard', err);
        }
        document.body.removeChild(textArea);
        const inputURL = document.getElementById('modal_read_only_input');
        inputURL.focus();
        inputURL.select();
    }
    
}