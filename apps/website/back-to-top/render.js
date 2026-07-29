module.exports = function render(config) {
  const color = config.color    || '#6366f1'
  const side  = (config.position || 'bottom-right') === 'bottom-left' ? 'left:24px' : 'right:24px'
  return {
    head: '',
    bodyEnd: `
<!-- Back to Top (PageZaper App) -->
<button id="pz-btt" onclick="window.scrollTo({top:0,behavior:'smooth'})" aria-label="Back to top"
  style="display:none;position:fixed;bottom:24px;${side};z-index:9990;width:44px;height:44px;border-radius:50%;background:${color};color:#fff;border:none;cursor:pointer;font-size:20px;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,.2);">↑</button>
<script>(function(){var b=document.getElementById('pz-btt');window.addEventListener('scroll',function(){b.style.display=window.scrollY>300?'flex':'none';},{passive:true});})();</script>
<!-- /Back to Top -->`
  }
}
