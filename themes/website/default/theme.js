/* ══════════════════════════════════════════════════════
   THEME JS: Default
   Requires jQuery (loaded by website-public.njk)
   ══════════════════════════════════════════════════════ */
$(function () {

  /* ── Smooth scroll for anchor links ──────────────── */
  $('a[href^="#"]').on('click', function (e) {
    var target = $(this.getAttribute('href'));
    if (target.length) {
      e.preventDefault();
      $('html, body').animate({ scrollTop: target.offset().top - 72 }, 500, 'swing');
    }
  });

  /* ── FAQ accordion ───────────────────────────────── */
  $(document).on('click', '.faq-item', function () {
    var isOpen = $(this).hasClass('open');
    $('.faq-item').removeClass('open');
    if (!isOpen) $(this).addClass('open');
  });

  /* ── Fade-in on scroll (sections) ───────────────── */
  var $sections = $('section');
  $sections.css({ opacity: 0, transform: 'translateY(24px)', transition: 'opacity .5s ease, transform .5s ease' });

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
  var $overlay = $('<div id="wb-lightbox" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;align-items:center;justify-content:center;cursor:zoom-out;">' +
    '<img id="wb-lightbox-img" style="max-width:90vw;max-height:90vh;border-radius:12px;box-shadow:0 24px 80px rgba(0,0,0,.5);">' +
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

  /* ── Nav active on scroll ────────────────────────── */
  $(window).on('scroll', function () {
    var scrollY = $(this).scrollTop();
    $('nav').toggleClass('scrolled', scrollY > 10);
  });

});
