//Determines of the event is accel, meaning
//ctrl or cmd depending on your platform
//but none of the other modified keys
function isAccel(e){
  var plat = navigator.platform;
  var isMac = (plat.indexOf('Mac') != -1);
  var modifiers = e.altKey || e.shiftKey;
  
  if ((isMac) && (!modifiers) && (e.metaKey) && (!e.ctrlKey)){
    return true;
  }
  else if ((!isMac) && (!modifiers) && (e.ctrlKey)){
    return true;
  }
  
  return false;
}

//window onkeypress handler for various keyboard
//shortcuts
window.onkeypress = function(e){
  if (isAccel(e)){
    
    switch(String.fromCharCode(e.charCode)){
      case 'o':
        openFile();
      break;
      
      case 'r':
        runEditor();
      break;
      
      case 'a':
        saveAsFile();
      break;
      
      case 's':
        saveFile();
      break;
      
      case 'n':
        openNewWindow();
      break;
      
      default:
        return;
    }
  }
}