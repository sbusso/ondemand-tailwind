console.log(document.documentElement.outerHTML);
document.currentScript =
  document.currentScript ||
  (function () {
    var scripts = document.getElementsByTagName("script");
    return scripts[scripts.length - 1];
  })();

var scripts = document.getElementsByTagName("script");
var lastScript = scripts[scripts.length - 1];
var scriptName = lastScript;
let siteId = scriptName.getAttribute("data-site");

fetch(`http://127.0.0.1:3111/css/${siteId}.css`, {
  method: "POST",
  headers: {
    "Content-Type": "text/plain",
  },
  body: document.documentElement.outerHTML,
})
  .then(function (response) {
    return response.text();
  })
  .then(function (text) {
    var style = document.createElement("style");
    style.type = "text/css";
    style.innerHTML = text;
    document.head.appendChild(style);
  });
