/**
 * MediaPicker — reusable file picker modal
 * Usage: MediaPicker.open(callback, { type: 'image' | 'all', folder: null })
 * callback receives: { url, name, id, isImage, mime_type }
 */
var MediaPicker = (function() {
  var _cb     = null;
  var _opts   = {};
  var _files  = [];
  var _folder = '__all__';
  var _search = '';
  var _ready  = false;

  // ── Build the modal DOM once ────────────────────────────────────────────────
  function buildModal() {
    if (document.getElementById('mpModal')) return;
    var style = document.createElement('style');
    style.textContent = [
      '#mpOverlay{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:10000;display:none;align-items:center;justify-content:center;}',
      '#mpModal{background:#fff;border-radius:14px;width:min(860px,95vw);height:min(580px,90vh);display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.25);overflow:hidden;}',
      '#mpHeader{display:flex;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid #e5e7eb;flex-shrink:0;}',
      '#mpHeader h3{margin:0;font-size:16px;font-weight:600;color:#111827;flex:1;}',
      '#mpSearch{padding:7px 12px;border:1px solid #e5e7eb;border-radius:8px;font-size:13px;width:180px;outline:none;}',
      '#mpSearch:focus{border-color:#6366f1;}',
      '#mpUploadBtn{padding:7px 14px;background:#111827;color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer;white-space:nowrap;}',
      '#mpClose{background:none;border:none;font-size:20px;cursor:pointer;color:#6b7280;padding:2px 6px;border-radius:6px;line-height:1;}',
      '#mpClose:hover{background:#f3f4f6;}',
      '#mpBody{display:flex;flex:1;overflow:hidden;}',
      '#mpSidebar{width:180px;border-right:1px solid #e5e7eb;overflow-y:auto;flex-shrink:0;padding:8px;}',
      '.mp-folder{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:7px;font-size:13px;color:#374151;cursor:pointer;white-space:nowrap;}',
      '.mp-folder:hover{background:#f3f4f6;}',
      '.mp-folder.active{background:#111827;color:#fff;}',
      '#mpGrid{flex:1;overflow-y:auto;padding:14px;}',
      '#mpGridInner{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px;}',
      '.mp-card{border:2px solid #e5e7eb;border-radius:8px;overflow:hidden;cursor:pointer;transition:border-color .12s;}',
      '.mp-card:hover{border-color:#6366f1;}',
      '.mp-thumb{width:100%;height:80px;object-fit:cover;display:block;background:#f3f4f6;}',
      '.mp-icon{width:100%;height:80px;display:flex;align-items:center;justify-content:center;font-size:26px;background:#f3f4f6;}',
      '.mp-label{padding:5px 7px;font-size:10px;color:#374151;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500;}',
      '#mpEmpty{text-align:center;padding:50px 20px;color:#9ca3af;}',
      '#mpEmpty div:first-child{font-size:32px;margin-bottom:10px;}',
      '#mpFooter{padding:10px 18px;border-top:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;font-size:12px;color:#6b7280;}',
      '#mpUploadInput{display:none;}'
    ].join('');
    document.head.appendChild(style);

    var overlay = document.createElement('div');
    overlay.id = 'mpOverlay';
    overlay.innerHTML = [
      '<div id="mpModal">',
      '  <div id="mpHeader">',
      '    <h3>📁 Media Library</h3>',
      '    <input id="mpSearch" type="search" placeholder="Search…">',
      '    <label id="mpUploadBtn">↑ Upload<input id="mpUploadInput" type="file" multiple></label>',
      '    <button id="mpClose" onclick="MediaPicker.close()">×</button>',
      '  </div>',
      '  <div id="mpBody">',
      '    <div id="mpSidebar" id="mpSidebar"></div>',
      '    <div id="mpGrid"><div id="mpGridInner"></div></div>',
      '  </div>',
      '  <div id="mpFooter"><span id="mpCount">Loading…</span><span id="mpUploadStatus"></span></div>',
      '</div>'
    ].join('');
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function(e) { if (e.target === overlay) MediaPicker.close(); });

    document.getElementById('mpSearch').addEventListener('input', function(e) {
      _search = e.target.value; mpLoad();
    });

    document.getElementById('mpUploadInput').addEventListener('change', function(e) {
      mpUpload(Array.from(e.target.files)); e.target.value = '';
    });

    _ready = true;
  }

  // ── Public API ──────────────────────────────────────────────────────────────
  function open(callback, opts) {
    _cb   = callback;
    _opts = opts || {};
    _folder = '__all__';
    _search = '';
    buildModal();
    document.getElementById('mpOverlay').style.display = 'flex';
    document.getElementById('mpSearch').value = '';
    if (_opts.type === 'image') {
      document.getElementById('mpUploadInput').accept = 'image/*';
    } else {
      document.getElementById('mpUploadInput').removeAttribute('accept');
    }
    mpLoad();
  }

  function close() {
    var ov = document.getElementById('mpOverlay');
    if (ov) ov.style.display = 'none';
    _cb = null;
  }

  // ── Load files ──────────────────────────────────────────────────────────────
  function mpLoad() {
    var params = new URLSearchParams();
    if (_folder !== '__all__') params.set('folder', _folder);
    if (_opts.type === 'image') params.set('type', 'image');
    if (_search) params.set('q', _search);

    fetch('/api/media?' + params.toString())
      .then(function(r) { return r.json(); })
      .then(function(d) {
        _files = d.files || [];
        mpRenderSidebar(d.folders || []);
        mpRenderGrid();
        var el = document.getElementById('mpCount');
        if (el) el.textContent = _files.length + ' file' + (_files.length !== 1 ? 's' : '');
      })
      .catch(function() {
        var el = document.getElementById('mpCount');
        if (el) el.textContent = 'Error loading files';
      });
  }

  function mpRenderSidebar(folders) {
    var sb = document.getElementById('mpSidebar');
    if (!sb) return;
    var html = '<div class="mp-folder' + (_folder === '__all__' ? ' active' : '') + '" onclick="MediaPicker._setFolder(\'__all__\', this)">🗂 All Files</div>';
    html += '<div class="mp-folder' + (_folder === '' ? ' active' : '') + '" onclick="MediaPicker._setFolder(\'\', this)">📄 Uncategorized</div>';
    (folders || []).forEach(function(f) {
      var name = f.folder || f;
      html += '<div class="mp-folder' + (_folder === name ? ' active' : '') + '" onclick="MediaPicker._setFolder(\'' + esc(name) + '\', this)">📁 ' + esc(name) + '</div>';
    });
    sb.innerHTML = html;
  }

  function mpRenderGrid() {
    var inner = document.getElementById('mpGridInner');
    if (!inner) return;
    if (!_files.length) {
      inner.parentElement.innerHTML = '<div id="mpEmpty"><div>📂</div><div>No files found</div></div>';
      return;
    }
    // Restore grid if it was replaced with empty state
    var grid = document.getElementById('mpGrid');
    if (!document.getElementById('mpGridInner')) {
      grid.innerHTML = '<div id="mpGridInner"></div>';
    }
    var target = document.getElementById('mpGridInner');
    var html = '';
    _files.forEach(function(f) {
      var isImg = f.isImage || (f.mime_type && f.mime_type.startsWith('image/'));
      var thumb = isImg
        ? '<img class="mp-thumb" src="' + f.url + '" alt="" loading="lazy">'
        : '<div class="mp-icon">' + getIcon(f.mime_type, f.name) + '</div>';
      html += '<div class="mp-card" onclick="MediaPicker._pick(' + f.id + ')">'
            + thumb
            + '<div class="mp-label">' + esc(f.original || f.name) + '</div>'
            + '</div>';
    });
    target.innerHTML = html;
  }

  function getIcon(mime, name) {
    if (!mime) {
      var ext = (name || '').split('.').pop().toLowerCase();
      if ('jpg jpeg png gif webp svg avif'.includes(ext)) return '🖼';
      if (ext === 'pdf') return '📄'; if ('mp4 mov webm'.includes(ext)) return '🎬';
      if ('mp3 wav'.includes(ext)) return '🎵'; if ('doc docx'.includes(ext)) return '📝';
      return '📎';
    }
    if (mime.startsWith('image/')) return '🖼'; if (mime === 'application/pdf') return '📄';
    if (mime.startsWith('video/')) return '🎬'; if (mime.startsWith('audio/')) return '🎵';
    if (mime.includes('word')) return '📝';
    return '📎';
  }

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  // ── Upload from picker ──────────────────────────────────────────────────────
  function mpUpload(files) {
    if (!files.length) return;
    var status = document.getElementById('mpUploadStatus');
    if (status) status.textContent = 'Uploading…';
    var folder = _folder !== '__all__' && _folder !== '' ? _folder : '';
    var done = 0; var failed = 0;
    files.forEach(function(file) {
      var fd = new FormData(); fd.append('file', file);
      var url = '/api/media/upload' + (folder ? '?folder=' + encodeURIComponent(folder) : '');
      fetch(url, { method:'POST', body:fd })
        .then(function(r) { return r.json(); })
        .then(function(d) {
          if (d.ok) done++; else failed++;
          if (done + failed === files.length) {
            if (status) status.textContent = done > 0 ? '✓ ' + done + ' uploaded' : '';
            setTimeout(function() { if (status) status.textContent = ''; }, 2500);
            mpLoad();
          }
        })
        .catch(function() {
          failed++;
          if (done + failed === files.length) { if (status) status.textContent = 'Upload failed'; mpLoad(); }
        });
    });
  }

  // ── Internal helpers exposed for inline onclick ─────────────────────────────
  function _pick(id) {
    var f = _files.find(function(x) { return x.id === id; });
    if (!f || !_cb) { close(); return; }
    var cb = _cb;
    close();
    cb({ url: f.url, name: f.original || f.name, id: f.id, isImage: f.isImage, mime_type: f.mime_type });
  }

  function _setFolder(folder, el) {
    _folder = folder;
    document.querySelectorAll('.mp-folder').forEach(function(i) { i.classList.remove('active'); });
    if (el) el.classList.add('active');
    mpLoad();
  }

  return { open: open, close: close, _pick: _pick, _setFolder: _setFolder };
})();
