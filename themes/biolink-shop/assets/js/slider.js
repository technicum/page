(function () {
  var wrap  = document.getElementById('pzWrap');
  var track = document.getElementById('pzTrack');
  var dots  = document.getElementById('pzDots');
  if (!wrap || !track || !dots) return;

  var cards = track.querySelectorAll('.product-card');
  var total = cards.length;
  var cur   = 0;

  function getW() { return wrap.offsetWidth * 0.85 + 12; }

  function go(n) {
    cur = (n + total) % total;
    track.style.transform = 'translateX(-' + (cur * getW()) + 'px)';
    dots.querySelectorAll('.pz-slider-dot').forEach(function (d, i) {
      d.classList.toggle('active', i === cur);
    });
  }

  window.pzSlide = function (d) { go(cur + d); };

  for (var i = 0; i < total; i++) {
    var dot = document.createElement('button');
    dot.className = 'pz-slider-dot' + (i === 0 ? ' active' : '');
    (function (idx) { dot.onclick = function () { go(idx); }; })(i);
    dots.appendChild(dot);
  }

  track.addEventListener('touchstart', function (e) {
    var tx = e.touches[0].clientX;
    track.addEventListener('touchend', function f(e) {
      if (Math.abs(e.changedTouches[0].clientX - tx) > 40)
        pzSlide(e.changedTouches[0].clientX < tx ? 1 : -1);
      track.removeEventListener('touchend', f);
    }, { passive: true });
  }, { passive: true });

  go(0);
})();
