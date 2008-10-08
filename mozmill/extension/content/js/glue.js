
var frame = {}; Components.utils.import('resource://mozmill/modules/frame.js', frame);
var results = {}; Components.utils.import('resource://mozmill/modules/results.js', results);
// var utils = {}; Components.utils.import('resouce://mozmill/modules/utils.js', utils);

// Set UI Listeners in frame
function stateListener (state) {
  if (state != 'test') {  
    $('runningStatus').textContent = 'Status: '+state;
    results.write(state)
  }
}
frame.events.addListener('setState', stateListener);
function testListener (test) {
  $('runningStatus').textContent = 'Status: Running test: '+test.__name__;
  results.write('Started running test: '+test.__name__);
}
frame.events.addListener('setTest', testListener);
function passListener (text) {
  results.write('Pass: '+text, 'green');
}
frame.events.addListener('pass', passListener);
function failListener (text) {
  results.write('Fail: '+text, 'red');
}
frame.events.addListener('fail', failListener);

function openFile(){
  var openFn = utils.openFile(window);
  if (openFn){
    window.openFn = openFn;
    $('saveMenu').removeAttribute("disabled");
    $('closeMenu').removeAttribute("disabled");
  }
}

function saveAsFile() {
  var openFn = utils.saveAsFile(window);
  if (openFn){
    window.openFn = openFn;
    $('saveMenu').removeAttribute("disabled");
    $('closeMenu').removeAttribute("disabled");
  }
}

function saveFile() {
  if ($('saveMenu').getAttribute("disabled")){ return; }
  utils.saveFile(window);
}

function closeFile() {
 if ($('closeMenu').getAttribute("disabled")){ return; }
 var really = confirm("Are you sure you want to close this file?");
 if (really == true) {
   $('editorInput').value = '';
   delete window.openFn;
   $('saveMenu').setAttribute("disabled","true");
   $('closeMenu').setAttribute("disabled","true");
 }
}

function runFile(){
  $('runningStatus').textContent = 'Status: Running File...';
  var nsIFilePicker = Components.interfaces.nsIFilePicker;
  var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
  //define the file picker window
  fp.init(window, "Select a File", nsIFilePicker.modeOpen);
  fp.appendFilter("JavaScript Files","*.js");
  //show the window
  var res = fp.show();
  //if we got a file
  if (res == nsIFilePicker.returnOK){
    var thefile = fp.file;
    //create the paramObj with a files array attrib
    var paramObj = {};
    paramObj.files = [];
    paramObj.files.push(thefile.path);

    //Move focus to output tab
    //w.document.getElementById('mmtabs').setAttribute("selectedIndex", 2);
    //send it into the JS test framework to run the file
    var collector = new frame.Collector();
    var module = collector.initTestModule(thefile.path);
    var runner = new frame.Runner(collector);
    runner.runTestModule(module);
  }
  $('runningStatus').textContent = 'Status: See Output Tab...';
}

function runEditor(){
  $('runningStatus').textContent = 'Status: Running Editor...';
  utils.runEditor(window);
  $('runningStatus').textContent = 'Status: See Output Tab...';
}

function genBoiler(){
  utils.genBoiler(window);
}

function logicalClear(){
  var idx = $('mmtabs').selectedIndex;
  if (idx == 0){ $('editorInput').value = ''; }
  else if (idx == 1){ $('resOut').textContent = ''; }
  else if (idx == 2){ $('perfOut').textContent = ''; }
}

function accessOutput(){
  var copyOutputBox = $('copyout');
      var dx = $('dxContainer')
      var dxDisp = $('dxDisplay');
      
      //if copyable output is shown
      if (!copyOutputBox.getAttribute("checked")){
       dx.style.display = 'none';
       dxDisp.textContent = '';
       return;
      }
      
      var n = $('outputtab');
      var txt = '';
      for (var c = 0; c < n.childNodes.length; c++){
        if (n.childNodes[c].textContent){
          txt += n.childNodes[c].textContent + '\n';  
        }
        else{
          txt += n.childNodes[c].value + '\n';
        }
      }
      if (txt == undefined){ return; }
      
      dx.style.display = 'block';
      dxDisp.value = txt;
}