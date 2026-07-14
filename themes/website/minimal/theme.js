/* ══════════════════════════════════════════════════════
   THEME JS: Minimal
   Clean interactions — no animations, just essentials
   ══════════════════════════════════════════════════════ */
$(function () {

  /* ── FAQ accordion ───────────────────────────────── */
  $(document).on('click', '.faq-item', function () {
    var isOpen = $(this).hasClass('open');
    $('.faq-item').removeClass('open');
    if (!isOpen) $(this).addClass('open');
  });

  /* ── Smooth scroll ───────────────────────────────── */
  $('a[href^="#"]').on('click', function (e) {
    var target = $(this.getAttribute('href'));
    if (target.length) {
      e.preventDefault();
      $('html, body').animate({ scrollTop: target.offset().top - 72 }, 400);
    }
  });

  /* ── Gallery lightbox ────────────────────────────── */
  var $overlay = $('<div id="wb-lightbox" style="display:none;position:fixed;inset:0;background:rgba(9,9,11,.92);z-index:9999;align-items:center;justify-content:center;cursor:zoom-out;">' +
    '<img id="wb-lightbox-img" style="max-width:88vw;max-height:88vh;border-radius:4px;">' +
    '<button id="wb-lb-close" style="position:absolute;top:20px;right:24px;background:none;border:none;color:#fff;font-size:28px;cursor:pointer;">×</button>' +
    '</div>').appendTo('body');

  $(document).on('click', '.gallery-item img', function (e) {
    e.stopPropagation();
    $('#wb-lightbox-img').attr('src', this.src);
    $overlay.css('display', 'flex');
  });
  $overlay.on('click', function () { $overlay.hide(); });
  $(document).on('keydown', function (e) { if (e.key === 'Escape') $overlay.hide(); });

});
