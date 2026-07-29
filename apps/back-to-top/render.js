module.exports = function render(config) {
  const color    = config.color    || '#6366f1'
  const position = config.position || 'bottom-right'
  const side     = position === 'bottom-left' ? 'left:24px' : 'right:24px'

  return {
    head: '',
    bodyEnd: `
<!-- Back to Top (PageZaper App) -->
<button id="pz-btt" onclick="window.scrollTo({top:0,behavior:'smooth'})" aria-label="Back to top"
  style="display:none;position:fixed;bottom:24px;${side};z-index:9990;width:44px;height:44px;border-radius:50%;background:${color};color:#fff;border:none;cursor:pointer;font-size:20px;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,.2);transition:opacity .2s,transform .2s;">↑</button>
<script>
(function(){
  var btn=document.getElementById('pz-btt');
  window.addEventListener('scroll',function(){
    if(window.scrollY>300){btn.style.display='flex';}else{btn.style.display='none';}
  },{passive:true});
})();
</script>
<!-- /Back to Top -->`
  }
}
