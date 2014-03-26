/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

function drop(event) {
  var item = document.getElementById("item1");
  item.parentNode.removeChild(item);
}

function dragStart(event) {
  event.dataTransfer.setData("text/test-type", "test data");
}

function dragOver(event) {
  event.preventDefault();
}

function dragEnter(event) {
  event.preventDefault();
}
