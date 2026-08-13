(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  var numBoids = 10;
  var maxSpeed = 1.4;
  var maxForce = 0.04;
  var perception = 70;
  var sepDistance = 22;
  var wAlign = 1.0;
  var wCohesion = 0.9;
  var wSeparation = 1.6;
  var avoidPad = 16;
  var avoidForce = 0.12;
  var boidSize = 10;

  var forbidden = null;
  var pageW, pageH;
  var boids = [];

  function bounds() {
    pageW = document.documentElement.scrollWidth;
    pageH = document.documentElement.scrollHeight;

    var el = document.querySelector('.container');
    if (el) {
      var r = el.getBoundingClientRect();
      forbidden = {
        top: r.top + window.pageYOffset,
        left: r.left + window.pageXOffset,
        bottom: r.bottom + window.pageYOffset,
        right: r.right + window.pageXOffset
      };
    }
  }

  function makeBoid() {
    var el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.width = '0';
    el.style.height = '0';
    el.style.borderLeft = (boidSize / 2) + 'px solid transparent';
    el.style.borderRight = (boidSize / 2) + 'px solid transparent';
    el.style.borderBottom = boidSize + 'px solid #000000';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '9999';
    document.body.appendChild(el);

    var x, y, tries = 0;
    do {
      x = Math.random() * pageW;
      y = Math.random() * pageH;
      tries++;
    } while (forbidden && x > forbidden.left - avoidPad && x < forbidden.right + avoidPad &&
             y > forbidden.top - avoidPad && y < forbidden.bottom + avoidPad && tries < 200);

    var angle = Math.random() * Math.PI * 2;
    return { x: x, y: y, vx: Math.cos(angle) * maxSpeed, vy: Math.sin(angle) * maxSpeed, el: el };
  }

  bounds();
  window.addEventListener('resize', bounds);
  for (var i = 0; i < numBoids; i++) boids.push(makeBoid());

  function limitVec(v, max) {
    var mag = Math.hypot(v.x, v.y);
    if (mag > max) { v.x = (v.x / mag) * max; v.y = (v.y / mag) * max; }
    return v;
  }

  function step() {
    boids.forEach(function (b) {
      var align = { x: 0, y: 0 };
      var cohesion = { x: 0, y: 0 };
      var separation = { x: 0, y: 0 };
      var total = 0;

      boids.forEach(function (o) {
        if (o === b) return;
        var d = Math.hypot(o.x - b.x, o.y - b.y);
        if (d < perception) {
          align.x += o.vx; align.y += o.vy;
          cohesion.x += o.x; cohesion.y += o.y;
          total++;
          if (d < sepDistance && d > 0) {
            separation.x += (b.x - o.x) / d;
            separation.y += (b.y - o.y) / d;
          }
        }
      });

      if (total > 0) {
        align.x /= total; align.y /= total;
        limitVec(align, maxForce);
        cohesion.x = cohesion.x / total - b.x;
        cohesion.y = cohesion.y / total - b.y;
        limitVec(cohesion, maxForce);
      }
      limitVec(separation, maxForce);

      b.vx += align.x * wAlign + cohesion.x * wCohesion + separation.x * wSeparation;
      b.vy += align.y * wAlign + cohesion.y * wCohesion + separation.y * wSeparation;

      if (forbidden) {
        var cx = (forbidden.left + forbidden.right) / 2;
        var cy = (forbidden.top + forbidden.bottom) / 2;
        var withinX = b.x > forbidden.left - avoidPad && b.x < forbidden.right + avoidPad;
        var withinY = b.y > forbidden.top - avoidPad && b.y < forbidden.bottom + avoidPad;
        if (withinX && withinY) {
          var dx = b.x - cx, dy = b.y - cy;
          var d = Math.hypot(dx, dy) || 1;
          b.vx += (dx / d) * avoidForce;
          b.vy += (dy / d) * avoidForce;
        }
      }

      var speed = Math.hypot(b.vx, b.vy);
      if (speed > maxSpeed) { b.vx = (b.vx / speed) * maxSpeed; b.vy = (b.vy / speed) * maxSpeed; }
      if (speed < maxSpeed * 0.5 && speed > 0) { b.vx = (b.vx / speed) * (maxSpeed * 0.5); b.vy = (b.vy / speed) * (maxSpeed * 0.5); }

      b.x += b.vx;
      b.y += b.vy;

      if (b.x < 0) b.x = pageW;
      if (b.x > pageW) b.x = 0;
      if (b.y < 0) b.y = pageH;
      if (b.y > pageH) b.y = 0;

      var angleDeg = Math.atan2(b.vy, b.vx) * 180 / Math.PI + 90;
      b.el.style.left = b.x + 'px';
      b.el.style.top = b.y + 'px';
      b.el.style.transform = 'rotate(' + angleDeg + 'deg)';
    });

    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
})();
