var editor = {
  index : 0,

  tabs : [],

  currentTab : null,

  tempCount : 0,

  resize : function(width, height) {
    if(width)
      this.width = width;
    if(height)
      this.height = height;

    if(this.currentTab) {
      this.currentTab.editorElement.style.width = this.width + "px";
      this.currentTab.editorElement.style.height = this.height + "px";
      this.currentTab.editorEnv.dimensionsChanged();
    }
  },

  switchTab : function(index) {
    if(index == undefined)
      index = this.tabs.length - 1;
    if(index < 0)
      return;

    var tabSelect = document.getElementById("editor-tab-select");
    tabSelect.selectedIndex = index;

    if(this.currentTab)
      this.currentTab.editorElement.style.display = "none";
    this.index = index;
    this.currentTab = this.tabs[index];
    this.resize();
    this.currentTab.editorElement.style.display = "block";
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
 
    // will switch to tab when it has loaded
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
  var bespinElement = document.createElement("div");
  bespinElement.id = "editor-" + Math.random();
  bespinElement.className = "bespin";
  document.getElementById("editors").appendChild(bespinElement);

  var editorObject = this;

  bespin.useBespin(bespinElement, {
    settings: {"tabstop": 4},
    syntax: "js", 
    stealFocus: true})
  .then(function(env) {
    editorObject.editorEnv = env;
    editorObject.editor = env.editor;
    if(content)
      env.editor.value = content;
    editor.switchTab();
    env.settings.set("fontsize", 13);
  });

  this.editorElement = bespinElement;
  this.filename = filename;
}

editorTab.prototype = {
  setContent : function(content) {
    this.editor.value = content;
  },

  getContent : function() {
    return this.editor.value;
  },

  destroy : function() {
    this.editorElement.parentNode.removeChild(this.editorElement);
  }
}
