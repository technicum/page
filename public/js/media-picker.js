/**
 * MediaPicker — reusable media library picker modal
 *
 * Single-select: MediaPicker.open(callback, { type: 'image' | 'all' })
 *   callback(file) where file = { url, name, id, isImage, mime_type }
 *
 * Multi-select:  MediaPicker.open(callback, { type: 'image', multi: true })
 *   callback(files[]) where each file = { url, name, id, isImage, mime_type }
 */
var MediaPicker = (function () {
  var _cb         = null;
  var _opts       = {};
  var _files      = [];
  var _folder     = '__all__';
  var _search     = '';
  var _built      = false;
  var _uploadQueue = [];
  var _multi      = false;
  var _selectedId = null;          // single-select
  var _selectedIds = {};           // multi-select: { id: fileObj }
  var _lastPickId = null;
  var _lastPickTime = 0;

  // ── CSS ─────────────────────────────────────────────────────────────────────
  var CSS = [
    '#mpOverlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:10000;display:none;align-items:center;justify-content:center;backdrop-filter:blur(2px);}',
    '#mpModal{background:#fff;border-radius:14px;width:min(900px,96vw);height:min(620px,92vh);display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,.28);overflow:hidden;}',
    '/* Header */',
    '#mpHeader{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid #e5e7eb;flex-shrink:0;background:#fff;}',
    '#mpHeader h3{margin:0;font-size:15px;font-weight:600;color:#111827;flex:1;}',
    '#mpSearch{padding:7px 12px;border:1px solid #e5e7eb;border-radius:8px;font-size:13px;width:190px;outline:none;color:#374151;transition:border-color .15s;}',
    '#mpSearch:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.1);}',
    '#mpClose{background:none;border:none;font-size:20px;cursor:pointer;color:#9ca3af;padding:2px 6px;border-radius:6px;line-height:1;transition:all .15s;}',
    '#mpClose:hover{background:#f3f4f6;color:#374151;}',
    '/* Body */',
    '#mpBody{display:flex;flex:1;overflow:hidden;position:relative;}',
    '/* Sidebar */',
    '#mpSidebar{width:170px;border-right:1px solid #e5e7eb;overflow-y:auto;flex-shrink:0;padding:8px;}',
    '.mp-sidebar-label{font-size:10px;font-weight:700;color:#9ca3af;letter-spacing:.06em;text-transform:uppercase;padding:6px 10px 4px;}',
    '.mp-folder{display:flex;align-items:center;gap:7px;padding:7px 10px;border-radius:7px;font-size:13px;color:#374151;cursor:pointer;white-space:nowrap;transition:all .1s;}',
    '.mp-folder:hover{background:#f3f4f6;}',
    '.mp-folder.active{background:#111827;color:#fff;}',
    '/* Main grid */',
    '#mpMain{flex:1;display:flex;flex-direction:column;overflow:hidden;}',
    '#mpGrid{flex:1;overflow-y:auto;padding:14px;position:relative;}',
    '#mpGridInner{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px;}',
    '.mp-card{border:2px solid #e5e7eb;border-radius:9px;overflow:hidden;cursor:pointer;transition:border-color .12s,box-shadow .12s;position:relative;}',
    '.mp-card:hover{border-color:#6366f1;box-shadow:0 2px 12px rgba(99,102,241,.15);}',
    '.mp-card.selected{border-color:#111827;box-shadow:0 0 0 3px rgba(17,24,39,.12);}',
    '.mp-card.checked{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.2);}',
    '.mp-thumb{width:100%;height:84px;object-fit:cover;display:block;background:#f3f4f6;}',
    '.mp-icon{width:100%;height:84px;display:flex;align-items:center;justify-content:center;font-size:28px;background:#f3f4f6;color:#9ca3af;}',
    '.mp-label{padding:5px 7px;font-size:10px;color:#374151;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500;}',
    '.mp-meta{padding:0 7px 6px;font-size:10px;color:#9ca3af;}',
    '/* Multi-select checkmark badge */',
    '.mp-check{position:absolute;top:5px;right:5px;width:20px;height:20px;border-radius:50%;background:#6366f1;color:#fff;font-size:11px;font-weight:700;align-items:center;justify-content:center;display:none;z-index:2;border:2px solid #fff;}',
    '.mp-card.checked .mp-check{display:flex;}',
    '/* Upload area */',
    '#mpUploadArea{flex-shrink:0;border-top:1px solid #e5e7eb;background:#f9fafb;padding:10px 14px;}',
    '#mpDropZone{border:2px dashed #d1d5db;border-radius:9px;padding:14px 20px;text-align:center;color:#9ca3af;font-size:13px;cursor:pointer;transition:all .18s;display:flex;align-items:center;justify-content:center;gap:10px;}',
    '#mpDropZone:hover,#mpDropZone.drag-over{border-color:#6366f1;background:#f5f3ff;color:#6366f1;}',
    '#mpDropZone span{font-size:20px;}',
    '/* Upload queue */',
    '#mpQueue{display:none;flex-direction:column;gap:5px;padding:8px 0 2px;}',
    '.mp-qitem{display:flex;align-items:center;gap:8px;font-size:12px;color:#374151;}',
    '.mp-qbar{flex:1;height:4px;background:#e5e7eb;border-radius:2px;overflow:hidden;}',
    '.mp-qfill{height:100%;background:#6366f1;transition:width .2s;border-radius:2px;}',
    '.mp-qfill.done{background:#10b981;}',
    '.mp-qfill.error{background:#dc2626;}',
    '.mp-qname{font-size:11px;color:#6b7280;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '.mp-qstatus{font-size:10px;flex-shrink:0;}',
    '/* Footer */',
    '#mpFooter{padding:8px 16px;border-top:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;font-size:12px;color:#6b7280;background:#fff;}',
    '#mpCount{color:#6b7280;}',
    '#mpSelectBtn{padding:7px 18px;background:#111827;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;display:none;}',
    '#mpSelectBtn:hover{background:#1f2937;}',
    '/* Empty */',
    '#mpEmpty{text-align:center;padding:50px 20px;color:#9ca3af;}',
    '/* Drag-over overlay on main body */',
    '#mpDragOverlay{position:absolute;inset:0;background:rgba(99,102,241,.08);border:3px dashed #6366f1;border-radius:8px;display:none;align-items:center;justify-content:center;flex-direction:column;gap:8px;pointer-events:none;z-index:10;}',
    '#mpDragOverlay.active{display:flex;}',
    '#mpDragOverlay span{font-size:36px;}',
    '#mpDragOverlay p{font-size:14px;font-weight:600;color:#6366f1;}',
    '#mpUploadInput{display:none;}'
  ].join('\n');

  // ── Build modal DOM once ──────────────────────────────────────────────────
  function build() {
    if (_built) return;
    _built = true;

    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    var overlay = document.createElement('div');
    overlay.id = 'mpOverlay';
    overlay.innerHTML = [
      '<div id="mpModal">',
      '  <div id="mpHeader">',
      '    <h3 id="mpTitle">📁 Media Library</h3>',
      '    <input id="mpSearch" type="search" placeholder="Search…" autocomplete="off">',
      '    <button id="mpClose" onclick="MediaPicker.close()" title="Close">×</button>',
      '  </div>',
      '  <div id="mpBody">',
      '    <div id="mpSidebar">',
      '      <div class="mp-sidebar-label">Folders</div>',
      '      <div id="mpFolderList"></div>',
      '    </div>',
      '    <div id="mpMain">',
      '      <div id="mpGrid">',
      '        <div id="mpGridInner"></div>',
      '        <div id="mpDragOverlay"><span>📂</span><p>Drop files to upload</p></div>',
      '      </div>',
      '      <div id="mpUploadArea">',
      '        <div id="mpDropZone">',
      '          <span>↑</span>',
      '          <div><strong>Drop files here</strong> or <label for="mpUploadInput" style="color:#6366f1;cursor:pointer;text-decoration:underline;">browse your computer</label></div>',
      '        </div>',
      '        <input type="file" id="mpUploadInput" multiple>',
      '        <div id="mpQueue"></div>',
      '      </div>',
      '    </div>',
      '  </div>',
      '  <div id="mpFooter">',
      '    <span id="mpCount">Loading…</span>',
      '    <button id="mpSelectBtn" onclick="MediaPicker._selectCurrent()">Use Selected ✓</button>',
      '  </div>',
      '</div>'
    ].join('\n');
    document.body.appendChild(overlay);

    // Close on backdrop click
    overlay.addEventListener('click', function (e) { if (e.target === overlay) MediaPicker.close(); });

    // Search
    document.getElementById('mpSearch').addEventListener('input', function (e) {
      _search = e.target.value; _load();
    });

    // File input
    document.getElementById('mpUploadInput').addEventListener('change', function (e) {
      _upload(Array.from(e.target.files)); e.target.value = '';
    });

    // Drop zone click
    document.getElementById('mpDropZone').addEventListener('click', function () {
      document.getElementById('mpUploadInput').click();
    });

    // Drop zone drag events
    var dz = document.getElementById('mpDropZone');
    dz.addEventListener('dragover', function (e) { e.preventDefault(); dz.classList.add('drag-over'); });
    dz.addEventListener('dragleave', function (e) { if (!dz.contains(e.relatedTarget)) dz.classList.remove('drag-over'); });
    dz.addEventListener('drop', function (e) {
      e.preventDefault(); dz.classList.remove('drag-over');
      var files = Array.from(e.dataTransfer.files || []);
      if (files.length) _upload(files);
    });

    // Grid drag-over overlay
    var grid = document.getElementById('mpGrid');
    var dragOverlay = document.getElementById('mpDragOverlay');
    var dragCounter = 0;
    grid.addEventListener('dragenter', function (e) {
      e.preventDefault(); dragCounter++;
      if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
        dragOverlay.classList.add('active');
      }
    });
    grid.addEventListener('dragleave', function () {
      dragCounter--; if (dragCounter <= 0) { dragCounter = 0; dragOverlay.classList.remove('active'); }
    });
    grid.addEventListener('dragover', function (e) { e.preventDefault(); });
    grid.addEventListener('drop', function (e) {
      e.preventDefault(); dragCounter = 0; dragOverlay.classList.remove('active');
      var files = Array.from(e.dataTransfer.files || []);
      if (files.length) _upload(files);
    });

    // Keyboard close
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.getElementById('mpOverlay').style.display !== 'none') MediaPicker.close();
    });
  }

  // ── Public API ────────────────────────────────────────────────────────────
  function open(callback, opts) {
    build();
    _cb          = callback;
    _opts        = opts || {};
    _multi       = !!_opts.multi;
    _folder      = '__all__';
    _search      = '';
    _uploadQueue = [];
    _selectedId  = null;
    _selectedIds = {};

    // Reset UI
    document.getElementById('mpOverlay').style.display = 'flex';
    document.getElementById('mpSearch').value = '';
    document.getElementById('mpQueue').innerHTML = '';
    document.getElementById('mpQueue').style.display = 'none';
    document.getElementById('mpSelectBtn').style.display = 'none';

    // Update title for multi-select mode
    var titleEl = document.getElementById('mpTitle');
    if (titleEl) {
      titleEl.textContent = _multi ? '📁 Select Images' : '📁 Media Library';
    }

    var accept = _opts.type === 'image'
      ? 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml,image/avif'
      : '*/*';
    document.getElementById('mpUploadInput').setAttribute('accept', accept);

    _load();
  }

  function close() {
    var ov = document.getElementById('mpOverlay');
    if (ov) ov.style.display = 'none';
    _cb = null; _selectedId = null; _selectedIds = {}; _multi = false;
  }

  // ── Selection ────────────────────────────────────────────────────────────
  function _selectCurrent() {
    if (!_cb) return;
    if (_multi) {
      var files = [];
      Object.keys(_selectedIds).forEach(function(id) {
        var f = _selectedIds[id];
        files.push({ url: f.url, name: f.original || f.name, id: f.id, isImage: f.isImage, mime_type: f.mime_type });
      });
      if (!files.length) return;
      var cb = _cb; close(); cb(files);
    } else {
      if (!_selectedId) return;
      var f = _files.find(function (x) { return x.id === _selectedId; });
      if (!f) return;
      var cb = _cb; close(); cb({ url: f.url, name: f.original || f.name, id: f.id, isImage: f.isImage, mime_type: f.mime_type });
    }
  }

  // ── Load files ────────────────────────────────────────────────────────────
  function _load() {
    var params = new URLSearchParams();
    if (_folder !== '__all__') params.set('folder', _folder);
    if (_opts.type === 'image') params.set('type', 'image');
    if (_search) params.set('q', _search);
    var countEl = document.getElementById('mpCount');
    if (countEl) countEl.textContent = 'Loading…';

    fetch('/api/media?' + params.toString())
      .then(function (r) { return r.json(); })
      .then(function (d) {
        _files = d.files || [];
        _renderSidebar(d.folders || []);
        _renderGrid();
        var el = document.getElementById('mpCount');
        if (el) {
          if (_multi) {
            var cnt = Object.keys(_selectedIds).length;
            el.textContent = _files.length + ' file' + (_files.length !== 1 ? 's' : '') +
              (cnt ? ' · ' + cnt + ' selected' : '');
          } else {
            el.textContent = _files.length + ' file' + (_files.length !== 1 ? 's' : '');
          }
        }
      })
      .catch(function () {
        var el = document.getElementById('mpCount'); if (el) el.textContent = 'Error loading files';
      });
  }

  // ── Render sidebar ────────────────────────────────────────────────────────
  function _renderSidebar(folders) {
    var fl = document.getElementById('mpFolderList');
    if (!fl) return;
    var all = [
      { id: '__all__', label: '🗂 All Files' },
      { id: '',        label: '📄 Uncategorized' }
    ];
    (folders || []).forEach(function (f) { all.push({ id: f.folder || f, label: '📁 ' + (f.folder || f) }); });

    fl.innerHTML = all.map(function (item) {
      return '<div class="mp-folder' + (_folder === item.id ? ' active' : '') + '" ' +
             'onclick="MediaPicker._setFolder(\'' + _esc(item.id) + '\',this)">' +
             _esc(item.label) + '</div>';
    }).join('');
  }

  // ── Render grid ───────────────────────────────────────────────────────────
  function _renderGrid() {
    var inner = document.getElementById('mpGridInner');
    if (!inner) return;

    if (!_files.length) {
      inner.innerHTML =
        '<div id="mpEmpty" style="grid-column:1/-1;text-align:center;padding:40px 16px;color:#9ca3af;">' +
        '<div style="font-size:36px;margin-bottom:10px;">📂</div>' +
        '<div style="font-size:14px;font-weight:600;color:#374151;margin-bottom:4px;">No files here</div>' +
        '<div style="font-size:12px;">Upload files using the drop zone below</div>' +
        '</div>';
      return;
    }

    inner.innerHTML = _files.map(function (f) {
      var isImg = f.isImage || (f.mime_type && f.mime_type.startsWith('image/'));
      var thumb = isImg
        ? '<img class="mp-thumb" src="' + _esc(f.url) + '" alt="" loading="lazy" onerror="this.className=\'mp-icon\';this.textContent=\'🖼\'">'
        : '<div class="mp-icon">' + _icon(f.mime_type, f.name) + '</div>';

      // Single vs multi select CSS
      var sel;
      if (_multi) {
        sel = _selectedIds[f.id] ? ' selected checked' : '';
      } else {
        sel = _selectedId === f.id ? ' selected' : '';
      }

      var ext = (f.name || '').split('.').pop().toUpperCase();
      return '<div class="mp-card' + sel + '" data-id="' + f.id + '" onclick="MediaPicker._pick(' + f.id + ')">' +
             '<div class="mp-check">✓</div>' +
             thumb +
             '<div class="mp-label" title="' + _esc(f.original || f.name) + '">' + _esc(f.original || f.name) + '</div>' +
             '<div class="mp-meta">' + ext + ' · ' + f.sizeLabel + '</div>' +
             '</div>';
    }).join('');
  }

  // ── Upload ────────────────────────────────────────────────────────────────
  function _upload(files) {
    if (!files || !files.length) return;
    var queue = document.getElementById('mpQueue');
    var folder = (_folder !== '__all__' && _folder !== '') ? _folder : '';

    var entries = files.map(function (file, i) {
      return { file: file, name: file.name, status: 'pending', pct: 0, id: Date.now() + i };
    });
    _uploadQueue = _uploadQueue.concat(entries);

    queue.style.display = 'flex';
    _renderQueue();

    var done = 0;
    entries.forEach(function (entry) {
      entry.status = 'uploading';
      _renderQueue();

      var xhr = new XMLHttpRequest();
      var url = '/api/media/upload' + (folder ? '?folder=' + encodeURIComponent(folder) : '');
      xhr.open('POST', url);

      xhr.upload.addEventListener('progress', function (e) {
        if (e.lengthComputable) {
          entry.pct = Math.round((e.loaded / e.total) * 100);
          _renderQueue();
        }
      });

      xhr.onload = function () {
        var d;
        try { d = JSON.parse(xhr.responseText); } catch (e) { d = { error: 'Parse error' }; }
        entry.pct = 100;
        entry.status = (xhr.status === 200 && d.ok) ? 'done' : 'error';
        if (d && d.error) entry.err = d.error;
        _renderQueue();
        done++;
        if (done === entries.length) {
          setTimeout(function () { _load(); }, 500);
        }
      };

      xhr.onerror = function () {
        entry.status = 'error'; entry.pct = 100; _renderQueue(); done++;
        if (done === entries.length) setTimeout(function () { _load(); }, 500);
      };

      var fd = new FormData();
      fd.append('file', entry.file);
      xhr.send(fd);
    });
  }

  function _renderQueue() {
    var queue = document.getElementById('mpQueue');
    if (!queue) return;
    queue.innerHTML = _uploadQueue.slice(-6).map(function (e) {
      var icon = e.status === 'done' ? '✓' : e.status === 'error' ? '✗' : '↑';
      var fillClass = e.status === 'done' ? 'done' : e.status === 'error' ? 'error' : '';
      return '<div class="mp-qitem">' +
             '<span class="mp-qstatus" style="color:' + (e.status === 'done' ? '#10b981' : e.status === 'error' ? '#dc2626' : '#6366f1') + ';">' + icon + '</span>' +
             '<span class="mp-qname" title="' + _esc(e.name) + '">' + _esc(e.name) + '</span>' +
             '<div class="mp-qbar"><div class="mp-qfill ' + fillClass + '" style="width:' + e.pct + '%"></div></div>' +
             '<span class="mp-qstatus" style="color:#9ca3af;min-width:30px;text-align:right;">' + e.pct + '%</span>' +
             '</div>';
    }).join('');
  }

  // ── Click to pick ─────────────────────────────────────────────────────────
  function _pick(id) {
    if (_multi) {
      // Toggle selection
      var f = _files.find(function (x) { return x.id === id; });
      if (!f) return;
      var card = document.querySelector('.mp-card[data-id="' + id + '"]');

      if (_selectedIds[id]) {
        delete _selectedIds[id];
        if (card) card.classList.remove('selected', 'checked');
      } else {
        _selectedIds[id] = f;
        if (card) card.classList.add('selected', 'checked');
      }

      var count = Object.keys(_selectedIds).length;
      var btn = document.getElementById('mpSelectBtn');
      if (btn) {
        if (count > 0) {
          btn.style.display = '';
          btn.textContent = 'Add ' + count + ' image' + (count !== 1 ? 's' : '') + ' ✓';
        } else {
          btn.style.display = 'none';
        }
      }

      var countEl = document.getElementById('mpCount');
      if (countEl) {
        countEl.textContent = _files.length + ' file' + (_files.length !== 1 ? 's' : '') +
          (count ? ' · ' + count + ' selected' : '');
      }
      return;
    }

    // Single-select mode
    _selectedId = id;

    document.querySelectorAll('.mp-card').forEach(function (c) { c.classList.remove('selected'); });
    var card = document.querySelector('.mp-card[data-id="' + id + '"]');
    if (card) card.classList.add('selected');

    // Double-click to confirm immediately
    if (_lastPickId === id && Date.now() - _lastPickTime < 350) {
      _selectCurrent();
      return;
    }
    _lastPickId = id;
    _lastPickTime = Date.now();

    var btn = document.getElementById('mpSelectBtn');
    if (btn) { btn.style.display = ''; btn.textContent = 'Use this file ✓'; }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function _setFolder(folder, el) {
    _folder = folder;
    document.querySelectorAll('.mp-folder').forEach(function (i) { i.classList.remove('active'); });
    if (el) el.classList.add('active');
    _load();
  }

  function _icon(mime, name) {
    if (!mime) {
      var ext = (name || '').split('.').pop().toLowerCase();
      if ('jpg jpeg png gif webp svg avif'.includes(ext)) return '🖼';
      if (ext === 'pdf') return '📄';
      if ('mp4 mov webm'.includes(ext)) return '🎬';
      if ('mp3 wav'.includes(ext)) return '🎵';
      if ('doc docx'.includes(ext)) return '📝';
      if ('xls xlsx csv'.includes(ext)) return '📊';
      if (ext === 'zip') return '📦';
      return '📎';
    }
    if (mime.startsWith('image/')) return '🖼';
    if (mime === 'application/pdf') return '📄';
    if (mime.startsWith('video/')) return '🎬';
    if (mime.startsWith('audio/')) return '🎵';
    if (mime.includes('word')) return '📝';
    if (mime.includes('sheet') || mime.includes('excel')) return '📊';
    return '📎';
  }

  function _esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  return { open: open, close: close, _pick: _pick, _setFolder: _setFolder, _selectCurrent: _selectCurrent };
})();
