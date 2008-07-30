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
  utils.runFile(window);
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