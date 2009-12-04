//Determines of the event is accel, meaning
//ctrl or cmd depending on your platform
//but none of the other modified keys
function isAccel(e){
  var plat = navigator.platform;
  var isMac = (plat.indexOf('Mac') != -1);
  var modifiers = e.altKey;
  
  if ((isMac) && (!modifiers) && (e.metaKey) && (!e.ctrlKey) && (!e.shiftKey)){
    return true;
  }
  else if ((!isMac) && (!modifiers) && (e.ctrlKey) && (e.shiftKey) && (!e.metaKey)){
    
    return true;
  }
  return false;
};

//window onkeypress handler for various keyboard
//shortcuts
window.onkeypress = function(e){
  if (isAccel(e)){ 
    switch(String.fromCharCode(e.charCode).toLowerCase()){
      case 'z':
         var node = window.frames['frame_editorInput'].document.getElementById('tab_file_'+encodeURIComponent(window.openFn));
         var disp = node.getElementsByTagName("strong")[0].style.display;
         if (disp != "inline"){
           return false;
         }
      break;
      case 'g':
        e.preventDefault();
        align();
      break;
      case 'a':
        e.preventDefault();
        showFileMenu();
      break;
      case 'p':
        e.preventDefault();
        showOptionDialog();
      break;
      case 'o':
        e.preventDefault();
        openFile();
      break;
      case 'b':
        e.preventDefault();
        newFile();
      break;
      case 'r':
        e.preventDefault();
        runEditor();
      break;
      case 'd':
        e.preventDefault();
        MozMillrec.toggle();
      break;
      case 'v':
        e.preventDefault();
        saveAsFile();
      break;
      case 's':
        e.preventDefault();
        saveFile();
      break;
      case 'c':
        e.preventDefault();
        closeFile();
      break;
      case 'n':
        e.preventDefault();
        newTemplate();
      break;
      case 't':
        e.preventDefault();
        runDirectory();
      break;
      case 'l':
        e.preventDefault();
        logicalClear();
      break;
      case '1':
        e.preventDefault();
        $("#tabs").tabs().tabs("select", 0);
      break;
      case '2':
        e.preventDefault();
        $("#tabs").tabs().tabs("select", 1);
      break;
      case '3':
        e.preventDefault();
        $("#tabs").tabs().tabs("select", 2);
      break;
      case '4':
        e.preventDefault();
        $("#tabs").tabs().tabs("select", 3);
      break;
      default:
        return;
    }
  }
};
