/* Hand-painted-style holly & berry frame, drawn into an <svg>.
   drawWreath(svg, width, height, options)
   Deterministic: the same seed always draws the same wreath. */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const HOLLY = "M0 0 Q3 -7 10 -10 Q16 -6 22 -14 Q28.5 -8 35 -14 Q41 -7.5 47 -11 Q53 -3 60 0 Q53 3 47 11 Q41 7.5 35 14 Q28.5 8 22 14 Q16 6 10 10 Q3 7 0 0 Z";
  const HOLLY_LOW = "M0 0 L60 0 Q53 3 47 11 Q41 7.5 35 14 Q28.5 8 22 14 Q16 6 10 10 Q3 7 0 0 Z";
  const OVAL = "M0 0 C14 -11 40 -12 60 0 C40 12 14 11 0 0 Z";
  const OVAL_LOW = "M0 0 L60 0 C40 12 14 11 0 0 Z";
  const GREENS = [["#2f4a33", "#5d7d55"], ["#3a5a3c", "#6f8f62"], ["#2c4430", "#4f6e4a"], ["#41603f", "#7a9a6b"]];

  function drawWreath(svg, W, H, o) {
    o = o || {};
    const inset = o.inset ?? 40, r = o.radius ?? 50, step = o.step ?? 18, animate = !!o.animate;
    const reach = o.reach ?? 1;           // scales leaf length
    let s = o.seed ?? 7;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const mk = (tag, attrs, parent) => {
      const e = document.createElementNS(NS, tag);
      for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(e);
      return e;
    };
    const grow = delay => animate ? { class: "w-grow", style: "animation-delay:" + delay.toFixed(2) + "s" } : {};

    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    const defs = mk("defs", {}, svg);
    GREENS.forEach(([a, b], i) => {
      const g = mk("linearGradient", { id: "wl" + i, x1: "0", x2: "1", y1: "0", y2: "0" }, defs);
      mk("stop", { offset: "0", "stop-color": a }, g);
      mk("stop", { offset: "1", "stop-color": b }, g);
    });
    const rg = mk("radialGradient", { id: "wb", cx: ".35", cy: ".35", r: ".75" }, defs);
    mk("stop", { offset: "0", "stop-color": "#e0574a" }, rg);
    mk("stop", { offset: "1", "stop-color": "#9b2622" }, rg);
    const f = mk("filter", { id: "wpaint", x: "-5%", y: "-5%", width: "110%", height: "110%" }, defs);
    mk("feTurbulence", { type: "fractalNoise", baseFrequency: ".035", numOctaves: "2", seed: "3", result: "n" }, f);
    mk("feDisplacementMap", { in: "SourceGraphic", in2: "n", scale: "2.2" }, f);

    /* perimeter of a rounded rectangle, clockwise from the top-left */
    const x0 = inset, y0 = inset, x1 = W - inset, y1 = H - inset;
    const a = x1 - x0 - 2 * r, b = y1 - y0 - 2 * r, q = Math.PI * r / 2, PI = Math.PI;
    const segs = [
      { len: a, at: t => [x0 + r + t, y0, 0] },
      { len: q, at: t => { const th = -PI / 2 + t / r; return [x1 - r + r * Math.cos(th), y0 + r + r * Math.sin(th), th + PI / 2]; } },
      { len: b, at: t => [x1, y0 + r + t, PI / 2] },
      { len: q, at: t => { const th = t / r; return [x1 - r + r * Math.cos(th), y1 - r + r * Math.sin(th), th + PI / 2]; } },
      { len: a, at: t => [x1 - r - t, y1, PI] },
      { len: q, at: t => { const th = PI / 2 + t / r; return [x0 + r + r * Math.cos(th), y1 - r + r * Math.sin(th), th + PI / 2]; } },
      { len: b, at: t => [x0, y1 - r - t, -PI / 2] },
      { len: q, at: t => { const th = PI + t / r; return [x0 + r + r * Math.cos(th), y0 + r + r * Math.sin(th), th + PI / 2]; } },
    ];
    const P = segs.reduce((n, g) => n + g.len, 0);
    const pointAt = d => {
      d = ((d % P) + P) % P;
      for (const g of segs) { if (d <= g.len) return g.at(d); d -= g.len; }
      return segs[0].at(0);
    };
    const wob = d => Math.sin(d * 0.045) * 3 + Math.sin(d * 0.013 + 1) * 2;
    const vineAt = d => {
      const [x, y, ang] = pointAt(d), w = wob(d);
      return [x - Math.sin(ang) * w, y + Math.cos(ang) * w, ang];
    };

    const root = mk("g", { filter: "url(#wpaint)" }, svg);
    const stems = mk("g", { fill: "none", stroke: "#56704a", "stroke-width": "1.5", "stroke-linecap": "round", opacity: ".8" }, root);
    const leaves = mk("g", {}, root), berries = mk("g", {}, root);
    const sparkles = mk("g", { fill: "#c9a24b", stroke: "#c9a24b" }, root);

    let path = "";
    for (let d = 0; d <= P; d += 4) {
      const [x, y] = vineAt(d);
      path += (d ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
    }
    mk("path", animate ? { d: path + "Z", class: "w-fade" } : { d: path + "Z" }, stems);

    let side = 1;
    for (let d = 0; d < P; d += step * (0.8 + rnd() * 0.4)) {
      const [x, y, ang] = vineAt(d);
      const nx = -Math.sin(ang), ny = Math.cos(ang);   // inward normal
      const delay = (d / P) * 1.6;
      side = -side;
      const inward = side > 0, holly = rnd() < 0.55;
      const len = (inward ? 34 + rnd() * 18 : 22 + rnd() * 10) * reach;
      const spread = inward ? 0.55 + rnd() * 0.55 : 0.35 + rnd() * 0.3;
      const la = (ang + (inward ? 1 : -1) * spread) * 180 / PI;

      const g = mk("g", { transform: "translate(" + x.toFixed(1) + " " + y.toFixed(1) + ") rotate(" + la.toFixed(1) + ") scale(" + (len / 60).toFixed(3) + ")" }, leaves);
      const leaf = mk("g", grow(delay), g);
      const gi = Math.floor(rnd() * GREENS.length);
      mk("path", { d: holly ? HOLLY : OVAL, fill: "url(#wl" + gi + ")" }, leaf);
      mk("path", { d: holly ? HOLLY_LOW : OVAL_LOW, fill: "#1b2e1d", opacity: ".18" }, leaf);
      mk("path", { d: "M1 0 Q30 -1.2 57 0", stroke: "#d9e4c8", "stroke-width": holly ? "1.5" : "1.3", fill: "none", opacity: ".6" }, leaf);
      if (!holly) {
        for (let k = 1; k <= 3; k++) {
          const vx = k * 12;
          mk("path", { d: "M" + vx + " 0 Q" + (vx + 4) + " -2.5 " + (vx + 8) + " -5 M" + vx + " 0 Q" + (vx + 4) + " 2.5 " + (vx + 8) + " 5", stroke: "#d9e4c8", "stroke-width": ".9", fill: "none", opacity: ".45" }, leaf);
        }
      }

      if (rnd() < 0.32) {
        const off = (rnd() * 2 - 1) * 8 + (inward ? 9 : -3);
        const bx = x + nx * off + Math.cos(ang) * 6, by = y + ny * off + Math.sin(ang) * 6;
        const bo = mk("g", { transform: "translate(" + bx.toFixed(1) + " " + by.toFixed(1) + ")" }, berries);
        const bi = mk("g", grow(delay + 0.2), bo);
        const n = 2 + Math.floor(rnd() * 3), base = rnd() * 6.28;
        for (let k = 0; k < n; k++) {
          const ra = base + k * (6.28 / n), dist = 5.5;
          const cx = Math.cos(ra) * dist, cy = Math.sin(ra) * dist, br = 4.2 + rnd() * 1.8;
          mk("circle", { cx: cx.toFixed(1), cy: cy.toFixed(1), r: br.toFixed(1), fill: "url(#wb)" }, bi);
          mk("circle", { cx: (cx - br * .35).toFixed(1), cy: (cy - br * .35).toFixed(1), r: (br * .28).toFixed(1), fill: "#fff", opacity: ".55" }, bi);
        }
      }

      if (rnd() < 0.45) {
        const off = -16 + rnd() * 66;
        const sx = x + nx * off + Math.cos(ang) * (rnd() * 16 - 8), sy = y + ny * off + Math.sin(ang) * (rnd() * 16 - 8);
        if (sx > 8 && sx < W - 8 && sy > 8 && sy < H - 8) {
          const so = mk("g", { transform: "translate(" + sx.toFixed(1) + " " + sy.toFixed(1) + ")" }, sparkles);
          const si = mk("g", grow(delay + 0.4), so);
          if (rnd() < 0.55) {
            const sz = 3 + rnd() * 4, rot = rnd() * 60;
            const st = mk("g", { transform: "rotate(" + rot.toFixed(0) + ")", "stroke-width": "1.1", "stroke-linecap": "round", opacity: ".9" }, si);
            for (let k = 0; k < 3; k++) {
              const aa = k * PI / 3;
              mk("line", { x1: (-Math.cos(aa) * sz).toFixed(1), y1: (-Math.sin(aa) * sz).toFixed(1), x2: (Math.cos(aa) * sz).toFixed(1), y2: (Math.sin(aa) * sz).toFixed(1) }, st);
            }
          } else {
            mk("circle", { r: (0.9 + rnd() * 1.1).toFixed(1), stroke: "none", opacity: ".8" }, si);
          }
        }
      }
    }
  }

  window.drawWreath = drawWreath;
})();
