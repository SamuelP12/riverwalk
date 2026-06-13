// v3 — satellite + 3D-terrain flythrough of the Riverwalk route, as a section (MapLibre GL, no key)
(function () {
  "use strict";
  var el = document.getElementById("routeMap");
  if (!el || typeof maplibregl === "undefined") { if (el) el.classList.add("no-map"); return; }
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // route, north -> east [lng, lat] (approximate, hand-traced from the satellite shots)
  var ROUTE = [
    [-120.18460, 48.47842], [-120.18548, 48.47695], [-120.18602, 48.47548], [-120.18505, 48.47445],
    [-120.18378, 48.47435], [-120.18150, 48.47455], [-120.17900, 48.47492], [-120.17600, 48.47545],
    [-120.17300, 48.47585], [-120.17120, 48.47602]
  ];

  var map;
  try {
    map = new maplibregl.Map({
      container: el, interactive: false, attributionControl: true,
      center: ROUTE[0], zoom: 15.6, pitch: 72, bearing: 35, maxPitch: 85,
      style: {
        version: 8,
        sources: {
          sat: { type: "raster", tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"], tileSize: 256, maxzoom: 19, attribution: "Imagery © Esri, Maxar, Earthstar Geographics" },
          dem: { type: "raster-dem", tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"], tileSize: 256, maxzoom: 15, encoding: "terrarium" }
        },
        layers: [{ id: "sat", type: "raster", source: "sat" }]
      }
    });
  } catch (e) { el.classList.add("no-map"); return; }

  map.on("error", function () {});
  map.on("load", function () {
    try { map.setTerrain({ source: "dem", exaggeration: 2.4 }); } catch (e) {}
    try { map.setSky({ "sky-color": "#bcd6e6", "horizon-color": "#e7ddc6", "fog-color": "#e8eadf", "sky-horizon-blend": 0.7, "horizon-fog-blend": 0.6, "fog-ground-blend": 0.35 }); } catch (e) {}
    map.addSource("route", { type: "geojson", data: { type: "Feature", geometry: { type: "LineString", coordinates: ROUTE } } });
    map.addLayer({ id: "route-casing", type: "line", source: "route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#2e2410", "line-width": 9, "line-opacity": 0.55 } });
    map.addLayer({ id: "route-line", type: "line", source: "route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#e0a24a", "line-width": 4.5 } });
    fly();
  });

  function seg(a, b) { var dx = (b[0] - a[0]) * Math.cos((a[1] + b[1]) * Math.PI / 360), dy = b[1] - a[1]; return Math.sqrt(dx * dx + dy * dy); }
  var cum = [0], i; for (i = 1; i < ROUTE.length; i++) cum[i] = cum[i - 1] + seg(ROUTE[i - 1], ROUTE[i]);
  var total = cum[cum.length - 1];
  function at(d) {
    if (d <= 0) return ROUTE[0].slice(); if (d >= total) return ROUTE[ROUTE.length - 1].slice();
    var k = 1; while (cum[k] < d) k++; var t = (d - cum[k - 1]) / (cum[k] - cum[k - 1]);
    return [ROUTE[k - 1][0] + (ROUTE[k][0] - ROUTE[k - 1][0]) * t, ROUTE[k - 1][1] + (ROUTE[k][1] - ROUTE[k - 1][1]) * t];
  }
  function bearing(a, b) {
    var y = Math.sin((b[0] - a[0]) * Math.PI / 180) * Math.cos(b[1] * Math.PI / 180);
    var x = Math.cos(a[1] * Math.PI / 180) * Math.sin(b[1] * Math.PI / 180) - Math.sin(a[1] * Math.PI / 180) * Math.cos(b[1] * Math.PI / 180) * Math.cos((b[0] - a[0]) * Math.PI / 180);
    return Math.atan2(y, x) * 180 / Math.PI;
  }
  function fly() {
    if (reduce) { var c = at(total * 0.5), a2 = at(total * 0.5 + total * 0.02); map.jumpTo({ center: c, bearing: bearing(c, a2), pitch: 68, zoom: 15.5 }); return; }
    var DUR = 60000, raf = null, t0 = null;
    function frame(ts) {
      if (t0 === null) t0 = ts;
      var p = ((ts - t0) % DUR) / DUR, s = (1 - Math.cos(p * 2 * Math.PI)) / 2, dir = Math.sin(p * 2 * Math.PI) >= 0 ? 1 : -1;
      var d = s * total, c = at(d), ahead = at(Math.max(0, Math.min(total, d + dir * total * 0.03)));
      map.jumpTo({ center: c, bearing: bearing(c, ahead), pitch: 73, zoom: 16.1 });
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { if (!raf) { t0 = null; raf = requestAnimationFrame(frame); } }
      else if (raf) { cancelAnimationFrame(raf); raf = null; }
    }, { threshold: 0.05 }).observe(el);
  }
})();
