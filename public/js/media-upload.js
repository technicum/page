/**
 * MediaUpload — Advanced upload panel widget
 *
 * Usage:
 *   MediaUpload.open({ folder, folders, onComplete })
 *   MediaUpload.addFiles(fileList)
 */
var MediaUpload = (function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────────────
  var _queue   = [];     // array of entry objects
  var _folder  = '';
  var _folders = [];
  var _onComplete = null;
  var _built   = false;
  var _nextId  = 1;
  var _autoUpload = true;
  var _dragCounter = 0;

  // ── CSS ───────────────────────────────────────────────────────────────────
  var CSS = '\
#muOverlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9000;display:none;align-items:flex-end;justify-content:center;backdrop-filter:blur(2px);}\
#muPanel{background:#fff;border-radius:20px 20px 0 0;width:100%;max-width:680px;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 -8px 40px rgba(0,0,0,.18);overflow:hidden;transform:translateY(100%);transition:transform .28s cubic-bezier(.4,0,.2,1);}\
#muOverlay.open #muPanel{transform:translateY(0);}\
/* Header */\
#muHead{display:flex;align-items:center;gap:10px;padding:16px 20px 12px;border-bottom:1px solid #f3f4f6;flex-shrink:0;}\
#muHead h3{margin:0;font-size:15px;font-weight:700;color:#111827;flex:1;}\
#muFolderSel{padding:5px 10px;border:1px solid #e5e7eb;border-radius:7px;font-size:12px;color:#374151;outline:none;cursor:pointer;background:#f9fafb;}\
#muClose{background:none;border:none;font-size:22px;cursor:pointer;color:#9ca3af;line-height:1;padding:2px 6px;border-radius:6px;}\
#muClose:hover{background:#f3f4f6;color:#374151;}\
/* Drop zone */\
#muDropZone{margin:0 20px 0;border:2px dashed #d1d5db;border-radius:12px;padding:28px 20px;text-align:center;cursor:pointer;transition:all .18s;background:#fafafa;flex-shrink:0;}\
#muDropZone:hover,#muDropZone.drag-over{border-color:#6366f1;background:#f5f3ff;}\
#muDropZone.drag-over .mu-dz-icon{animation:mu-bounce .4s ease infinite alternate;}\
@keyframes mu-bounce{from{transform:scale(1);}to{transform:scale(1.12);}}\
.mu-dz-icon{font-size:36px;margin-bottom:8px;transition:transform .15s;display:block;}\
.mu-dz-title{font-size:14px;font-weight:600;color:#374151;margin-bottom:4px;}\
.mu-dz-sub{font-size:12px;color:#9ca3af;}\
.mu-dz-sub b{color:#6366f1;cursor:pointer;}\
/* Toolbar */\
#muToolbar{display:flex;align-items:center;gap:8px;padding:10px 20px;flex-shrink:0;border-bottom:1px solid #f3f4f6;}\
#muQueueLabel{font-size:12px;font-weight:600;color:#374151;flex:1;}\
.mu-tb-btn{padding:5px 12px;border-radius:7px;border:1px solid #e5e7eb;background:#fff;font-size:12px;cursor:pointer;color:#374151;font-weight:500;transition:all .15s;white-space:nowrap;}\
.mu-tb-btn:hover{background:#f3f4f6;}\
.mu-tb-btn.primary{background:#111827;color:#fff;border-color:#111827;}\
.mu-tb-btn.primary:hover{background:#1f2937;}\
.mu-tb-btn:disabled{opacity:.4;cursor:not-allowed;}\
/* Queue */\
#muQueue{flex:1;overflow-y:auto;padding:10px 20px;display:flex;flex-direction:column;gap:8px;min-height:0;}\
/* Queue item */\
.mu-item{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:10px;background:#f9fafb;border:1px solid #f3f4f6;transition:border-color .15s;}\
.mu-item.uploading{border-color:#6366f1;background:#fafafe;}\
.mu-item.done{border-color:#d1fae5;background:#f0fdf4;}\
.mu-item.error{border-color:#fecaca;background:#fef2f2;}\
.mu-thumb{width:40px;height:40px;border-radius:7px;overflow:hidden;background:#e5e7eb;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;}\
.mu-thumb img{width:100%;height:100%;object-fit:cover;display:block;}\
.mu-info{flex:1;min-width:0;}\
.mu-name{font-size:13px;font-weight:500;color:#111827;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}\
.mu-size{font-size:11px;color:#9ca3af;margin-top:1px;}\
.mu-bar-wrap{margin-top:5px;height:4px;background:#e5e7eb;border-radius:2px;overflow:hidden;}\
.mu-bar-fill{height:100%;border-radius:2px;transition:width .15s;}\
.mu-bar-fill.prog{background:#6366f1;}\
.mu-bar-fill.done{background:#10b981;}\
.mu-bar-fill.error{background:#dc2626;}\
.mu-status{font-size:11px;margin-top:3px;}\
.mu-status.prog{color:#6366f1;}\
.mu-status.done{color:#10b981;}\
.mu-status.error{color:#dc2626;}\
.mu-actions{display:flex;gap:5px;flex-shrink:0;}\
.mu-act-btn{width:26px;height:26px;border-radius:6px;border:1px solid #e5e7eb;background:#fff;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;transition:all .12s;}\
.mu-act-btn:hover{background:#f3f4f6;}\
.mu-act-btn.danger:hover{background:#fef2f2;border-color:#fecaca;color:#dc2626;}\
.mu-act-btn.retry:hover{background:#f0fdf4;border-color:#d1fae5;color:#10b981;}\
/* Footer */\
#muFooter{display:flex;align-items:center;gap:12px;padding:12px 20px;border-top:1px solid #f3f4f6;flex-shrink:0;}\
#muTotalBar{flex:1;height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden;}\
#muTotalFill{height:100%;background:#6366f1;border-radius:3px;transition:width .25s;}\
#muTotalLabel{font-size:12px;color:#6b7280;white-space:nowrap;min-width:80px;text-align:right;}\
/* Clipboard banner */\
#muPasteBanner{display:none;background:#eef2ff;border-radius:8px;padding:7px 12px;font-size:12px;color:#6366f1;text-align:center;margin:0 20px 8px;flex-shrink:0;}\
';

  // ── Build DOM ─────────────────────────────────────────────────────────────
  function _build() {
    if (_built) return;
    _built = true;

    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    var overlay = document.createElement('div');
    overlay.id = 'muOverlay';
    overlay.innerHTML = [
      '<div id="muPanel">',

      '  <div id="muHead">',
      '    <h3>↑ Upload Files</h3>',
      '    <label style="font-size:12px;color:#6b7280;font-weight:500;">To:</label>',
      '    <select id="muFolderSel" onchange="MediaUpload._setFolder(this.value)">',
      '      <option value="">Uncategorized</option>',
      '    </select>',
      '    <button class="mu-tb-btn" id="muAutoToggle" onclick="MediaUpload._toggleAuto()" title="Toggle auto-upload">Auto ✓</button>',
      '    <button id="muClose" onclick="MediaUpload.close()">×</button>',
      '  </div>',

      '  <div id="muDropZone" onclick="document.getElementById(\'muFileInput\').click()">',
      '    <span class="mu-dz-icon">📂</span>',
      '    <div class="mu-dz-title">Drop files here to upload</div>',
      '    <div class="mu-dz-sub">or <b onclick="event.stopPropagation();document.getElementById(\'muFileInput\').click()">browse your computer</b> — images, PDFs, videos, docs • max 20 MB each</div>',
      '    <input type="file" id="muFileInput" multiple style="display:none">',
      '  </div>',

      '  <div id="muPasteBanner">📋 Image pasted from clipboard — added to queue</div>',

      '  <div id="muToolbar" style="display:none;">',
      '    <span id="muQueueLabel">0 files</span>',
      '    <button class="mu-tb-btn" onclick="MediaUpload._clearDone()">Clear done</button>',
      '    <button class="mu-tb-btn" onclick="MediaUpload._removeAll()">Remove all</button>',
      '    <button class="mu-tb-btn primary" id="muUploadAllBtn" onclick="MediaUpload._uploadAll()">↑ Upload all</button>',
      '  </div>',

      '  <div id="muQueue"></div>',

      '  <div id="muFooter">',
      '    <div id="muTotalBar"><div id="muTotalFill" style="width:0%"></div></div>',
      '    <span id="muTotalLabel">Ready</span>',
      '  </div>',

      '</div>'
    ].join('\n');
    document.body.appendChild(overlay);

    // Backdrop close
    overlay.addEventListener('click', function (e) { if (e.target === overlay) MediaUpload.close(); });

    // File input
    document.getElementById('muFileInput').addEventListener('change', function (e) {
      _addFiles(Array.from(e.target.files));
      e.target.value = '';
    });

    // Drop zone events
    var dz = document.getElementById('muDropZone');
    dz.addEventListener('dragover', function (e) { e.preventDefault(); dz.classList.add('drag-over'); });
    dz.addEventListener('dragleave', function (e) { if (!dz.contains(e.relatedTarget)) dz.classList.remove('drag-over'); });
    dz.addEventListener('drop', function (e) {
      e.preventDefault(); dz.classList.remove('drag-over');
      var files = Array.from(e.dataTransfer.files || []);
      if (files.length) _addFiles(files);
    });

    // Global drag-into-panel
    var panel = document.getElementById('muPanel');
    panel.addEventListener('dragover', function (e) { e.preventDefault(); });
    panel.addEventListener('drop', function (e) {
      e.preventDefault();
      var files = Array.from(e.dataTransfer.files || []);
      if (files.length) _addFiles(files);
    });

    // Clipboard paste (Ctrl+V image)
    document.addEventListener('paste', _handlePaste);

    // ESC to close
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.getElementById('muOverlay').classList.contains('open')) {
        MediaUpload.close();
      }
    });
  }

  // ── Paste handler ─────────────────────────────────────────────────────────
  function _handlePaste(e) {
    if (!document.getElementById('muOverlay') || !document.getElementById('muOverlay').classList.contains('open')) return;
    var items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    var imageFiles = [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        var f = items[i].getAsFile();
        if (f) imageFiles.push(f);
      }
    }
    if (imageFiles.length) {
      e.preventDefault();
      _addFiles(imageFiles);
      var banner = document.getElementById('muPasteBanner');
      if (banner) {
        banner.style.display = '';
        setTimeout(function () { banner.style.display = 'none'; }, 2500);
      }
    }
  }

  // ── Add files to queue ────────────────────────────────────────────────────
  var MAX_SIZE = 20 * 1024 * 1024;

  function _addFiles(files) {
    var added = 0;
    files.forEach(function (file) {
      // Validation
      if (file.size > MAX_SIZE) {
        _showToast('⚠ ' + file.name + ' exceeds 20 MB limit', 'error');
        return;
      }
      var entry = {
        id:      _nextId++,
        file:    file,
        name:    file.name,
        size:    file.size,
        sizeLabel: _sizeLabel(file.size),
        mime:    file.type,
        isImage: file.type.startsWith('image/'),
        status:  'pending',  // pending | uploading | done | error | cancelled
        pct:     0,
        preview: null,
        xhr:     null,
        error:   null,
        uploadedUrl: null
      };
      _queue.push(entry);
      added++;

      // Generate local preview for images
      if (entry.isImage) {
        var reader = new FileReader();
        reader.onload = (function (ent) {
          return function (e) {
            ent.preview = e.target.result;
            _renderItem(ent);
          };
        })(entry);
        reader.readAsDataURL(file);
      }
    });

    if (added) {
      _renderQueue();
      if (_autoUpload) _uploadAll();
    }
  }

  // ── Upload all pending ────────────────────────────────────────────────────
  function _uploadAll() {
    var pending = _queue.filter(function (e) { return e.status === 'pending'; });
    pending.forEach(function (entry) { _uploadFile(entry); });
    _updateToolbar();
    _updateTotals();
  }

  function _uploadFile(entry) {
    if (entry.status === 'uploading' || entry.status === 'done') return;
    entry.status = 'uploading';
    entry.pct = 0;
    _renderItem(entry);

    var xhr = new XMLHttpRequest();
    entry.xhr = xhr;

    var url = '/api/media/upload' + (_folder ? '?folder=' + encodeURIComponent(_folder) : '');
    xhr.open('POST', url);

    xhr.upload.addEventListener('progress', function (e) {
      if (e.lengthComputable) {
        entry.pct = Math.round(e.loaded / e.total * 95);  // cap at 95 until response
        _renderItem(entry);
        _updateTotals();
      }
    });

    xhr.onload = function () {
      var d; try { d = JSON.parse(xhr.responseText); } catch (e) { d = {}; }
      if (xhr.status === 200 && d.ok) {
        entry.status = 'done';
        entry.pct    = 100;
        entry.uploadedUrl = d.url;
      } else {
        entry.status = 'error';
        entry.pct    = 100;
        entry.error  = (d && d.error) || ('HTTP ' + xhr.status);
      }
      entry.xhr = null;
      _renderItem(entry);
      _updateTotals();
      _checkAllDone();
    };

    xhr.onerror = function () {
      entry.status = 'error';
      entry.pct    = 100;
      entry.error  = 'Network error';
      entry.xhr    = null;
      _renderItem(entry);
      _updateTotals();
    };

    xhr.onabort = function () {
      entry.status = 'cancelled';
      entry.pct    = 0;
      entry.xhr    = null;
      _renderItem(entry);
      _updateTotals();
    };

    var fd = new FormData();
    fd.append('file', entry.file);
    xhr.send(fd);
  }

  function _checkAllDone() {
    var active = _queue.filter(function (e) { return e.status === 'uploading'; });
    if (active.length === 0 && _onComplete) {
      setTimeout(function () { _onComplete(); }, 300);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  function _renderQueue() {
    var container = document.getElementById('muQueue');
    if (!container) return;

    if (!_queue.length) {
      container.innerHTML = '';
      _updateToolbar();
      return;
    }

    // Full re-render (simple and reliable for small queues)
    container.innerHTML = '';
    _queue.forEach(function (entry) {
      var el = _makeItemEl(entry);
      container.appendChild(el);
    });

    _updateToolbar();
    _updateTotals();
  }

  function _renderItem(entry) {
    var el = document.getElementById('mu-item-' + entry.id);
    if (!el) return;
    var newEl = _makeItemEl(entry);
    el.parentNode.replaceChild(newEl, el);
  }

  function _makeItemEl(entry) {
    var div = document.createElement('div');
    div.id = 'mu-item-' + entry.id;
    div.className = 'mu-item ' + (entry.status === 'uploading' ? 'uploading' : entry.status === 'done' ? 'done' : entry.status === 'error' ? 'error' : '');

    // Thumb
    var thumbDiv = document.createElement('div');
    thumbDiv.className = 'mu-thumb';
    if (entry.preview) {
      var img = document.createElement('img');
      img.src = entry.preview;
      thumbDiv.appendChild(img);
    } else {
      thumbDiv.textContent = _fileIcon(entry.mime, entry.name);
    }

    // Info
    var infoDiv = document.createElement('div');
    infoDiv.className = 'mu-info';

    var nameDiv = document.createElement('div');
    nameDiv.className = 'mu-name';
    nameDiv.title = entry.name;
    nameDiv.textContent = entry.name;

    var sizeDiv = document.createElement('div');
    sizeDiv.className = 'mu-size';

    // Status text
    var statusText;
    var statusClass;
    if (entry.status === 'done') {
      statusText  = '✓ Uploaded';
      statusClass = 'done';
    } else if (entry.status === 'error') {
      statusText  = '✗ ' + (entry.error || 'Failed');
      statusClass = 'error';
    } else if (entry.status === 'uploading') {
      statusText  = '↑ ' + entry.pct + '%';
      statusClass = 'prog';
    } else if (entry.status === 'cancelled') {
      statusText  = '— Cancelled';
      statusClass = '';
    } else {
      statusText  = 'Pending';
      statusClass = '';
    }
    sizeDiv.textContent = entry.sizeLabel;

    // Progress bar
    var barWrap = document.createElement('div');
    barWrap.className = 'mu-bar-wrap';
    var barFill = document.createElement('div');
    barFill.className = 'mu-bar-fill ' +
      (entry.status === 'done' ? 'done' : entry.status === 'error' ? 'error' : 'prog');
    barFill.style.width = entry.pct + '%';
    barWrap.appendChild(barFill);

    var statusEl = document.createElement('div');
    statusEl.className = 'mu-status ' + statusClass;
    statusEl.textContent = statusText;

    infoDiv.appendChild(nameDiv);
    infoDiv.appendChild(sizeDiv);
    if (entry.status !== 'pending') infoDiv.appendChild(barWrap);
    infoDiv.appendChild(statusEl);

    // Actions
    var actionsDiv = document.createElement('div');
    actionsDiv.className = 'mu-actions';

    if (entry.status === 'uploading') {
      // Cancel button
      var cancelBtn = document.createElement('button');
      cancelBtn.className = 'mu-act-btn danger';
      cancelBtn.title = 'Cancel upload';
      cancelBtn.textContent = '✕';
      (function (ent) {
        cancelBtn.onclick = function () { MediaUpload._cancel(ent.id); };
      })(entry);
      actionsDiv.appendChild(cancelBtn);
    } else if (entry.status === 'error' || entry.status === 'cancelled') {
      // Retry button
      var retryBtn = document.createElement('button');
      retryBtn.className = 'mu-act-btn retry';
      retryBtn.title = 'Retry upload';
      retryBtn.textContent = '↺';
      (function (ent) {
        retryBtn.onclick = function () { MediaUpload._retry(ent.id); };
      })(entry);
      actionsDiv.appendChild(retryBtn);
      // Remove button
      var rmBtn = document.createElement('button');
      rmBtn.className = 'mu-act-btn danger';
      rmBtn.title = 'Remove';
      rmBtn.textContent = '✕';
      (function (ent) {
        rmBtn.onclick = function () { MediaUpload._remove(ent.id); };
      })(entry);
      actionsDiv.appendChild(rmBtn);
    } else if (entry.status === 'pending') {
      // Upload now button
      var upBtn = document.createElement('button');
      upBtn.className = 'mu-act-btn';
      upBtn.title = 'Upload now';
      upBtn.textContent = '↑';
      (function (ent) {
        upBtn.onclick = function () { _uploadFile(ent); };
      })(entry);
      actionsDiv.appendChild(upBtn);
      // Remove button
      var rmBtn2 = document.createElement('button');
      rmBtn2.className = 'mu-act-btn danger';
      rmBtn2.title = 'Remove';
      rmBtn2.textContent = '✕';
      (function (ent) {
        rmBtn2.onclick = function () { MediaUpload._remove(ent.id); };
      })(entry);
      actionsDiv.appendChild(rmBtn2);
    } else if (entry.status === 'done') {
      // Copy URL button
      if (entry.uploadedUrl) {
        var copyBtn = document.createElement('button');
        copyBtn.className = 'mu-act-btn';
        copyBtn.title = 'Copy URL';
        copyBtn.textContent = '🔗';
        (function (url) {
          copyBtn.onclick = function () {
            var full = location.origin + url;
            if (navigator.clipboard) navigator.clipboard.writeText(full);
            else { var ta = document.createElement('textarea'); ta.value = full; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); }
            _showToast('✓ URL copied');
          };
        })(entry.uploadedUrl);
        actionsDiv.appendChild(copyBtn);
      }
      // Dismiss done
      var dmBtn = document.createElement('button');
      dmBtn.className = 'mu-act-btn';
      dmBtn.title = 'Dismiss';
      dmBtn.textContent = '✕';
      (function (ent) { dmBtn.onclick = function () { MediaUpload._remove(ent.id); }; })(entry);
      actionsDiv.appendChild(dmBtn);
    }

    div.appendChild(thumbDiv);
    div.appendChild(infoDiv);
    div.appendChild(actionsDiv);
    return div;
  }

  // ── Toolbar + totals ──────────────────────────────────────────────────────
  function _updateToolbar() {
    var tb = document.getElementById('muToolbar');
    var label = document.getElementById('muQueueLabel');
    var uploadAllBtn = document.getElementById('muUploadAllBtn');
    if (!tb) return;

    if (!_queue.length) {
      tb.style.display = 'none';
      return;
    }
    tb.style.display = 'flex';

    var total   = _queue.length;
    var done    = _queue.filter(function (e) { return e.status === 'done'; }).length;
    var pending = _queue.filter(function (e) { return e.status === 'pending'; }).length;
    var errored = _queue.filter(function (e) { return e.status === 'error'; }).length;

    if (label) label.textContent = total + ' file' + (total !== 1 ? 's' : '') + ' — ' + done + ' done' + (errored ? ', ' + errored + ' failed' : '');
    if (uploadAllBtn) uploadAllBtn.disabled = pending === 0;
  }

  function _updateTotals() {
    var totalFill  = document.getElementById('muTotalFill');
    var totalLabel = document.getElementById('muTotalLabel');
    if (!totalFill || !totalLabel) return;

    if (!_queue.length) {
      totalFill.style.width = '0%';
      totalLabel.textContent = 'Ready';
      return;
    }

    var sumPct  = _queue.reduce(function (a, e) { return a + e.pct; }, 0);
    var avgPct  = Math.round(sumPct / _queue.length);
    var uploading = _queue.filter(function (e) { return e.status === 'uploading'; }).length;
    var done      = _queue.filter(function (e) { return e.status === 'done'; }).length;
    var errored   = _queue.filter(function (e) { return e.status === 'error'; }).length;

    totalFill.style.width = avgPct + '%';
    totalFill.style.background = errored > 0 && uploading === 0 ? '#f59e0b' : '#6366f1';

    if (uploading > 0) {
      totalLabel.textContent = 'Uploading… ' + avgPct + '%';
    } else if (done === _queue.length) {
      totalFill.style.background = '#10b981';
      totalLabel.textContent = '✓ All done!';
    } else if (errored > 0) {
      totalLabel.textContent = errored + ' failed';
    } else {
      totalLabel.textContent = _queue.length + ' ready';
    }
  }

  // ── Public actions ────────────────────────────────────────────────────────
  function _cancel(id) {
    var entry = _queue.find(function (e) { return e.id === id; });
    if (!entry) return;
    if (entry.xhr) { entry.xhr.abort(); }
    else { entry.status = 'cancelled'; entry.pct = 0; _renderItem(entry); _updateTotals(); }
  }

  function _retry(id) {
    var entry = _queue.find(function (e) { return e.id === id; });
    if (!entry) return;
    entry.status = 'pending'; entry.pct = 0; entry.error = null;
    _renderItem(entry);
    _updateTotals();
    _uploadFile(entry);
  }

  function _remove(id) {
    var entry = _queue.find(function (e) { return e.id === id; });
    if (entry && entry.xhr) entry.xhr.abort();
    _queue = _queue.filter(function (e) { return e.id !== id; });
    var el = document.getElementById('mu-item-' + id);
    if (el) el.remove();
    _updateToolbar();
    _updateTotals();
  }

  function _clearDone() {
    var doneIds = _queue.filter(function (e) { return e.status === 'done'; }).map(function (e) { return e.id; });
    doneIds.forEach(function (id) {
      _queue = _queue.filter(function (e) { return e.id !== id; });
      var el = document.getElementById('mu-item-' + id);
      if (el) el.remove();
    });
    _updateToolbar();
    _updateTotals();
  }

  function _removeAll() {
    _queue.forEach(function (e) { if (e.xhr) e.xhr.abort(); });
    _queue = [];
    var container = document.getElementById('muQueue');
    if (container) container.innerHTML = '';
    _updateToolbar();
    _updateTotals();
  }

  function _setFolder(val) {
    _folder = val;
  }

  function _toggleAuto() {
    _autoUpload = !_autoUpload;
    var btn = document.getElementById('muAutoToggle');
    if (btn) btn.textContent = 'Auto ' + (_autoUpload ? '✓' : '○');
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function _sizeLabel(bytes) {
    if (!bytes) return '0 B';
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    if (bytes >= 1024) return Math.round(bytes / 1024) + ' KB';
    return bytes + ' B';
  }

  function _fileIcon(mime, name) {
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

  var _toastTimer = null;
  function _showToast(msg, type) {
    var t = document.getElementById('mlToast') || document.getElementById('mpToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'muToast';
      t.style.cssText = 'position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:#111827;color:#fff;padding:9px 18px;border-radius:24px;font-size:12px;font-weight:500;opacity:0;transition:opacity .2s;pointer-events:none;z-index:99999;white-space:nowrap;';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.background = type === 'error' ? '#dc2626' : '#111827';
    t.style.opacity = '1';
    if (_toastTimer) clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function () { t.style.opacity = '0'; }, 2400);
  }

  // ── Public API ────────────────────────────────────────────────────────────
  function open(opts) {
    _build();
    opts = opts || {};
    _folder     = opts.folder  || '';
    _folders    = opts.folders || [];
    _onComplete = opts.onComplete || null;
    _autoUpload = true;

    // Populate folder selector
    var sel = document.getElementById('muFolderSel');
    if (sel) {
      sel.innerHTML = '<option value="">Uncategorized</option>';
      (_folders || []).forEach(function (f) {
        var opt = document.createElement('option');
        opt.value = f; opt.textContent = f;
        if (f === _folder) opt.selected = true;
        sel.appendChild(opt);
      });
      sel.value = _folder;
    }

    // Clear old queue
    _removeAll();

    // Open with animation
    var ov = document.getElementById('muOverlay');
    ov.style.display = 'flex';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { ov.classList.add('open'); });
    });
  }

  function close() {
    var ov = document.getElementById('muOverlay');
    if (!ov) return;
    ov.classList.remove('open');
    setTimeout(function () { ov.style.display = 'none'; }, 300);
  }

  function addFiles(files) {
    _build();
    _addFiles(Array.from(files));
  }

  return {
    open:         open,
    close:        close,
    addFiles:     addFiles,
    _cancel:      _cancel,
    _retry:       _retry,
    _remove:      _remove,
    _clearDone:   _clearDone,
    _removeAll:   _removeAll,
    _setFolder:   _setFolder,
    _toggleAuto:  _toggleAuto,
    _uploadAll:   _uploadAll
  };
})();
