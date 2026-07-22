/* ══════════════════════════════════════════════════════
   THEME JS: Spark
   ══════════════════════════════════════════════════════ */
$(function () {

  /* ── Smooth scroll ───────────────────────────────── */
  $('a[href^="#"]').on('click', function (e) {
    var target = $(this.getAttribute('href'));
    if (target.length) {
      e.preventDefault();
      $('html, body').animate({ scrollTop: target.offset().top - 72 }, 400, 'swing');
    }
  });

  /* ── FAQ accordion ───────────────────────────────── */
  $(document).on('click', '.faq-item', function () {
    var isOpen = $(this).hasClass('open');
    $('.faq-item').removeClass('open');
    if (!isOpen) $(this).addClass('open');
  });

  /* ── Fade-in on scroll ───────────────────────────── */
  var $sections = $('section');
  $sections.css({ opacity: 0, transform: 'translateY(16px)', transition: 'opacity .4s ease, transform .4s ease' });

  function revealOnScroll() {
    var scrollBottom = $(window).scrollTop() + $(window).height();
    $sections.each(function () {
      if ($(this).offset().top < scrollBottom - 60) {
        $(this).css({ opacity: 1, transform: 'translateY(0)' });
      }
    });
  }
  $(window).on('scroll', revealOnScroll);
  revealOnScroll();

  /* ── Gallery lightbox ────────────────────────────── */
  var $overlay = $('<div id="wb-lightbox" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:9999;align-items:center;justify-content:center;cursor:zoom-out;">' +
    '<img id="wb-lightbox-img" style="max-width:90vw;max-height:90vh;border-radius:16px;">' +
    '<button id="wb-lb-close" style="position:absolute;top:20px;right:24px;background:none;border:none;color:#fff;font-size:32px;cursor:pointer;line-height:1;">×</button>' +
    '</div>').appendTo('body');

  $(document).on('click', '.gallery-item img', function (e) {
    e.stopPropagation();
    $('#wb-lightbox-img').attr('src', this.src);
    $overlay.css('display', 'flex');
  });
  $overlay.on('click', function () { $overlay.hide(); });
  $('#wb-lb-close').on('click', function () { $overlay.hide(); });
  $(document).on('keydown', function (e) { if (e.key === 'Escape') $overlay.hide(); });

  /* ── Nav scroll state ────────────────────────────── */
  $(window).on('scroll', function () {
    $('nav').toggleClass('scrolled', $(this).scrollTop() > 10);
  });

});
