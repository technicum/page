/**
 * Cookie Consent App — render.js
 */
module.exports = function render(config) {
  const message    = config.message    || 'We use cookies to improve your experience on our site.'
  const buttonText = config.buttonText || 'Got it'
  const position   = config.position   || 'bottom'
  const bgColor    = config.bgColor    || '#1f2937'
  const textColor  = config.textColor  || '#f9fafb'
  const posStyle   = position === 'top' ? 'top:0' : 'bottom:0'

  return {
    head: '',
    bodyEnd: `
<!-- Cookie Consent (PageZaper App) -->
<div id="pz-cookie-bar" style="display:none;position:fixed;${posStyle};left:0;right:0;z-index:9998;background:${bgColor};color:${textColor};padding:14px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;box-shadow:0 -2px 12px rgba(0,0,0,.15);font-family:system-ui,sans-serif;font-size:14px;">
  <span>${message.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>
  <button onclick="pzCookieAccept()" style="padding:8px 20px;background:#6366f1;color:#fff;border:none;border-radius:7px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0;">${buttonText.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</button>
</div>
<script>
(function(){
  if(localStorage.getItem('pz_cookie_ok')) return;
  document.getElementById('pz-cookie-bar').style.display='flex';
})();
function pzCookieAccept(){
  localStorage.setItem('pz_cookie_ok','1');
  var el=document.getElementById('pz-cookie-bar');
  if(el){el.style.transition='opacity .3s';el.style.opacity='0';setTimeout(function(){el.remove()},300);}
}
</script>
<!-- /Cookie Consent -->`
  }
}
