gvalue = 0;

function setupModule() {
  controller = mozmill.getBrowserController();
  gvalue = 1; 
}

function setupTest() {
  // if setupTest fails then testOne should be skipped
  assert.fail('Ensure failure to see that testOne is skipped');
}

function testOne() {
  // Will be skipped due to setupTest failure
  gvalue++;
  controller.restartApplication('testTwo');
}

function testTwo() {
  // second test - won't be run because testOne is skipped.
  // adding it as a passing test because this test expects to fail...
  // have to turn your head around on this one.
  assert.pass('testTwo should not be run');
}

function teardownTest() {
  assert.equal(gvalue, 1, 'Only setupModule ran prior to teardownTest so gvalue is 1'); 
  gvalue = 3;
}

function teardownModule() {
  assert.equal(gvalue, 3, 'Ensure no tests ran but teardownTest ran due to fail in setupTest');
}
