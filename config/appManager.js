/**
 * PageZaper App Manager
 *
 * Auto-discovers apps from:
 *   /apps/website/<appId>/app.json + render.js
 *   /apps/minisite/<appId>/app.json + render.js
 *
 * Developer guide — to add a new app:
 *   1. Create folder: apps/website/<your-app-id>/
 *   2. Add app.json  (see existing apps for schema)
 *   3. Add render.js (exports a function(config) => { head, bodyEnd })
 *   That's it — the app appears in the builder automatically.
 */

const fs   = require('fs')
const path = require('path')

const APPS_DIR = path.join(__dirname, '../apps')

function loadAppsFromDir(target) {
  const dir = path.join(APPS_DIR, target)
  if (!fs.existsSync(dir)) return []

  const apps = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const appId      = entry.name
    const appDir     = path.join(dir, appId)
    const manifestPath = path.join(appDir, 'app.json')
    const renderPath   = path.join(appDir, 'render.js')

    if (!fs.existsSync(manifestPath)) continue

    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
      manifest.id     = manifest.id     || appId
      manifest.target = target
      manifest._renderPath = fs.existsSync(renderPath) ? renderPath : null
      apps.push(manifest)
    } catch (e) {
      console.warn(`[AppManager] Failed to load app "${appId}" in ${target}:`, e.message)
    }
  }

  return apps
}

/** Get all apps for a target ('website' | 'minisite') */
function getApps(target) {
  return loadAppsFromDir(target)
}

/**
 * Render all enabled apps for a site into { headHtml, bodyEndHtml }
 * @param {string}  target   'website' | 'minisite'
 * @param {object}  siteApps Parsed ms_sites.apps JSON: { appId: { enabled, ...config } }
 */
function renderApps(target, siteApps) {
  if (!siteApps || typeof siteApps !== 'object') return { headHtml: '', bodyEndHtml: '' }

  const allApps   = loadAppsFromDir(target)
  let headHtml    = ''
  let bodyEndHtml = ''

  for (const app of allApps) {
    const saved = siteApps[app.id]
    if (!saved || !saved.enabled) continue
    if (!app._renderPath) continue

    try {
      // eslint-disable-next-line import/no-dynamic-require
      const renderFn = require(app._renderPath)
      const result   = renderFn(saved)
      if (result.head)    headHtml    += '\n' + result.head
      if (result.bodyEnd) bodyEndHtml += '\n' + result.bodyEnd
    } catch (e) {
      console.warn(`[AppManager] render error for app "${app.id}":`, e.message)
    }
  }

  return { headHtml: headHtml.trim(), bodyEndHtml: bodyEndHtml.trim() }
}

module.exports = { getApps, renderApps }
