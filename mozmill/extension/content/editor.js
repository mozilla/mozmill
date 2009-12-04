var editor = {
  index : 0,

  tabs : [],

  currentTab : null,

  width : 500,
  
  height : 700,

  tempCount : 0,

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
    if(index == undefined) {
      index = this.tabs.length - 1;}
    if(index < 0)
      return;

    var tabSelect = document.getElementById("editor-tab-select");
    tabSelect.selectedIndex = index;

    if(this.currentTab)
      this.currentTab.iframeElement.style.display = "none";
    this.index = index;
    this.currentTab = this.tabs[index];
    this.reloadSize();
    this.currentTab.iframeElement.style.display = "block";
  },

  closeCurrentTab : function() {
    this.currentTab.destroy();
    this.currentTab = '';
    this.tabs.splice(this.index, 1);

    var tabSelect = document.getElementById("editor-tab-select");
    var option = tabSelect.getElementsByTagName("option")[this.index];
    tabSelect.removeChild(option);

    this.switchTab();
  },

  openNew : function(content, filename) {
    if(!filename) {
      this.tempCount++;
      filename = utils.tempfile("mozmill.utils.temp" + this.tempCount).path;
      var tabName = "temp " + this.tempCount;
    }
    else
      var tabName = getFileName(filename);

    var tabSelect = document.getElementById("editor-tab-select");
    var option = document.createElement("option");
    option.value = this.tabs.length - 1;
    option.innerHTML = tabName;
    tabSelect.appendChild(option);

    var newTab = new editorTab(content, filename);
    this.tabs.push(newTab);

    // will switch to new tab when the iframe has loaded
  },

  getContent : function() {
    return this.currentTab.getContent();
  },

  setContent : function(content) {
    this.currentTab.setContent(content);
  },

  getFilename : function() {
    return this.currentTab.filename;
  },

  changeFilename : function(filename) {
    this.currentTab.filename = filename;

    var tabSelect = document.getElementById("editor-tab-select");
    var option = tabSelect.getElementsByTagName("option")[this.index];
    option.innerHTML = getFileName(filename);
  }
}


function editorTab(content, filename) {
  var iframeElement = document.createElement("iframe");
  iframeElement.className = "editor-frame";
  var editorObject = this;

  iframeElement.addEventListener("load", function() {
    var win = iframeElement.contentWindow;
    win.onEditorLoad = function() {
      editorObject.editorElement = win.document.getElementById("editor");
      editorObject.editor = win.editor;
      if(content)
        win.editor.setContent(content);
      editor.reloadSize();
      editor.switchTab();
    } // this function is invoked by the iframe
  }, true);
  iframeElement.src = "oldeditor.html";
  document.getElementById("editors").appendChild(iframeElement);

  this.iframeElement = iframeElement;
  this.filename = filename;
}

editorTab.prototype = {
  setContent : function(content) {
    this.editor.setContent(content);
  },

  getContent : function() {
    return this.editor.getContent();
  },

  destroy : function() {
    this.iframeElement.parentNode.removeChild(this.iframeElement);
  }
}
