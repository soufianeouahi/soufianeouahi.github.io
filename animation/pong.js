(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  var margin = 8;
  var paddleInset = 14;
  var paddleWidth = 8;
  var paddleHeight = 60;
  var ballSize = 8;
  var ballSpeed = 3.2;
  var bounceNoise = 0.6; // small random wobble added to the bounce angle

  var pageW, pageH, paddleMaxSpeed;
  var leftPaddle, rightPaddle, ball;
  var scoreLeft = 0, scoreRight = 0;
  var leftEl, rightEl, ballEl, scoreEl;

  function bounds() {
    pageW = document.documentElement.scrollWidth;
    pageH = document.documentElement.scrollHeight;
    // paddle should be able to cross the whole court in ~1 second (60 frames)
    paddleMaxSpeed = Math.max(3, pageH / 60);
  }

  bounds();
  window.addEventListener('resize', bounds);

  function makeRect(w, h) {
    var el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.width = w + 'px';
    el.style.height = h + 'px';
    el.style.background = '#000000';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '9999';
    document.body.appendChild(el);
    return el;
  }

  leftEl = makeRect(paddleWidth, paddleHeight);
  rightEl = makeRect(paddleWidth, paddleHeight);
  ballEl = makeRect(ballSize, ballSize);
  ballEl.style.zIndex = '-1'; // behind the page's text, so it doesn't cover it when crossing the middle

  scoreEl = document.createElement('div');
  scoreEl.style.position = 'absolute';
  scoreEl.style.top = '10px';
  scoreEl.style.left = '50%';
  scoreEl.style.transform = 'translateX(-50%)';
  scoreEl.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
  scoreEl.style.fontSize = '12px';
  scoreEl.style.color = '#333333';
  scoreEl.style.pointerEvents = 'none';
  scoreEl.style.zIndex = '9999';
  document.body.appendChild(scoreEl);

  function updateScore() {
    scoreEl.textContent = scoreLeft + ' : ' + scoreRight;
  }
  updateScore();

  leftPaddle = { x: margin + paddleInset, y: pageH / 2 - paddleHeight / 2 };
  rightPaddle = { x: pageW - margin - paddleInset - paddleWidth, y: pageH / 2 - paddleHeight / 2 };

  function serve(towardRight) {
    var angle = (Math.random() * 0.6 - 0.3); // slight vertical variation
    ball = {
      x: pageW / 2 - ballSize / 2,
      y: pageH / 2 - ballSize / 2,
      vx: (towardRight ? 1 : -1) * ballSpeed,
      vy: angle * ballSpeed
    };
  }
  serve(Math.random() < 0.5);

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function trackBall(paddle) {
    var paddleCenter = paddle.y + paddleHeight / 2;
    var target = ball.y + ballSize / 2;
    var diff = target - paddleCenter;
    var move = clamp(diff, -paddleMaxSpeed, paddleMaxSpeed);
    paddle.y = clamp(paddle.y + move, margin, pageH - margin - paddleHeight);
  }

  function step() {
    // recompute gutter-safe x positions in case the page width changed
    leftPaddle.x = margin + paddleInset;
    rightPaddle.x = pageW - margin - paddleInset - paddleWidth;

    trackBall(leftPaddle);
    trackBall(rightPaddle);

    var prevX = ball.x;
    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.y < margin) { ball.y = margin; ball.vy = Math.abs(ball.vy); }
    if (ball.y + ballSize > pageH - margin) { ball.y = pageH - margin - ballSize; ball.vy = -Math.abs(ball.vy); }

    var leftFace = leftPaddle.x + paddleWidth;
    var rightFace = rightPaddle.x;

    // left paddle: did the ball's leading edge cross the paddle's front face this frame?
    if (ball.vx < 0 && prevX >= leftFace && ball.x < leftFace) {
      if (ball.y + ballSize >= leftPaddle.y && ball.y <= leftPaddle.y + paddleHeight) {
        ball.x = leftFace;
        ball.vx = Math.abs(ball.vx);
        var hit = (ball.y + ballSize / 2 - (leftPaddle.y + paddleHeight / 2)) / (paddleHeight / 2);
        var noise = (Math.random() * 2 - 1) * bounceNoise;
        ball.vy = clamp(hit * ballSpeed + noise, -ballSpeed, ballSpeed);
      } else {
        scoreRight++;
        updateScore();
        serve(true);
      }
    }

    // right paddle: same check, mirrored
    if (ball.vx > 0 && prevX + ballSize <= rightFace && ball.x + ballSize > rightFace) {
      if (ball.y + ballSize >= rightPaddle.y && ball.y <= rightPaddle.y + paddleHeight) {
        ball.x = rightFace - ballSize;
        ball.vx = -Math.abs(ball.vx);
        var hit2 = (ball.y + ballSize / 2 - (rightPaddle.y + paddleHeight / 2)) / (paddleHeight / 2);
        var noise2 = (Math.random() * 2 - 1) * bounceNoise;
        ball.vy = clamp(hit2 * ballSpeed + noise2, -ballSpeed, ballSpeed);
      } else {
        scoreLeft++;
        updateScore();
        serve(false);
      }
    }

    leftEl.style.left = leftPaddle.x + 'px';
    leftEl.style.top = leftPaddle.y + 'px';
    rightEl.style.left = rightPaddle.x + 'px';
    rightEl.style.top = rightPaddle.y + 'px';
    ballEl.style.left = ball.x + 'px';
    ballEl.style.top = ball.y + 'px';

    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
})();
