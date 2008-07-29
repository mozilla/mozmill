function openFile(){
  utils.openFile(window);
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
}

function accessOutput(){
  var copyOutputBox = $('copyout');
  var dx = $('dxContainer')
  var dxDisp = $('dxDisplay');
  
  //if copyable output is already shown
  if (copyOutputBox.label == 'Hide Copyable Output'){
   copyOutputBox.label = 'Show Copyable Output';
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
  
  $('copyout').label = 'Hide Copyable Output';
}