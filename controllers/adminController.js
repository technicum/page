const path         = require('path')
const fs           = require('fs')
const { db }       = require('../config/db')
const themeManager = require('../config/themeManager')

const THEMES_DIR = path.join(__dirname, '../themes')

// ── Guard ─────────────────────────────────────────────────────────────────────
// isAdmin middleware is applied in routes, so by the time we reach these
// functions the user is guaranteed to be a logged-in admin.

// ── Dashboard ─────────────────────────────────────────────────────────────────
exports.index = async (req, res) => {
  const [userCount] = await db.query('SELECT COUNT(*) as c FROM ms_accounts')
  const [siteCount] = await db.query('SELECT COUNT(*) as c FROM ms_sites')
  const themes      = Object.values(themeManager.loadAll())
  res.render('admin/index.njk', {
    title: 'Admin',
    user: req.session.user,
    userCount: userCount ? userCount.c : 0,
    siteCount: siteCount ? siteCount.c : 0,
    themeCount: themes.length
  })
}

// ── Theme listing ─────────────────────────────────────────────────────────────
exports.themes = (req, res) => {
  themeManager.clearCache()
  const themes = Object.values(themeManager.loadAll())
  res.render('admin/themes.njk', {
    title: 'Themes',
    user: req.session.user,
    themes,
    flash_success: req.flash('success'),
    flash_errors:  req.flash('errors')
  })
}

// ── Upload theme ZIP ──────────────────────────────────────────────────────────
exports.uploadTheme = async (req, res) => {
  if (!req.file) {
    req.flash('errors', ['No file uploaded.'])
    return res.redirect('/admin/themes')
  }

  const AdmZip = (() => { try { return require('adm-zip') } catch(e) { return null } })()
  if (!AdmZip) {
    req.flash('errors', ['adm-zip package is not installed. Run: npm install adm-zip'])
    return res.redirect('/admin/themes')
  }

  try {
    const zip     = new AdmZip(req.file.path)
    const entries = zip.getEntries()

    // The ZIP must contain a top-level folder with theme.json and index.liquid
    // Find the root folder
    const rootFolders = new Set()
    entries.forEach(e => {
      const parts = e.entryName.split('/')
      if (parts[0]) rootFolders.add(parts[0])
    })

    if (rootFolders.size !== 1) {
      req.flash('errors', ['ZIP must contain exactly one top-level folder (the theme slug).'])
      fs.unlinkSync(req.file.path)
      return res.redirect('/admin/themes')
    }

    const slug    = [...rootFolders][0].replace(/[^a-z0-9-]/g, '')
    const destDir = path.join(THEMES_DIR, slug)

    // Validate required files exist inside ZIP
    const hasJson   = entries.some(e => e.entryName === slug + '/theme.json')
    const hasLiquid = entries.some(e => e.entryName === slug + '/index.liquid')
    if (!hasJson || !hasLiquid) {
      req.flash('errors', ['ZIP must contain theme.json and index.liquid inside the theme folder.'])
      fs.unlinkSync(req.file.path)
      return res.redirect('/admin/themes')
    }

    // Extract
    zip.extractAllTo(THEMES_DIR, true)
    fs.unlinkSync(req.file.path)
    themeManager.clearCache()

    req.flash('success', `Theme "${slug}" installed successfully.`)
  } catch (e) {
    req.flash('errors', ['Upload failed: ' + e.message])
    try { fs.unlinkSync(req.file.path) } catch(e2) {}
  }

  res.redirect('/admin/themes')
}

// ── Delete theme ──────────────────────────────────────────────────────────────
exports.deleteTheme = (req, res) => {
  const slug    = (req.body.slug || '').replace(/[^a-z0-9-]/g, '')
  const protect = ['biolink-shop', 'biolink-service', 'biolink-realty', 'biolink-freelancer', 'biolink-creator', '_starter']
  if (!slug || protect.includes(slug)) {
    req.flash('errors', ['Cannot delete built-in themes.'])
    return res.redirect('/admin/themes')
  }

  const themeDir = path.join(THEMES_DIR, slug)
  if (fs.existsSync(themeDir)) {
    fs.rmSync(themeDir, { recursive: true, force: true })
    themeManager.clearCache()
    req.flash('success', `Theme "${slug}" deleted.`)
  } else {
    req.flash('errors', [`Theme "${slug}" not found.`])
  }
  res.redirect('/admin/themes')
}

