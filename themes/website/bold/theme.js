/* ══════════════════════════════════════════════════════
   THEME JS: Bold
   Dark theme interactions with glow effects
   ══════════════════════════════════════════════════════ */
$(function () {

  /* ── Smooth scroll ───────────────────────────────── */
  $('a[href^="#"]').on('click', function (e) {
    var target = $(this.getAttribute('href'));
    if (target.length) {
      e.preventDefault();
      $('html, body').animate({ scrollTop: target.offset().top - 72 }, 500);
    }
  });

  /* ── FAQ accordion ───────────────────────────────── */
  $(document).on('click', '.faq-item', function () {
    var isOpen = $(this).hasClass('open');
    $('.faq-item').removeClass('open');
    if (!isOpen) $(this).addClass('open');
  });

  /* ── Scroll-reveal with slide-up ─────────────────── */
  var $els = $('section, .service-card, .testi-card, .team-card');
  $els.css({ opacity: 0, transform: 'translateY(30px)', transition: 'opacity .6s ease, transform .6s ease' });

  function reveal() {
    var bottom = $(window).scrollTop() + $(window).height();
    $els.each(function () {
      if ($(this).offset().top < bottom - 40) {
        $(this).css({ opacity: 1, transform: 'translateY(0)' });
      }
    });
  }
  $(window).on('scroll', reveal);
  reveal();

  /* ── Sticky nav glow on scroll ───────────────────── */
  $(window).on('scroll', function () {
    if ($(this).scrollTop() > 20) {
      $('nav').css('border-bottom-color', 'rgba(124,58,237,.3)');
    } else {
      $('nav').css('border-bottom-color', '#2a2a2e');
    }
  });

  /* ── Gallery lightbox (dark style) ───────────────── */
  var $overlay = $('<div id="wb-lightbox" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.95);z-index:9999;align-items:center;justify-content:center;cursor:zoom-out;">' +
    '<img id="wb-lightbox-img" style="max-width:88vw;max-height:88vh;border-radius:12px;border:1px solid #2a2a2e;">' +
    '<button id="wb-lb-close" style="position:absolute;top:20px;right:24px;background:none;border:none;color:#71717a;font-size:32px;cursor:pointer;line-height:1;transition:color .15s;" onmouseover="this.style.color=\'#fff\'" onmouseout="this.style.color=\'#71717a\'">×</button>' +
    '</div>').appendTo('body');

  $(document).on('click', '.gallery-item img', function (e) {
    e.stopPropagation();
    $('#wb-lightbox-img').attr('src', this.src);
    $overlay.css('display', 'flex');
  });
  $overlay.on('click', function () { $overlay.hide(); });
  $(document).on('keydown', function (e) { if (e.key === 'Escape') $overlay.hide(); });

  /* ── Service card glow on hover (CSS handles it, this adds cursor effect) */
  $(document).on('mousemove', '.service-card', function (e) {
    var rect = this.getBoundingClientRect();
    var x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
    var y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
    $(this).css('background', 'radial-gradient(circle at ' + x + '% ' + y + '%, #232326, #1c1c1e 60%)');
  }).on('mouseleave', '.service-card', function () {
    $(this).css('background', '');
  });

});
