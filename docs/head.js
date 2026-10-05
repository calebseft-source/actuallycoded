/* Runs before first paint. Marks the page as motion capable so the
   stylesheet can hide the reveal targets until the page script shows
   them. If that script never reports in, the mark is removed and the
   page reads as plain HTML. */
(function () {
  "use strict";
  var root = document.documentElement;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  root.classList.add("motion");
  window.setTimeout(function () {
    if (!root.classList.contains("motion-ready")) root.classList.remove("motion");
  }, 3000);
})();
