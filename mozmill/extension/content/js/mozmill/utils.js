mozmill.utils = new function() {
  this.checkChrome = function() {
       var loc = window.document.location.href;
       try {
           loc = window.top.document.location.href;
       } catch (e) {}

       if (/^chrome:\/\//.test(loc)) { return true; } 
       else { return false; }
   }
   /*var openFile = function(){
     const nsIFilePicker = Components.interfaces.nsIFilePicker;

     var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
     fp.init(window, "Select a Test Directory", nsIFilePicker.modeGetFolder);

     var rv = fp.show();
     if (rv == Components.interfaces.nsIFilePicker.returnOK){
       // file is the given directory (nsIFile)
       var array = [];
       //iterate directories recursively
       recurseDir = function(ent){
           var entries = ent;
           while(entries.hasMoreElements())
           {
             var entry = entries.getNext();
             entry.QueryInterface(Components.interfaces.nsIFile);
             if ((entry.isDirectory()) && (entry.path.indexOf('.svn') == -1)){
               recurseDir(entry.directoryEntries);
             }
             //push js files onto the array
             if (entry.path.indexOf('.js') != -1){
               array.push(entry.path);
             }
           }
       }
       //build the files array
       recurseDir(fp.file.directoryEntries);
       paramObj = {};
       paramObj.files = array;
       mozmill.controller.commands.jsTests(paramObj);
     }*/
     this.openFile = function(){
       //define the interface
       var nsIFilePicker = Components.interfaces.nsIFilePicker;
       var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
       //define the file picker window
       fp.init(window, "Select a File", nsIFilePicker.modeOpen);
       fp.appendFilter("JavaScript Files","*.js");
       //show the window
       var res = fp.show();
       //if we got a file
       if (res == nsIFilePicker.returnOK){
         var thefile = fp.file;
         //create the paramObj with a files array attrib
         var paramObj = {};
         paramObj.files = [];
         paramObj.files.push(thefile.path);

         //Move focus to output tab
         $('mmtabs').setAttribute("selectedIndex", 2);
         //send it into the JS test framework to run the file
         mozmill.controller.commands.jsTests(paramObj);
       }
     };
     
     //Function to start the running of jsTests
     this.jsTests = function (paramObj) {
         //Setup needed variables
         mozmill.jsTest.actions.loadActions();
         var wm = mozmill.jsTest.actions;
         var testFiles = paramObj.files;
         if (!testFiles.length) {
           throw new Error('No JavaScript tests to run.');
         }
         var _j = mozmill.jsTest;
         //mozmill.controller.stopLoop();

         //Timing the suite
         var jsSuiteSummary = new TimeObj();
         jsSuiteSummary.setName('jsSummary');
         jsSuiteSummary.startTime();
         _j.jsSuiteSummary = jsSuiteSummary;

         _j.run(paramObj);
     };

     //Commands function to hande the test results of the js tests
     this.jsTestResults = function () {
       var _j = mozmill.jsTest;
       var jsSuiteSummary = _j.jsSuiteSummary;
       var s = '';
       s += 'Number of tests run: ' + _j.testCount + '\n';
       s += '\nNumber of tests failures: ' + _j.testFailureCount;
       if (_j.testFailureCount > 0) {
         s += 'Test failures:<br/>';
         var fails = _j.testFailures;
         for (var i = 0; i < fails.length; i++) {
           var fail = fails[i];
           var msg = fail.message;
           // Escape angle brackets for display in HTML
           msg = msg.replace(/</g, '&lt;');
           msg = msg.replace(/>/g, '&gt;');
           s += msg + '<br/>';
         }
       };

       jsSuiteSummary.endTime();
       var result = !(_j.testFailureCount > 0);

       if (result){
          mozmill.ui.results.writeResult(s, 'lightgreen');
        }
        else{
          mozmill.ui.results.writeResult(s, 'lightred');
        }
       //mozmill.ui.results.writeResult(s);
       //We want the summary to have a concept of success/failure
       var result = !(_j.testFailureCount > 0);
       var method = 'JS Test Suite Completion';
       //mozmill.jsTest.sendJSReport(method, result, null, jsSuiteSummary);
       // Fire the polling loop back up
       //mozmill.controller.continueLoop();

     }; 
};