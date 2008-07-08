// ***** BEGIN LICENSE BLOCK *****
// Version: MPL 1.1/GPL 2.0/LGPL 2.1
// 
// The contents of this file are subject to the Mozilla Public License Version
// 1.1 (the "License"); you may not use this file except in compliance with
// the License. You may obtain a copy of the License at
// http://www.mozilla.org/MPL/
// 
// Software distributed under the License is distributed on an "AS IS" basis,
// WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
// for the specific language governing rights and limitations under the
// License.
// 
// The Original Code is Mozilla Corporation Code.
// 
// The Initial Developer of the Original Code is
// Adam Christian.
// Portions created by the Initial Developer are Copyright (C) 2008
// the Initial Developer. All Rights Reserved.
// 
// Contributor(s):
//  Adam Christian <adam.christian@gmail.com>
//  Mikeal Rogers <mikeal.rogers@gmail.com>
// 
// Alternatively, the contents of this file may be used under the terms of
// either the GNU General Public License Version 2 or later (the "GPL"), or
// the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
// in which case the provisions of the GPL or the LGPL are applicable instead
// of those above. If you wish to allow use of your version of this file only
// under the terms of either the GPL or the LGPL, and not to allow others to
// use your version of this file under the terms of the MPL, indicate your
// decision by deleting the provisions above and replace them with the notice
// and other provisions required by the GPL or the LGPL. If you do not delete
// the provisions above, a recipient may use your version of this file under
// the terms of any one of the MPL, the GPL or the LGPL.
// 
// ***** END LICENSE BLOCK *****

var EXPORTED_SYMBOLS = [""];

mozmill.TimeObj = function() {

    var timeStarted = '0:0:0:0';
    var timeEnded = '0:0:0:0';
    var startMS = 0;
    var endMS = 0;
    var runTime = '';
    var identifier = '';


    this.getStart = function() {
        return timeStarted;

    }

    this.getEnd = function() {
        return timeEnded;

    }

    //Set the identifier 
    this.setName = function(identifier) {
        this.identifier = identifier;

    }

    //Calculate how long it took
    this.calculateTime = function() {
        runTime = endMS - startMS;

    }

    //Used for users who want to log the time and MS so they can compute how long a test took to run
    this.startTime = function() {

        var d = new Date();
        startMS = d.getTime();
        timeStarted = d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate() + 'T' + d.getHours()
        + ':' + d.getMinutes() + ':' + d.getSeconds() + '.' + d.getMilliseconds() + 'Z';

    }

    //Storing end time used for performance computation
    this.endTime = function(identifier) {

        var d = new Date();
        endMS = d.getTime();
        timeEnded = d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate() + 'T' + d.getHours() + ':'
        + d.getMinutes() + ':' + d.getSeconds() + '.' + d.getMilliseconds() + 'Z';

    }

    //Write to the log div
    this.write = function(parameters) {
        this.calculateTime();
        var perf_tab = mozmill.remote.$("perfOut");

        perf_tab.innerHTML = "<br>Total: " + this.identifier + " : " + runTime + " ms<br>" + perf_tab.innerHTML;
        perf_tab.innerHTML = "<br>Ending: " + this.identifier + " : " + timeEnded + perf_tab.innerHTML;
        perf_tab.innerHTML = "<br>Starting: " + this.identifier + " : " + timeStarted + perf_tab.innerHTML;

        //perf_tab.scrollTop = perf_tab.scrollHeight;
        if (!parameters) {
            perf_tab.innerHTML = "<br>Executing: " + this.identifier + perf_tab.innerHTML;

        }
        else {
            perf_tab.innerHTML = "<br>Executing: " + this.identifier + " - Parameters: " + parameters + perf_tab.innerHTML;

        }


    }


};

var TimeObj = mozmill.TimeObj;