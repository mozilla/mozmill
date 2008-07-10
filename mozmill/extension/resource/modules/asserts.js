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

var EXPORTED_SYMBOLS = ["assertRegistry", "assertTrue", 'assertFalse', 'assertEquals',
                        'assertNotEquals', 'assertNull', 'assertNotNull', 'assertUndefined',
                        'assertNotUndefined', 'assertNaN', 'assertNotNaN', 'assertEvaluatesToTrue',
                        'assertEvaluatesToFalse', 'assertContains'];

assertRegistry = {
  'assertTrue': {
  expr: function (a) {
      if (typeof a != 'boolean') {
        throw('Bad argument to assertTrue.');
      }
      return a === true;
    },
  errMsg: 'expected true but was false.'
  },

  'assertFalse': {
  expr: function (a) {
      if (typeof a != 'boolean') {
        throw('Bad argument to assertFalse.');
      }
      return a === false;
    },
  errMsg: 'expected false but was true.'
  },

  'assertEquals': {
  expr: function (a, b) { return a === b; },
  errMsg: 'expected $1 but was $2.'
  },

  'assertNotEquals': {
  expr: function (a, b) { return a !== b; },
  errMsg: 'expected one of the two values not to be $1.'
  },

  'assertNull': {
  expr: function (a) { return a === null; },
  errMsg: 'expected to be null but was $1.'
  },

  'assertNotNull': {
  expr: function (a) { return a !== null; },
  errMsg: 'expected not to be null but was null.'
  },

  'assertUndefined': {
  expr: function (a) { return typeof a == 'undefined'; },
  errMsg: 'expected to be undefined but was $1.'
  },

  'assertNotUndefined': {
  expr: function (a) { return typeof a != 'undefined'; },
  errMsg: 'expected not to be undefined but was undefined.'
  },

  'assertNaN': {
  expr: function (a) { return typeof a == 'undefined'; },
  errMsg: 'expected to be undefined but was $1.'
  },

  'assertNotNaN': {
  expr: function (a) { return typeof a != 'undefined'; },
  errMsg: 'expected not to be undefined but was undefined.'
  },

  'assertEvaluatesToTrue': {
  expr: function (a) { return !!a; },
  errMsg: 'value of $1 does not evaluate to true.'
  },

  'assertEvaluatesToFalse': {
  expr: function (a) { return !a; },
  errMsg: 'value of $1 does not evaluate to false.'
  },

  'assertContains': {
  expr: function (a, b) {
      if (typeof a != 'string' || typeof b != 'string') {
        throw('Bad argument to assertContains.');
      }
      return (a.indexOf(b) > -1);
    },
  errMsg: 'value of $1 does not contain $2.'
  }
};

//Currently only does one level below the provided div
//To make it more thorough it needs recursion to be implemented later


_AssertFactory = new function () {
  var _this = this;
  function validateArgs(count, args) {
    if (!(args.length == count ||
	  (args.length == count + 1 && typeof(args[0]) == 'string') )) {
      throw('Incorrect arguments passed to assert function');
    }
  }
  function createErrMsg(msg, arr) {
    var str = msg;
    for (var i = 0; i < arr.length; i++) {
      var val = arr[i];
      var display = '<' + val.toString().replace(/\n/g, '') +
        '> (' + getTypeDetails(val) + ')';
      str = str.replace('$' + (i + 1).toString(), display);
    }
    return str;
  }
  function getTypeDetails(val) {
    var r = typeof val;
    try {
      if (r == 'object' || r == 'function') {
        var m = val.constructor.toString().match(/function\s*([^( ]+)\(/);
						 if (m) { r = m[1]; }
						 else { r = 'Unknown Data Type' }
						 }
      }
      finally {
        r = r.substr(0, 1).toUpperCase() + r.substr(1);
        return r;
      }
    }
    this.createAssert = function (meth) {
      return function () {
      var args = Array.prototype.slice.call(arguments);
      args.unshift(meth);
      return _this.doAssert.apply(_this, args);
      }
    }
    this.doAssert = function () {
      // Convert arguments to real Array
      var args = Array.prototype.slice.call(arguments);
      // The actual assert method, e.g, 'equals'
      var meth = args.shift();
      // The assert object
      var asrt = assertRegistry[meth];
      // The assert expresion
      var expr = asrt.expr;
      // Validate the args passed
      var valid = validateArgs(expr.length, args);
      // Pull off additional comment which may be first arg
      var comment = args.length > expr.length ?
        args.shift() : null;
      // Run the assert
      var res = expr.apply(window, args);
      if (res) {
	      return true;
      }
      else {
	      var message = meth + ' -- ' +
        createErrMsg(asrt.errMsg, args);
	      throw new _MozMillAssertException(comment, message);
      }
    };
  };

// Create all the assert methods on mozmill.MozMillController.asserts.prototype
// Using the items in the assertRegistry

for (var meth in assertRegistry) {
  eval(meth+' = _AssertFactory.createAssert(meth);');
  eval(meth+'.jsUnitAssert = true;');
}

_MozMillAssertException = function (comment, message) {
  this.comment = comment;
  this.message = message;
};

