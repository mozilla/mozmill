/*
Copyright 2006-2007, Open Source Applications Foundation

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

//Functions for writing status to the UI
/***************************************/
mozmill.results = new
function() {

    //Writing to the performance tab
    this.writePerformance = function(str) {
      var r = $("perfOut");
      var msg = document.createElement('div');
      msg.style.width = "100%";
      msg.textContent = str;
      r.insertBefore(msg, r.childNodes[0]);
    }

    this.writeStatus = function(str) {
      var s = $("runningStatus");
      s.textContent = 'Status:' + str;
    }

    //Writing to the results tab
    this.writeResult = function(str, color) {
      var r = $("resOut");

      var msg = document.createElement('hbox');
      msg.setAttribute("class", "resultrow");
      if (typeof(color) != 'undefined'){
        msg.style.background = color;
      }
      else{
        msg.style.background = 'lightyellow';
      }
      msg.textContent = str;

      r.insertBefore(msg, r.childNodes[0]);
    }


};