var jum = {}; Components.utils.import('resource://mozmill/modules/jum.js', jum);
var mozmill = {}; Components.utils.import('resource://mozmill/modules/mozmill.js', mozmill);


var testAsserts = function() {
  jum.assert(true);
  jum.assertTrue(true);
  jum.assertFalse(false);
  jum.assertEquals('asdf', 'asdf');
  jum.assertEquals(['a', 'k', 9, 25], ['a', 'k', 9, 25]);
  jum.assertNotEquals('asdf', 'fdsa');
  jum.assertNull(null);
  jum.assertNotNull(true);
  jum.assertUndefined({}.asdf);
  jum.assertNotUndefined('asdf');
  jum.assertNaN('a');
  jum.assertNotNaN(4);
  jum.assertArrayContains(['a', 'k', 9, 25], 'a');
  jum.assertArrayContains(['a', 'k', 9, 25], 9);
  jum.pass();
}
testAsserts.meta = {'litmusids':[2345678]}

var testNothing = {};

var testNotAsserts = function() {
  // All of these calls should fail
  jum.assert(false);
  jum.assertTrue(false);
  jum.assertTrue('asf');
  jum.assertFalse(true);
  jum.assertFalse('asdf');
  jum.assertEquals('asdf', 'fdsa');
  jum.assertEquals(['a', 'k', 9, 25], ['a', 'k', 9]);
  jum.assertEquals(['a', 'k', 9, new Object()], ['a', 'k', 9, new Object()]);
  jum.assertEquals(['a', 'k', 9, new Object()], new Object());
  jum.assertEquals([1], 1);
  jum.assertEquals([1], ['1']);
  jum.assertNotEquals('asdf', 'asdf');
  jum.assertNull(true);
  jum.assertNotNull(null);
  jum.assertUndefined('asdf');
  jum.assertNotUndefined({}.asdf);
  jum.assertNaN(4);
  jum.assertNotNaN('f');
  jum.assertArrayContains(['a', 'k', 9], 25);
  jum.assertArrayContains(['a', 'k', 9, new Object()], 25);
  jum.assertArrayContains(['a', 'k', 9, new Object()], new Object());
  jum.fail();
}