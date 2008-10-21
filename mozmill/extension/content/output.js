
var arrays = {}; Components.utils.import('resource://mozmill/stdlib/arrays.js', arrays);

var typeColorMap = {
  "fail":'lightred',
  "pass":'lightgreen',
  "test":'lightyellow',
}

var createCell = function (t, obj, message) {
  var color = typeColorMap[t];
  if (color == undefined) {
    var color = 'lightyellow';
  }
  
  var r = window.document.getElementById("resOut");
  var msg = window.document.createElement('hbox');
  msg.setAttribute("class", "resultrow");
  msg.style.background = color;
  msg.textContent = t+' :: '+message;
  r.insertBefore(msg, r.childNodes[0]);
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
