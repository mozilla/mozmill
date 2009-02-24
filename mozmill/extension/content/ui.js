var showInspectDialog = function(){
  $("#inspectDialog").dialog("open");
  MozMilldx.dxOn();
  $("#inspectDialog").dialog().parents(".ui-dialog:first").find(".ui-dialog-buttonpane button")[2].innerHTML = "Stop";
}

var showFileDialog = function(){
  $("#fileDialog").dialog("open");
}

var showTestDialog = function(){
  $("#testDialog").dialog("open");
}

var showOptionDialog = function(){
  $("#optionDialog").dialog("open");
}

var showRecordDialog = function(){
  $("#recordDialog").dialog("open");
  MozMillrec.on();
  $("#tabs").tabs().tabs("select", 0);
  $("#recordDialog").dialog().parents(".ui-dialog:first").find(".ui-dialog-buttonpane button")[1].innerHTML = "Stop";
}

var align = function(){
  opener.window.resizeTo(window.screen.availWidth/1.8, window.screen.availHeight/1);
  opener.window.screenY = 0;
  opener.window.screenX = 0;
  window.screenX = opener.innerWidth;
  window.screenY = 0;
  return true;
}
