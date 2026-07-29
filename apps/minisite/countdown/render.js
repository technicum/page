module.exports = function render(config) {
  const date  = config.targetDate || ''
  const label = (config.label     || 'Launching in…').replace(/</g,'&lt;')
  const bg    = config.bgColor    || '#111827'
  const fg    = config.textColor  || '#ffffff'
  if (!date) return { head: '', bodyEnd: '' }
  return {
    head: '',
    bodyEnd: `
<!-- Countdown Timer (PageZaper App) -->
<div id="pz-cd" style="background:${bg};color:${fg};padding:20px 16px;text-align:center;font-family:system-ui,sans-serif;border-radius:12px;margin:16px;">
  <div style="font-size:13px;font-weight:600;margin-bottom:12px;opacity:.8;">${label}</div>
  <div id="pz-cd-display" style="display:flex;justify-content:center;gap:16px;"></div>
</div>
<script>
(function(){
  var target=new Date('${date}T00:00:00').getTime();
  function pzCdRender(){
    var now=Date.now(),diff=target-now;
    if(diff<=0){document.getElementById('pz-cd-display').innerHTML='<span>🎉 It\'s here!</span>';return;}
    var d=Math.floor(diff/86400000),h=Math.floor((diff%86400000)/3600000),m=Math.floor((diff%3600000)/60000),s=Math.floor((diff%60000)/1000);
    function box(n,l){return '<div style="min-width:52px;"><div style="font-size:28px;font-weight:700;">'+String(n).padStart(2,'0')+'</div><div style="font-size:10px;opacity:.7;margin-top:2px;">'+l+'</div></div>';}
    document.getElementById('pz-cd-display').innerHTML=box(d,'Days')+box(h,'Hours')+box(m,'Mins')+box(s,'Secs');
  }
  pzCdRender();setInterval(pzCdRender,1000);
})();
</script>
<!-- /Countdown Timer -->`
  }
}
