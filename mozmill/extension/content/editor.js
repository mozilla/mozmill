var editor = {
  init : function() {
     this.editor = new bespin.editor.Component("editor",
       { language: "js",
         loadfromdiv: false });
     this.editor.setContent("var x = 2349823;");
  }
}

window.addEventListener("load", function() {editor.init();}, false);
