window.addEventListener("load", function() {editor.init();}, false);

var editor = {
  index : 0,

  tabs : [],

  init : function() {
     this.editor = new bespin.editor.Component("editor",
       { language: "js",
         loadfromdiv: false });
     this.editor.setContent("var x = 2349823;");
	 this.openNew();
  },

  switchTab : function(index) {
    this.tabs[this.index].storeContent(this.editor.getContent());    
    this.index = index;
    this.editor.setContent(this.tabs[index].content);
  },

  closeTab : function(index) {
    var len = this.tabs.length;
    this.tabs.slice(index, len).concat(this.tabs.slice(0, index - 1));
  },

  openNew : function() {
    this.tabs.push(new editorTab());
    this.switchTab(this.tabs.length - 1);
  },

  openTemplate : function() {
    var newTab = new editorTab();
    newTab.initWithTemplate();
    this.tabs.push(newTab);
  }
}

function editorTab() {
  var editorElement = document.createElement("iframe");
  editorElement.style.width ="400px";
  editorElement.style.height = "200px";
  editorElement.style.margin = "20px";
  editorElement.id = "editor" + Math.round(Math.random() * 1000);
  editorElement.src = "oldeditor.html"
  document.getElementById("editors").appendChild(editorElement);
  this.fileName = "temp";
}

editorTab.prototype = {

  initWithTemplate : function() {
    this.content = "boilerplate";
    this.fileName = "temp"; // utils.tempfile().path;
  },

  initFromFile : function(file) {
    this.content = FileIO.read(file);
    this.fileName = file;
  },

  storeContent : function(content) {
    this.content = content;
  },

  saveToFile : function() {
    var file = this.fileName;
    if (!file.exists())
      FileIO.create(file); 
    FileIO.write(file, this.content, 'w');
  },

  saveAs : function(fileName) {
    this.fileName = fileName;
    this.saveToFile;
  }
}
