
var arrays = {}; Components.utils.import('resource://mozmill/stdlib/arrays.js', arrays);
var json2 = {}; Components.utils.import('resource://mozmill/stdlib/json2.js', json2);

var createCell = function (t, obj, message) {

  var r = window.document.getElementById("resOut");
  var msg = window.document.createElement('hbox');
  msg.setAttribute("class", t);
  //msg.style.background = color;
  //var serialized = json2.JSON.stringify(message);
  msg.setAttribute("orient", "vertical");
  msg.setAttribute("style", "font-weight:bold");
  
  //Adding each of the message attributes dynamically
  var count = 0; //height
  //if message isn't an object
  if (typeof(message) == "string"){
    count = "15";
    msg.textContent = t+' :: '+message;
  }
  else {
    //add each piece in its own hbox
    msg.textContent = t+' :: '+message['function'] + ' ( Toggle.. )';
    //For each attribute
    for (i in message){
      //if the value isn't undefined
      if (message[i] != undefined){
        var stuff = window.document.createElement('hbox');
        stuff.setAttribute("style", "font-weight:normal");
        stuff.textContent = i +": " +message[i];
        stuff.style.width = "100%";
        msg.appendChild(stuff);
        count += 20;
      }
      else { count += 20; }
    }
  }
  
  //Add the event listener for clicking on the box to see more info
  msg.addEventListener('mousedown', function(e){ 
    if (e.target.style.height == "15px"){
      e.target.style.height = count+"px";
    }
    else { 
      e.target.style.height = "15px"; 
    }
    }, true);
    
  r.insertBefore(msg, r.childNodes[0]);
  updateOutput();
}

var frame = {}; Components.utils.import('resource://mozmill/modules/frame.js', frame);
// var utils = {}; Components.utils.import('resouce://mozmill/modules/utils.js', utils);

// Set UI Listeners in frame
function stateListener (state) {
  if (state != 'test') {  
    $('runningStatus').textContent = 'Status: '+state;
    // results.write(state)
  }
}
frame.events.addListener('setState', stateListener);
function testListener (test) {
  createCell('test', test, 'Started running test: '+test.__name__)
  $('runningStatus').textContent = 'Running test: '+test.__name__;
}
frame.events.addListener('setTest', testListener);
function passListener (text) {
  createCell('pass', text, text)
}
frame.events.addListener('pass', passListener);
function failListener (text) {
  createCell('fail', text, text)
}
frame.events.addListener('fail', failListener);


// 
// var write = function(s, color){
//  var win = null;
//  var enumerator = Components.classes["@mozilla.org/appshell/window-mediator;1"]
//                      .getService(Components.interfaces.nsIWindowMediator)
//                      .getEnumerator("");
//   while(enumerator.hasMoreElements()) {
//     var win = enumerator.getNext();
//     if (win.document.title == 'MozMill IDE'){
//  //     win.focus();
//       var r = win.document.getElementById("resOut");
//       var msg = win.document.createElement('hbox');
//       msg.setAttribute("class", "resultrow");
//       if (typeof(color) != 'undefined'){
//         msg.style.background = color;
//       }
//       else{
//         msg.style.background = 'lightyellow';
//       }
//       msg.textContent = s;
// 
//       r.insertBefore(msg, r.childNodes[0]);
//     }
//   }
// }
// 
// 
// 
// 
// 
