(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  var margin = 8;
  var cell = 14;
  var INITIAL_BODY_LENGTH = 3;
  var bodyLength = INITIAL_BODY_LENGTH;
  var segSize = 10;
  var tickMs = 120;
  var turnChance = 0.12;
  var contentPad = 12;

  var segments = [];
  var lastPos = [];
  var trail = [];
  var gx, gy, cols, rows;
  var dir = { x: 1, y: 0 };
  var forbidden = null;
  var appleX, appleY;
  var appleEl = null;

  var dirsAll = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];

  function bounds() {
    var w = document.documentElement.scrollWidth;
    var h = document.documentElement.scrollHeight;
    cols = Math.floor((w - margin * 2) / cell);
    rows = Math.floor((h - margin * 2) / cell);

    var el = document.querySelector('.container');
    if (el) {
      var r = el.getBoundingClientRect();
      var top = r.top + window.pageYOffset - contentPad;
      var left = r.left + window.pageXOffset - contentPad;
      var bottom = r.bottom + window.pageYOffset + contentPad;
      var right = r.right + window.pageXOffset + contentPad;
      forbidden = {
        gxMin: Math.floor((left - margin) / cell),
        gxMax: Math.ceil((right - margin) / cell),
        gyMin: Math.floor((top - margin) / cell),
        gyMax: Math.ceil((bottom - margin) / cell)
      };
    }
  }

  function isForbidden(x, y) {
    if (!forbidden) return false;
    return x >= forbidden.gxMin && x <= forbidden.gxMax && y >= forbidden.gyMin && y <= forbidden.gyMax;
  }

  function inBody(x, y, includeTail) {
    var end = includeTail ? trail.length : trail.length - 1;
    for (var i = 0; i < end; i++) {
      if (trail[i].x === x && trail[i].y === y) return true;
    }
    return false;
  }

  function resolveMove(x, y, d) {
    var nx = x + d.x;
    var ny = y + d.y;

    // outer periodic boundary: wrap to the opposite edge
    if (nx < 0) nx = cols - 1;
    if (nx >= cols) nx = 0;
    if (ny < 0) ny = rows - 1;
    if (ny >= rows) ny = 0;

    // inner boundary: the content column is periodic too, skip straight through
    if (isForbidden(nx, ny)) {
      if (d.x > 0) nx = forbidden.gxMax + 1;
      else if (d.x < 0) nx = forbidden.gxMin - 1;
      if (d.y > 0) ny = forbidden.gyMax + 1;
      else if (d.y < 0) ny = forbidden.gyMin - 1;

      if (nx < 0) nx = cols - 1;
      if (nx >= cols) nx = 0;
      if (ny < 0) ny = rows - 1;
      if (ny >= rows) ny = 0;
    }

    return { x: nx, y: ny };
  }

  function clearSegments() {
    segments.forEach(function (s) { s.remove(); });
    segments = [];
    lastPos = [];
  }

  function makeSegment(x, y, color) {
    var s = document.createElement('div');
    s.style.position = 'absolute';
    s.style.width = segSize + 'px';
    s.style.height = segSize + 'px';
    s.style.background = color || '#000000';
    s.style.pointerEvents = 'none';
    s.style.zIndex = '9999';
    s.style.opacity = '1';
    s.style.transition = 'left ' + tickMs + 'ms linear, top ' + tickMs + 'ms linear, opacity 200ms ease';
    s.style.left = (margin + x * cell) + 'px';
    s.style.top = (margin + y * cell) + 'px';
    document.body.appendChild(s);
    return s;
  }

  function buildSegments(startX, startY) {
    for (var i = 0; i < bodyLength; i++) {
      segments.push(makeSegment(startX, startY, i === 0 ? '#0000dd' : '#000000'));
      lastPos.push({ x: startX, y: startY });
    }
  }

  function randomCell() {
    var tries = 0;
    var x, y;
    do {
      x = Math.floor(Math.random() * cols);
      y = Math.floor(Math.random() * rows);
      tries++;
    } while (isForbidden(x, y) && tries < 200);
    return { x: x, y: y };
  }

  function spawnApple() {
    var pick, tries = 0;
    do {
      pick = randomCell();
      tries++;
    } while (inBody(pick.x, pick.y, true) && tries < 200);

    appleX = pick.x;
    appleY = pick.y;

    if (!appleEl) {
      appleEl = document.createElement('div');
      appleEl.style.position = 'absolute';
      appleEl.style.width = segSize + 'px';
      appleEl.style.height = segSize + 'px';
      appleEl.style.background = '#dd0000';
      appleEl.style.borderRadius = '50%';
      appleEl.style.pointerEvents = 'none';
      appleEl.style.zIndex = '9998';
      appleEl.style.transition = 'left 200ms ease, top 200ms ease';
      document.body.appendChild(appleEl);
    }
    appleEl.style.left = (margin + appleX * cell) + 'px';
    appleEl.style.top = (margin + appleY * cell) + 'px';
  }

  function spawn() {
    bodyLength = INITIAL_BODY_LENGTH;
    var start = randomCell();
    gx = start.x;
    gy = start.y;
    dir = dirsAll[Math.floor(Math.random() * 4)];
    trail = [{ x: gx, y: gy }];
    buildSegments(gx, gy);
    spawnApple();
  }

  function die() {
    segments.forEach(function (s) { s.style.opacity = '0'; });
    setTimeout(function () {
      clearSegments();
      spawn();
      setTimeout(tick, tickMs);
    }, 220);
  }

  function render() {
    for (var j = 0; j < segments.length; j++) {
      var p = trail[j];
      if (!p) continue;
      var el = segments[j];
      var prev = lastPos[j];
      var jumped = prev && (Math.abs(p.x - prev.x) > 1 || Math.abs(p.y - prev.y) > 1);

      if (jumped) {
        el.style.transition = 'none';
        el.style.left = (margin + p.x * cell) + 'px';
        el.style.top = (margin + p.y * cell) + 'px';
        void el.offsetWidth;
        el.style.transition = 'left ' + tickMs + 'ms linear, top ' + tickMs + 'ms linear, opacity 200ms ease';
      } else {
        el.style.left = (margin + p.x * cell) + 'px';
        el.style.top = (margin + p.y * cell) + 'px';
      }

      lastPos[j] = { x: p.x, y: p.y };
    }
  }

  bounds();
  window.addEventListener('resize', bounds);
  spawn();

  function tick() {
    var moves = dirsAll.map(function (d) {
      var r = resolveMove(gx, gy, d);
      return { d: d, x: r.x, y: r.y };
    }).filter(function (m) {
      return !inBody(m.x, m.y, false);
    });

    if (moves.length === 0) {
      die();
      return;
    }

    var chosen;
    if (Math.random() < turnChance) {
      chosen = moves[Math.floor(Math.random() * moves.length)];
    } else {
      moves.sort(function (a, b) {
        var da = Math.abs(a.x - appleX) + Math.abs(a.y - appleY);
        var db = Math.abs(b.x - appleX) + Math.abs(b.y - appleY);
        if (da !== db) return da - db;
        var aSame = (a.d.x === dir.x && a.d.y === dir.y) ? 0 : 1;
        var bSame = (b.d.x === dir.x && b.d.y === dir.y) ? 0 : 1;
        return aSame - bSame;
      });
      chosen = moves[0];
    }

    dir = chosen.d;
    gx = chosen.x;
    gy = chosen.y;

    trail.unshift({ x: gx, y: gy });
    if (trail.length > bodyLength) trail.pop();

    if (gx === appleX && gy === appleY) {
      bodyLength++;
      segments.push(makeSegment(gx, gy));
      lastPos.push({ x: gx, y: gy });
      spawnApple();
    }

    render();
    setTimeout(tick, tickMs);
  }

  tick();
})();
