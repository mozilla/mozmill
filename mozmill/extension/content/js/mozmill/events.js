mozmill.events = new function() {

    this.createEventObject = function(element, controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown) {
          var evt = element.ownerDocument.createEventObject();
          evt.shiftKey = shiftKeyDown;
          evt.metaKey = metaKeyDown;
          evt.altKey = altKeyDown;
          evt.ctrlKey = controlKeyDown;
          return evt;
    };


    /* Fire an event in a browser-compatible manner */
    this.triggerEvent = function(element, eventType, canBubble, controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown) {
        canBubble = (typeof(canBubble) == undefined) ? true: canBubble;
        var evt = document.createEvent('HTMLEvents');

        evt.shiftKey = shiftKeyDown;
        evt.metaKey = metaKeyDown;
        evt.altKey = altKeyDown;
        evt.ctrlKey = controlKeyDown;

        evt.initEvent(eventType, canBubble, true);
        element.dispatchEvent(evt);

    };

    this.getKeyCodeFromKeySequence = function(keySequence) {
        var match = /^\\(\d{1,3})$/.exec(keySequence);
        if (match != null) {
            return match[1];

        }
        match = /^.$/.exec(keySequence);
        if (match != null) {
            return match[0].charCodeAt(0);

        }
        // this is for backward compatibility with existing tests
        // 1 digit ascii codes will break however because they are used for the digit chars
        match = /^\d{2,3}$/.exec(keySequence);
        if (match != null) {
            return match[0];

        }
        mozmill.ui.results.writeResult("invalid keySequence");

    }

    this.triggerKeyEvent = function(element, eventType, keySequence, canBubble, controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown) {
        var keycode = mozmill.events.getKeyCodeFromKeySequence(keySequence);
        canBubble = (typeof(canBubble) == undefined) ? true: canBubble;
        
        var evt;
        if (window.KeyEvent) {
            evt = document.createEvent('KeyEvents');
            evt.initKeyEvent(eventType, true, true, window, controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown, keycode, keycode);

        } 
        else {
            evt = document.createEvent('UIEvents');

            evt.shiftKey = shiftKeyDown;
            evt.metaKey = metaKeyDown;
            evt.altKey = altKeyDown;
            evt.ctrlKey = controlKeyDown;

            evt.initUIEvent(eventType, true, true, window, 1);
            evt.keyCode = keycode;
            evt.which = keycode;

        }
        element.dispatchEvent(evt);
    }

    /* Fire a mouse event in a browser-compatible manner */
    this.triggerMouseEvent = function(element, eventType, canBubble, clientX, clientY, controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown) {
        clientX = clientX ? clientX: 0;
        clientY = clientY ? clientY: 0;

        //LOG.warn("mozmill.events.triggerMouseEvent assumes setting screenX and screenY to 0 is ok");
        var screenX = 0;
        var screenY = 0;

        canBubble = (typeof(canBubble) == undefined) ? true: canBubble;

        var evt = document.createEvent('MouseEvents');
        if (evt.initMouseEvent) {
            //LOG.info("element has initMouseEvent");
            //Safari
            evt.initMouseEvent(eventType, canBubble, true, document.defaultView, 1, screenX, screenY, clientX, clientY, controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown, 0, null)

        }
        else {
            //LOG.warn("element doesn't have initMouseEvent; firing an event which should -- but doesn't -- have other mouse-event related attributes here, as well as controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown");
            evt.initEvent(eventType, canBubble, true);
            evt.shiftKey = shiftKeyDown;
            evt.metaKey = metaKeyDown;
            evt.altKey = altKeyDown;
            evt.ctrlKey = controlKeyDown;

        }
        //Used by safari
        element.dispatchEvent(evt);
      }
};