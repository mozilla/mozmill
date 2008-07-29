function openFile(){
  utils.openFile(window);
}

function runFile(){
  utils.runFile(window);
}

function runEditor(){
  utils.runEditor(window);
}

function genBoiler(){
  utils.genBoiler(window);
}

function accessOutput(){
  var copyOutputBox = document.getElementById('copyout');
  var dx = document.getElementById('dxContainer')
  var dxDisp = document.getElementById('dxDisplay');
  
  //if copyable output is already shown
  if (copyOutputBox.label == 'Hide Copyable Output'){
   copyOutputBox.label = 'Show Copyable Output';
   dx.style.display = 'none';
   dxDisp.textContent = '';
   return;
  }
  
  var n = window.document.getElementById('outputtab');
  var txt = '';
  for (var c = 0; c < n.childNodes.length; c++){
    if (n.childNodes[c].textContent){
      txt += n.childNodes[c].textContent + '\n';  
    }
    else{
      txt += n.childNodes[c].value + '\n';
    }
  }
  dx.style.display = 'block';
  dxDisp.value = txt;
  
  document.getElementById('copyout').label = 'Hide Copyable Output';
}