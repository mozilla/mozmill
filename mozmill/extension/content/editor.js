var editor = {
  index : 0,

  tabs : [],

  currentTab : null,

  width : 500,
  
  height : 700,

  init : function(width, height) {
    this.width = width;
    this.height = height;
    this.openNew();
  },

  resize : function(width, height) {
    this.width = width;
    this.height = height;
    this.reloadSize();
  },

  reloadSize : function() {
    if(this.currentTab) {
      this.currentTab.iframeElement.style.width = this.width + "px";
      this.currentTab.iframeElement.style.height = this.height + "px";
      if(this.currentTab.editorElement) {
        this.currentTab.editorElement.style.width = (this.width - 20) + "px";
        this.currentTab.editorElement.style.height = (this.height - 20) + "px";
      }
    }
  },

  switchTab : function(index) {
    if(this.currentTab)
      this.currentTab.iframeElement.style.display = "none";
    this.index = index;
    this.currentTab = this.tabs[index];
    this.reloadSize();
    this.currentTab.iframeElement.style.display = "block";
  },

  closeCurrentTab : function(index) {
    var len = this.tabs.length;
    this.tabs.slice(index, len).concat(this.tabs.slice(0, index - 1));
  },

  openNew : function() {
    var newTab = new editorTab(this.width, this.height);
    this.tabs.push(newTab);
    this.switchTab(this.tabs.length - 1);
  }
}


function editorTab(width, height) {
  var iframeElement = document.createElement("iframe");
  iframeElement.style.width = width + "px";
  iframeElement.style.height = height + "px";
  iframeElement.className = "editor-frame";
  var editorObject = this;

  iframeElement.addEventListener("load", function() {
    editorObject.editorElement = iframeElement.contentDocument.getElementById("editor");
    editorObject.editor = iframeElement.contentWindow.editor;
  } , true);
  iframeElement.src = "oldeditor.html";
  document.getElementById("editors").appendChild(iframeElement);

  this.iframeElement = iframeElement;
  this.fileName = "temp";
}

editorTab.prototype = {
  initFromFile : function(file) {
    this.editor.setContent(FileIO.read(file));
    this.fileName = file;
  },

  setContent : function(content) {
    this.editor.setContent(content);
  },

  saveToFile : function() {
    var file = this.fileName;
    if (!file.exists())
      FileIO.create(file); 
    FileIO.write(file, this.editor.getContent(), 'w');
  },

  saveAs : function(fileName) {
    this.fileName = fileName;
    this.saveToFile;
  }
}
