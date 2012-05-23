gvalue = 0;

function setupModule() {
  // initialisation code that will only run once
  // for example: setting the addons discovery pane URL to a local resource
  controller = mozmill.getBrowserController();
  gvalue = 1; 
}

function setupTest() {
  // initialisation code that will run for every test
  // for example: initialising the controller or closing all tabs
  //controller = mozmill.getBrowserController();
  gvalue++;
}

function testOne() {
  // first test
  assert.equal(gvalue, 2, 'Ensure setupModule and setupTest ran before testOne');
  controller.restartApplication('testTwo');
}

function testTwo() {
  // second test
  // this time setupModule is not run but setupTest is, so gvalue is 1.
  assert.equal(gvalue, 1, 'Ensure only setupTest ran before testTwo');
}

function teardownTest() {
  // teardown code that will run for every test
  gvalue--;
}

function teardownModule() {
  // teardown code that will only run once, at the very end
  // for example: clearing user defined preferences
  // Because it is only run after testTwo and teardowntest, gvalue is 0
  assert.equal(gvalue, 0, 'Ensure that testTwo and teardownTest ran before teardownModule');
}
