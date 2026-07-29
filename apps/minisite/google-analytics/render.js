module.exports = function render(config) {
  const id = (config.measurementId || '').trim()
  if (!id) return { head: '', bodyEnd: '' }
  return {
    head: `<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');</script>`,
    bodyEnd: ''
  }
}