// ── User listing ──────────────────────────────────────────────────────────────
exports.users = async (req, res) => {
  const users = await db.query('SELECT id, name, email, plan, is_admin, created_at FROM ms_accounts ORDER BY id DESC')
  res.render('admin/users.njk', {
    title: 'Users',
    user: req.session.user,
    users,
    flash_success: req.flash('success'),
    flash_errors:  req.flash('errors')
  })
}

// ── Categories list ───────────────────────────────────────────────────────────
exports.categories = async (req, res) => {
  const categories = await db.query(
    'SELECT c.*, COUNT(s.id) as site_count FROM ms_categories c LEFT JOIN ms_sites s ON s.category_id = c.id GROUP BY c.id ORDER BY c.sort_order ASC, c.name ASC'
  )
  res.render('admin/categories.njk', {
    title: 'Categories',
    user: req.session.user,
    categories,
    flash_success: req.flash('success'),
    flash_errors:  req.flash('errors')
  })
}

// ── Create category ───────────────────────────────────────────────────────────
exports.createCategory = async (req, res) => {
  let { name, icon, description, sort_order } = req.body
  name = (name || '').trim()
  icon = (icon || '🏢').trim()
  description = (description || '').trim()
  sort_order = parseInt(sort_order) || 0

  if (!name) {
    req.flash('errors', ['Category name is required.'])
    return res.redirect('/admin/categories')
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  try {
    await db.execute(
      'INSERT INTO ms_categories (name, slug, icon, description, sort_order) VALUES (?, ?, ?, ?, ?)',
      [name, slug, icon, description || null, sort_order]
    )
    req.flash('success', `Category "${name}" created.`)
  } catch (e) {
    req.flash('errors', ['Category with that name already exists.'])
  }
  res.redirect('/admin/categories')
}

// ── Update category ───────────────────────────────────────────────────────────
exports.updateCategory = async (req, res) => {
  const id = parseInt(req.body.id) || 0
  let { name, icon, description, sort_order, status } = req.body
  name = (name || '').trim()
  icon = (icon || '🏢').trim()
  description = (description || '').trim()
  sort_order = parseInt(sort_order) || 0
  status = status === '1' ? 1 : 0

  if (!name || !id) {
    req.flash('errors', ['Invalid request.'])
    return res.redirect('/admin/categories')
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  try {
    await db.execute(
      'UPDATE ms_categories SET name=?, slug=?, icon=?, description=?, sort_order=?, status=? WHERE id=?',
      [name, slug, icon, description || null, sort_order, status, id]
    )
    req.flash('success', `Category "${name}" updated.`)
  } catch (e) {
    req.flash('errors', ['Update failed: ' + e.message])
  }
  res.redirect('/admin/categories')
}

// ── Delete category ───────────────────────────────────────────────────────────
exports.deleteCategory = async (req, res) => {
  const id = parseInt(req.body.id) || 0
  if (!id) return res.redirect('/admin/categories')
  // Sites with this category will have category_id set to NULL (FK ON DELETE SET NULL)
  await db.execute('DELETE FROM ms_categories WHERE id = ?', [id])
  req.flash('success', 'Category deleted.')
  res.redirect('/admin/categories')
}

// ── Toggle admin ──────────────────────────────────────────────────────────────
exports.toggleAdmin = async (req, res) => {
  const targetId = parseInt(req.body.user_id) || 0
  const me       = req.session.user
  if (targetId === me.id) {
    req.flash('errors', ['You cannot change your own admin status.'])
    return res.redirect('/admin/users')
  }
  const target = await db.first('SELECT id, is_admin FROM ms_accounts WHERE id = ?', [targetId])
  if (!target) return res.redirect('/admin/users')
  await db.execute('UPDATE ms_accounts SET is_admin = ? WHERE id = ?', [target.is_admin ? 0 : 1, targetId])
  req.flash('success', 'Admin status updated.')
  res.redirect('/admin/users')
}
