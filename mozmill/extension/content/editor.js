      //make the editor fill the space on mac
      // if (navigator.platform.indexOf('Mac') != -1){
      //       document.getElementById('editorInput').rows = 43;
      //     }
  		var eaInit = function(){
  		   window.openFn = utils.tempfile().path;
         editAreaLoader.openFile('editorInput', {text:'',title:getFileName(window.openFn),id:window.openFn});
         
         function alpha(e) {
           if (e.ctrlKey || e.metaKey){
             return false;
           }
           if ((e.charCode > 96) && (e.charCode < 123)){
             return true;
           }
           else if ((e.charCode > 64) && (e.charCode < 91)){
             return true;
           }
           else if ((e.charCode > 44) && (e.charCode < 58)){
             return true;
           }
           return false;
         };
         
         window.frames['frame_editorInput'].onkeypress = function(e){
           if (alpha(e)){
             var node = window.frames['frame_editorInput'].document.getElementById('tab_file_'+encodeURIComponent(window.openFn));
             node.getElementsByTagName("strong")[0].style.display = "inline";
           }
         }
         
         //fixing the editor or resize issue
          window.onresize = function(e){
            syncHeights();
          }
          syncHeights();
  		};
  		
  		var eaFileClosed = function(obj){
          var all = editAreaLoader.getAllFiles('editorInput');
          var count = 0;
          //open a new temp if the last window
          //gets closed, since there is no array
          //we have to loop the object properties
          for (x in all){
            count++;
          }
          if (count == 1){
            newFile();
          }
  		};
  		
  		var eaTabOn = function(obj){
  		  window.openFn = editAreaLoader.getCurrentFile('editorInput').id;
  		}
  	
      // initialisation
      editAreaLoader.init({
       id: "editorInput" // id of the textarea to transform    
       ,start_highlight: true  // if start with highlight
       ,allow_resize: false
       ,allow_toggle: true
       ,browsers: "all"
       ,language: "en"
       ,syntax: "js"
       ,is_multi_files: true
       ,EA_load_callback : "eaInit"
       ,EA_file_close_callback: "eaFileClosed"
       ,EA_file_switch_on_callback: "eaTabOn"
      });
    
