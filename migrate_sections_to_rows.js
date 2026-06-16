/**
 * Migration: Wrap all flat sections in single-column rows
 * Run once: node migrate_sections_to_rows.js
 */
require('dotenv').config()
const { db } = require('./config/db')

async function migrate() {
  console.log('Starting sections → rows migration...\n')

  const sites = await db.query('SELECT id, title, settings FROM ms_sites')
  let updated = 0, skipped = 0

  for (const site of sites) {
    let settings
    try { settings = JSON.parse(site.settings || '{}') } catch { continue }

    // ── Single-page sites ─────────────────────────────────────────────────────
    if (Array.isArray(settings.sections) && settings.sections.length) {
      const alreadyMigrated = settings.sections.every(s => s._isRow)
      if (!alreadyMigrated) {
        settings.sections = settings.sections.map(wrapInRow)
        await db.execute('UPDATE ms_sites SET settings = ? WHERE id = ?', [JSON.stringify(settings), site.id])
        console.log(`✅ [${site.id}] ${site.title} — wrapped ${settings.sections.length} top-level sections`)
        updated++
        continue
      }
    }

    // ── Multi-page sites (settings.pages.home.sections etc.) ─────────────────
    if (settings.pages && typeof settings.pages === 'object') {
      let changed = false
      for (const [pageId, pageData] of Object.entries(settings.pages)) {
        if (!Array.isArray(pageData.sections) || !pageData.sections.length) continue
        const alreadyMigrated = pageData.sections.every(s => s._isRow)
        if (!alreadyMigrated) {
          settings.pages[pageId].sections = pageData.sections.map(wrapInRow)
          console.log(`  ↳ page "${pageId}": wrapped ${pageData.sections.length} sections`)
          changed = true
        }
      }
      if (changed) {
        await db.execute('UPDATE ms_sites SET settings = ? WHERE id = ?', [JSON.stringify(settings), site.id])
        console.log(`✅ [${site.id}] ${site.title} — multi-page updated`)
        updated++
        continue
      }
    }

    skipped++
    console.log(`⏭  [${site.id}] ${site.title} — already migrated or no sections`)
  }

  console.log(`\nDone. ${updated} sites updated, ${skipped} skipped.`)
  process.exit(0)
}

function wrapInRow(sec) {
  // Already a row — skip
  if (sec._isRow) return sec
  return {
    id:      '_row_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    _isRow:  true,
    layout:  '1',
    columns: [[sec]],
    design:  {}
  }
}

migrate().catch(err => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})
