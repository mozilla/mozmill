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

mozmill.registry = new function () {
  this.methods  = {};
  this.locator = [];
  this.option  = [];
};

//Setup all the current methods supported
mozmill.registry.locator.push('id','link','xpath','jsid', 'name');
mozmill.registry.option.push('text','url','option','validator','destination','stopOnFailure', 'milliseconds', 'timeout','js', 'status','domain');

//Setup method registry
mozmill.registry.methods['open']                = {'locator': false, 'option': 'url' };
mozmill.registry.methods['waits.sleep']         = {'locator': false, 'option': 'milliseconds' };
mozmill.registry.methods['waits.forElement']    = {'locator': true, 'option': 'timeout' };
mozmill.registry.methods['waits.forNotElement']    = {'locator': true, 'option': 'timeout' };
mozmill.registry.methods['click']               = {'locator': true, 'option': false };
mozmill.registry.methods['doubleClick']         = {'locator': true, 'option': false};
mozmill.registry.methods['mousedown']           = {'locator': true, 'option': false};
mozmill.registry.methods['mouseup']             = {'locator': true, 'option': false};
mozmill.registry.methods['mouseout']            = {'locator': true,'option': false};
mozmill.registry.methods['mouseover']           = {'locator': true,'option': false};
mozmill.registry.methods['type']                = {'locator': true, 'option': 'text'};
mozmill.registry.methods['radio']               = {'locator': true, 'option': false };
mozmill.registry.methods['check']               = {'locator': true, 'option': false };
mozmill.registry.methods['select']              = {'locator': true, 'option': 'option'};
mozmill.registry.methods['goBack']             = {'locator': false, 'option': false };
mozmill.registry.methods['goForward']          = {'locator': false, 'option': false };
mozmill.registry.methods['refresh']            = {'locator': false, 'option': false };
mozmill.registry.methods['setTestWindow']       = {'locator': false, 'option': 'path'};
mozmill.registry.methods['setOptions']         = {'locator': false, 'option':'stopOnFailure'};
mozmill.registry.methods['reWriteAlert']       = {'locator': false, 'option': false };
mozmill.registry.methods['storeURL']           = {'locator': true, 'option': false };
mozmill.registry.methods['setDomain']           = {'locator': false, 'option': 'domain' };
mozmill.registry.methods['complex']            = {'locator': false, 'option': false };
mozmill.registry.methods['asserts.assertJS']    = {'locator': false, 'option': 'js' };
mozmill.registry.methods['asserts.assertProperty'] = {'locator': true, 'option': 'validator' };
mozmill.registry.methods['asserts.assertText']     = {'locator': true, 'option': 'validator' };
mozmill.registry.methods['asserts.assertValue']    = {'locator': true, 'option': 'validator' };
mozmill.registry.methods['asserts.assertChecked']  = {'locator': true, 'option': false };
mozmill.registry.methods['asserts.assertSelected'] = {'locator': true, 'option': 'validator' } ;
mozmill.registry.methods['asserts.assertNode']     = {'locator': true, 'option': false };
mozmill.registry.methods['asserts.assertImageLoaded']  = {'locator': true, 'option': false };