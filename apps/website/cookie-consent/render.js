module.exports = function render(config) {
  const msg  = (config.message    || 'We use cookies to improve your experience on our site.').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  const btn  = (config.buttonText || 'Got it').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  const pos  = config.position  || 'bottom'
  const bg   = config.bgColor   || '#1f2937'
  const fg   = config.textColor || '#f9fafb'
  const side = pos === 'top' ? 'top:0' : 'bottom:0'
  return {
    head: '',
    bodyEnd: `
<!-- Cookie Consent (PageZaper App) -->
<div id="pz-cookie" style="display:none;position:fixed;${side};left:0;right:0;z-index:9998;background:${bg};color:${fg};padding:14px 24px;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;box-shadow:0 -2px 12px rgba(0,0,0,.15);font-family:system-ui,sans-serif;font-size:14px;">
  <span>${msg}</span>
  <button onclick="pzCookieOk()" style="padding:8px 20px;background:#6366f1;color:#fff;border:none;border-radius:7px;font-size:13px;font-weight:600;cursor:pointer;">${btn}</button>
</div>
<script>
(function(){if(!localStorage.getItem('pz_ck'))document.getElementById('pz-cookie').style.display='flex';})();
function pzCookieOk(){localStorage.setItem('pz_ck','1');var e=document.getElementById('pz-cookie');if(e){e.style.transition='opacity .3s';e.style.opacity='0';setTimeout(function(){e.remove()},300);}}
</script>
<!-- /Cookie Consent -->`
  }
}
