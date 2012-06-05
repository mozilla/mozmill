var drop = function (event) {
  var item = document.getElementById("item1");
  item.parentNode.removeChild(item);
}

var dragStart = function (event) {
  event.dataTransfer.setData("text/test-type", "test data");
}

var dragOver = function (event) {
  event.preventDefault();
}

var dragEnter = function (event) {
  event.preventDefault();
}