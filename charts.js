/* Small SVG charts built from the numbers in the project reports.
   Colours come from CSS variables, so they follow light and dark mode. */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";

  var DATA = {
    failure: {
      angles: [0, 15, 30, 45, 60, 75, 90],
      series: [
        { name: "Maximum stress theory", values: [6972.30, 1359.15, 728.75, 423.15, 282.11, 226.76, 211.71], color: "var(--chart-a)", dash: "" },
        { name: "Tsai-Wu", values: [6972.51, 1244.27, 555.93, 351.03, 262.67, 223.12, 211.71], color: "var(--chart-b)", dash: "7 4" }
      ]
    },
    blanking: {
      // mean of left and right radiator V/V0 (%), wind tunnel runs
      rows: [
        { label: "Baseline (run 756)", value: 12.465 },
        { label: "20% bottom (757)", value: 10.715 },
        { label: "35% bottom (758)", value: 8.755 },
        { label: "35% external (762)", value: 11.07 },
        { label: "35% external + 15 mm tape (764)", value: 9.485, final: true },
        { label: "35% external + 30 mm tape (763)", value: 7.455 }
      ],
      target: 12.465 - 3.0
    }
  };

  function el(name, attrs, text) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) if (attrs.hasOwnProperty(k)) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }
  function fmt(v, d) { return Number(v).toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d }); }

  function tooltip(box) {
    var t = document.createElement("div"); t.className = "chart-tip"; t.setAttribute("role", "status"); box.appendChild(t);
    return {
      show: function (x, y, html) { t.innerHTML = html; t.style.left = x + "px"; t.style.top = y + "px"; t.classList.add("on"); },
      hide: function () { t.classList.remove("on"); }
    };
  }

  /* Line chart, log y ---------------------------------------------------- */
  function lineChart(box) {
    var d = DATA.failure;
    box.innerHTML = "";
    var w = Math.max(300, box.clientWidth - 8), h = Math.round(Math.min(380, Math.max(280, w * 0.5)));
    var m = { l: 58, r: 18, t: 16, b: 44 }, pw = w - m.l - m.r, ph = h - m.t - m.b;
    var ymin = 100, ymax = 10000;
    function X(a) { return m.l + a / 90 * pw; }
    function Y(v) { return m.t + ph - (Math.log10(v) - Math.log10(ymin)) / (Math.log10(ymax) - Math.log10(ymin)) * ph; }
    var svg = el("svg", { viewBox: "0 0 " + w + " " + h, role: "img", "aria-label": "Line chart of failure load against ply angle for two failure criteria" });
    [100, 1000, 10000].forEach(function (v) {
      svg.appendChild(el("line", { x1: m.l, x2: m.l + pw, y1: Y(v), y2: Y(v), "class": "grid" }));
      svg.appendChild(el("text", { x: m.l - 8, y: Y(v) + 4, "text-anchor": "end", "class": "tick" }, v.toLocaleString("en-GB")));
    });
    [200, 300, 500, 2000, 3000, 5000].forEach(function (v) { svg.appendChild(el("line", { x1: m.l, x2: m.l + pw, y1: Y(v), y2: Y(v), "class": "grid", opacity: ".45" })); });
    svg.appendChild(el("line", { x1: m.l, x2: m.l + pw, y1: Y(ymin), y2: Y(ymin), "class": "axis" }));
    d.angles.forEach(function (a) {
      svg.appendChild(el("text", { x: X(a), y: m.t + ph + 18, "text-anchor": "middle", "class": "tick" }, a + "°"));
    });
    svg.appendChild(el("text", { x: m.l + pw / 2, y: h - 6, "text-anchor": "middle" }, "Ply angle"));
    var yl = el("text", { x: 0, y: 0, "text-anchor": "middle", transform: "translate(13," + (m.t + ph / 2) + ") rotate(-90)" }, "Failure load per unit width (N/mm)");
    svg.appendChild(yl);

    d.series.forEach(function (s, si) {
      var pts = s.values.map(function (v, i) { return X(d.angles[i]) + "," + Y(v); }).join(" ");
      svg.appendChild(el("polyline", { points: pts, fill: "none", style: "stroke:" + s.color, "stroke-width": 2.5, "stroke-dasharray": s.dash, "stroke-linejoin": "round" }));
      s.values.forEach(function (v, i) {
        svg.appendChild(el("circle", { cx: X(d.angles[i]), cy: Y(v), r: 4.5, style: "fill:" + s.color + ";stroke:var(--sheet);stroke-width:2" }));
      });
    });
    // direct labels beside the curves, where they do not collide
    svg.appendChild(el("text", { x: X(30) + 12, y: Y(728.75) - 10, "class": "lbl-a" }, "Maximum stress"));
    svg.appendChild(el("text", { x: X(30) - 12, y: Y(555.93) + 24, "text-anchor": "end", "class": "lbl-a" }, "Tsai-Wu"));

    // hover layer
    var cross = el("line", { y1: m.t, y2: m.t + ph, style: "stroke:var(--ink-2)", "stroke-width": 1, opacity: 0 });
    svg.appendChild(cross);
    var hit = el("rect", { x: m.l, y: m.t, width: pw, height: ph, fill: "transparent" });
    svg.appendChild(hit);
    box.appendChild(svg);
    var tip = tooltip(box);
    function move(ev) {
      var r = svg.getBoundingClientRect(), k = w / r.width, px = (ev.clientX - r.left) * k;
      var best = 0, bd = 1e9;
      d.angles.forEach(function (a, i) { var dd = Math.abs(X(a) - px); if (dd < bd) { bd = dd; best = i; } });
      var x = X(d.angles[best]);
      cross.setAttribute("x1", x); cross.setAttribute("x2", x); cross.setAttribute("opacity", 1);
      var html = "<b>" + d.angles[best] + "°</b>" + d.series.map(function (s) { return s.name + ": " + fmt(s.values[best], 0) + " N/mm"; }).join("<br>");
      var bx = box.getBoundingClientRect();
      tip.show(r.left - bx.left + x / k, r.top - bx.top + Y(d.series[0].values[best]) / k, html);
    }
    hit.addEventListener("pointermove", move);
    hit.addEventListener("pointerleave", function () { cross.setAttribute("opacity", 0); tip.hide(); });

    var legend = document.createElement("div"); legend.className = "legend";
    d.series.forEach(function (s) {
      var i = document.createElement("span");
      i.innerHTML = '<i style="background:' + s.color + '"></i>' + s.name;
      legend.appendChild(i);
    });
    box.appendChild(legend);
    box.appendChild(tableView(["Ply angle", d.series[0].name + " (N/mm)", d.series[1].name + " (N/mm)"],
      d.angles.map(function (a, i) { return [a + "°", fmt(d.series[0].values[i], 1), fmt(d.series[1].values[i], 1)]; })));
  }

  /* Horizontal bars ------------------------------------------------------ */
  function barChart(box) {
    var d = DATA.blanking;
    box.innerHTML = "";
    var w = Math.max(300, box.clientWidth - 8);
    var rowH = 46, m = { l: 14, r: 56, t: 30, b: 34 };
    var h = m.t + m.b + rowH * d.rows.length, pw = w - m.l - m.r;
    var vmax = 14;
    function X(v) { return m.l + v / vmax * pw; }
    var svg = el("svg", { viewBox: "0 0 " + w + " " + h, role: "img", "aria-label": "Bar chart of radiator flow ratio for each blanking configuration" });
    [0, 4, 8, 12].forEach(function (v) {
      svg.appendChild(el("line", { x1: X(v), x2: X(v), y1: m.t - 6, y2: h - m.b, "class": "grid" }));
      svg.appendChild(el("text", { x: X(v), y: h - m.b + 18, "text-anchor": "middle", "class": "tick" }, v + "%"));
    });
    var bars = [];
    d.rows.forEach(function (r, i) {
      var y = m.t + i * rowH;
      svg.appendChild(el("text", { x: m.l, y: y + 12, "class": r.final ? "lbl-a" : "" }, r.label));
      var bar = el("rect", { x: X(0), y: y + 18, width: X(r.value) - X(0), height: 14, rx: 3, style: "fill:" + (r.final ? "var(--chart-a)" : "var(--muted)"), opacity: r.final ? 1 : 0.55 });
      svg.appendChild(bar); bars.push(bar);
      svg.appendChild(el("text", { x: X(r.value) + 8, y: y + 30, "class": r.final ? "lbl-a" : "" }, fmt(r.value, 2) + "%"));
    });
    var tx = X(d.target);
    svg.appendChild(el("line", { x1: tx, x2: tx, y1: m.t - 6, y2: h - m.b, style: "stroke:var(--chart-b)", "stroke-width": 2, "stroke-dasharray": "6 4" }));
    svg.appendChild(el("text", { x: tx + 6, y: m.t - 12, style: "fill:var(--ink)", "class": "lbl-a" }, "Target " + fmt(d.target, 2) + "%"));
    svg.appendChild(el("text", { x: m.l + pw / 2, y: h - 4, "text-anchor": "middle" }, "Radiator flow ratio V/V0"));
    box.appendChild(svg);
    var tip = tooltip(box);
    bars.forEach(function (b, i) {
      var r = d.rows[i];
      var hit = el("rect", { x: 0, y: m.t + i * rowH, width: w, height: rowH, fill: "transparent" });
      svg.appendChild(hit);
      hit.addEventListener("pointermove", function (ev) {
        var s = svg.getBoundingClientRect(), bx = box.getBoundingClientRect();
        tip.show(ev.clientX - bx.left, s.top - bx.top + (m.t + i * rowH + 16) * (s.width / w),
          "<b>" + r.label + "</b>V/V0 " + fmt(r.value, 2) + "%<br>Change vs baseline " + fmt(r.value - d.rows[0].value, 2) + " points");
      });
      hit.addEventListener("pointerleave", tip.hide);
    });
    box.appendChild(tableView(["Configuration", "V/V0 (%)", "Change vs baseline (points)"],
      d.rows.map(function (r) { return [r.label, fmt(r.value, 2), fmt(r.value - d.rows[0].value, 2)]; })));
  }

  function tableView(head, rows) {
    var det = document.createElement("details"); det.className = "chart-table";
    var sum = document.createElement("summary"); sum.textContent = "View as table"; det.appendChild(sum);
    var t = document.createElement("table"); t.className = "data";
    t.innerHTML = "<thead><tr>" + head.map(function (x, i) { return "<th" + (i ? ' class="num"' : "") + ">" + x + "</th>"; }).join("") + "</tr></thead><tbody>" +
      rows.map(function (r) { return "<tr>" + r.map(function (x, i) { return "<td" + (i ? ' class="num"' : "") + ">" + x + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody>";
    det.appendChild(t); return det;
  }

  var BUILD = { failure: lineChart, blanking: barChart };
  function renderAll() {
    var figs = document.querySelectorAll("figure.chart[data-chart]");
    Array.prototype.forEach.call(figs, function (f) {
      var box = f.querySelector(".chart-box"), fn = BUILD[f.getAttribute("data-chart")];
      if (box && fn) fn(box);
    });
  }
  var timer;
  function schedule() { clearTimeout(timer); timer = setTimeout(renderAll, 120); }
  renderAll();
  window.addEventListener("resize", function () {
    var figs = document.querySelectorAll(".chart-box svg");
    var changed = false;
    Array.prototype.forEach.call(figs, function (s) { var b = s.parentNode; if (Math.abs((b.clientWidth - 8) - parseFloat(s.getAttribute("viewBox").split(" ")[2])) > 4) changed = true; });
    if (changed) schedule();
  });
})();
