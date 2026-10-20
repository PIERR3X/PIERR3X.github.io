(function () {
  "use strict";
  // Image lightbox for figures
  var box = document.getElementById("lightbox");
  if (!box) return;
  var img = box.querySelector("img"), cap = box.querySelector(".lb-cap"), closeBtn = box.querySelector(".lb-close");
  var last = null;
  function open(src, alt, caption, from) {
    last = from; img.src = src; img.alt = alt || ""; cap.textContent = caption || "";
    box.hidden = false; document.body.style.overflow = "hidden"; closeBtn.focus();
  }
  function close() {
    box.hidden = true; img.removeAttribute("src"); document.body.style.overflow = "";
    if (last) last.focus();
  }
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (t.matches && t.matches(".gallery img")) {
      var fc = t.parentNode.querySelector("figcaption");
      open(t.currentSrc || t.src, t.alt, fc ? fc.textContent : "", t);
    } else if (t === box || t === closeBtn) { close(); }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !box.hidden) close(); });
  // Make gallery images reachable with the keyboard
  Array.prototype.forEach.call(document.querySelectorAll(".gallery img"), function (i) {
    i.tabIndex = 0; i.setAttribute("role", "button");
    i.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); i.click(); } });
  });
})();
