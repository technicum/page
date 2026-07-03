(function () {
  var SITE_ID = window.PZ_CHAT_SITE_ID;
  if (!SITE_ID) return;

  var APP_URL = window.PZ_APP_URL || '';
  var sessionId = null;
  var token = null;
  var lastMsgId = 0;
  var pollTimer = null;
  var isOpen = false;
  var cfg = {};

  // ── Storage ──────────────────────────────────────────────────────────────────
  function saveSession() {
    try { sessionStorage.setItem('pz_chat_' + SITE_ID, JSON.stringify({ sessionId: sessionId, token: token, lastMsgId: lastMsgId })); } catch (e) {}
  }
  function loadSession() {
    try {
      var d = JSON.parse(sessionStorage.getItem('pz_chat_' + SITE_ID) || 'null');
      if (d) { sessionId = d.sessionId; token = d.token; lastMsgId = d.lastMsgId || 0; }
    } catch (e) {}
  }

  // ── Sound ────────────────────────────────────────────────────────────────────
  function playSound() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var o = ctx.createOscillator(); var g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.2, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  }

  // ── HTML helpers ─────────────────────────────────────────────────────────────
  function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function fmtTime(dt) {
    try { var d = new Date(dt); return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch(e) { return ''; }
  }

  // ── Styles ───────────────────────────────────────────────────────────────────
  var style = document.createElement('style');
  style.textContent = `
    #pz-chat-btn{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:#2563eb;color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(37,99,235,0.4);z-index:99998;transition:transform .2s,box-shadow .2s;font-size:24px;}
    #pz-chat-btn:hover{transform:scale(1.08);box-shadow:0 6px 20px rgba(37,99,235,0.5);}
    #pz-chat-badge{position:absolute;top:-3px;right:-3px;width:18px;height:18px;background:#ef4444;color:#fff;border-radius:50%;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid #fff;}
    #pz-chat-win{position:fixed;bottom:92px;right:24px;width:360px;max-height:520px;background:#fff;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,0.18);z-index:99999;display:flex;flex-direction:column;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;}
    #pz-chat-head{background:#2563eb;color:#fff;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
    #pz-chat-head-title{font-weight:700;font-size:15px;}
    #pz-chat-head-sub{font-size:12px;opacity:0.8;margin-top:2px;}
    #pz-chat-close{background:rgba(255,255,255,0.2);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;}
    #pz-prechat{padding:20px;flex:1;}
    #pz-prechat p{font-size:13px;color:#555;margin-bottom:16px;line-height:1.5;}
    .pz-field{margin-bottom:12px;}
    .pz-field label{display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:4px;}
    .pz-field input{width:100%;padding:9px 12px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box;}
    .pz-field input:focus{border-color:#2563eb;}
    #pz-start-btn{width:100%;padding:11px;background:#2563eb;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;margin-top:4px;transition:opacity .15s;}
    #pz-start-btn:hover{opacity:0.85;}
    #pz-messages{flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:8px;min-height:200px;}
    .pz-msg{display:flex;flex-direction:column;max-width:80%;}
    .pz-msg.vendor{align-self:flex-start;}
    .pz-msg.visitor{align-self:flex-end;align-items:flex-end;}
    .pz-bubble{padding:9px 13px;border-radius:14px;line-height:1.45;word-break:break-word;font-size:13px;}
    .pz-msg.vendor .pz-bubble{background:#f3f4f6;color:#111;}
    .pz-msg.visitor .pz-bubble{background:#2563eb;color:#fff;}
    .pz-time{font-size:10px;color:#9ca3af;margin-top:2px;padding:0 2px;}
    #pz-input-wrap{padding:10px 12px;border-top:1px solid #e5e7eb;display:flex;gap:8px;flex-shrink:0;}
    #pz-input{flex:1;padding:9px 12px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:13px;font-family:inherit;outline:none;resize:none;max-height:80px;}
    #pz-input:focus{border-color:#2563eb;}
    #pz-send{padding:9px 14px;background:#2563eb;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;flex-shrink:0;}
    #pz-send:hover{opacity:0.85;}
    #pz-closed-notice{padding:10px 16px;background:#fef2f2;color:#dc2626;font-size:12px;text-align:center;border-top:1px solid #fecaca;}
    @media(max-width:400px){#pz-chat-win{width:calc(100vw - 16px);right:8px;bottom:84px;}}
  `;
  document.head.appendChild(style);

  // ── Build UI ──────────────────────────────────────────────────────────────────
  function buildUI() {
    // Button
    var btn = document.createElement('button');
    btn.id = 'pz-chat-btn';
    btn.innerHTML = '💬';
    btn.title = 'Chat with us';
    btn.onclick = toggleWindow;
    document.body.appendChild(btn);

    // Window
    var win = document.createElement('div');
    win.id = 'pz-chat-win';
    win.style.display = 'none';
    win.innerHTML = `
      <div id="pz-chat-head">
        <div>
          <div id="pz-chat-head-title">Chat with us</div>
          <div id="pz-chat-head-sub">We usually reply in minutes</div>
        </div>
        <button id="pz-chat-close" onclick="document.getElementById('pz-chat-win').style.display='none';window.pzChatOpen=false;">✕</button>
      </div>
      <div id="pz-chat-body"></div>
    `;
    document.body.appendChild(win);
  }

  function showPreChat() {
    var body = document.getElementById('pz-chat-body');
    var fields = '';
    if (cfg.require_name)  fields += `<div class="pz-field"><label>Your name *</label><input id="pz-name" type="text" placeholder="e.g. Priya Sharma" required></div>`;
    if (cfg.require_email) fields += `<div class="pz-field"><label>Email *</label><input id="pz-email" type="email" placeholder="you@email.com" required></div>`;
    if (cfg.require_phone) fields += `<div class="pz-field"><label>Phone *</label><input id="pz-phone" type="tel" placeholder="+91 98765 43210" required></div>`;

    body.innerHTML = `
      <div id="pz-prechat">
        <p>${esc(cfg.welcome_message || 'Hi! How can we help you today?')}</p>
        ${fields}
        <button id="pz-start-btn" onclick="startChat()">Start Chat →</button>
      </div>
    `;
  }

  function showChat(messages) {
    var body = document.getElementById('pz-chat-body');
    body.innerHTML = `
      <div id="pz-messages"></div>
      <div id="pz-input-wrap">
        <textarea id="pz-input" placeholder="Type a message…" rows="1"></textarea>
        <button id="pz-send" onclick="visitorSend()">Send</button>
      </div>
    `;
    var inp = document.getElementById('pz-input');
    inp.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); visitorSend(); }
    });
    (messages || []).forEach(appendMsg);
    scrollMsgs();
    startPolling();
  }

  function appendMsg(m) {
    var wrap = document.getElementById('pz-messages');
    if (!wrap || document.getElementById('pzm-' + m.id)) return;
    var div = document.createElement('div');
    div.className = 'pz-msg ' + m.sender;
    div.id = 'pzm-' + m.id;
    div.innerHTML = '<div class="pz-bubble">' + esc(m.message) + '</div>'
                  + '<div class="pz-time">' + fmtTime(m.created_at) + '</div>';
    wrap.appendChild(div);
    if (m.id > lastMsgId) { lastMsgId = m.id; saveSession(); }
  }

  function scrollMsgs() {
    var w = document.getElementById('pz-messages');
    if (w) w.scrollTop = w.scrollHeight;
  }

  function toggleWindow() {
    var win = document.getElementById('pz-chat-win');
    if (!win) return;
    isOpen = !isOpen;
    win.style.display = isOpen ? 'flex' : 'none';
    win.style.flexDirection = 'column';
    if (isOpen) {
      removeBadge();
      if (!sessionId) showPreChat();
      else loadHistory();
    }
  }

  function removeBadge() {
    var b = document.getElementById('pz-chat-badge');
    if (b) b.remove();
  }

  function showBadge() {
    var btn = document.getElementById('pz-chat-btn');
    if (!btn || document.getElementById('pz-chat-badge')) return;
    var b = document.createElement('span');
    b.id = 'pz-chat-badge';
    b.textContent = '!';
    btn.style.position = 'fixed';
    btn.appendChild(b);
  }

  function startChat() {
    var name  = (document.getElementById('pz-name')  || {}).value || '';
    var email = (document.getElementById('pz-email') || {}).value || '';
    var phone = (document.getElementById('pz-phone') || {}).value || '';

    if (cfg.require_name  && !name.trim())  { alert('Please enter your name.');  return; }
    if (cfg.require_email && !email.trim()) { alert('Please enter your email.'); return; }
    if (cfg.require_phone && !phone.trim()) { alert('Please enter your phone.'); return; }

    var btn = document.getElementById('pz-start-btn');
    if (btn) btn.disabled = true;

    fetch(APP_URL + '/api/chat/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site_id: SITE_ID, visitor_name: name, visitor_email: email, visitor_phone: phone })
    })
    .then(function(r){ return r.json(); })
    .then(function(data) {
      if (data.ok) {
        sessionId = data.session_id;
        token     = data.token;
        lastMsgId = 0;
        saveSession();
        loadHistory();
      }
    });
  }

  function loadHistory() {
    fetch(APP_URL + '/api/chat/poll?session_id=' + sessionId + '&token=' + token + '&after=0')
    .then(function(r){ return r.json(); })
    .then(function(data) {
      if (!data.ok) { sessionId = null; token = null; showPreChat(); return; }
      showChat(data.messages);
      if (data.status === 'closed') showClosedNotice();
    });
  }

  function visitorSend() {
    var inp = document.getElementById('pz-input');
    var msg = inp ? inp.value.trim() : '';
    if (!msg) return;
    inp.value = '';

    // Optimistic UI
    appendMsg({ id: 'tmp-' + Date.now(), sender: 'visitor', message: msg, created_at: new Date().toISOString() });
    scrollMsgs();

    fetch(APP_URL + '/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, token: token, message: msg })
    }).catch(function(){});
  }

  function startPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(function() {
      if (!sessionId || !token) return;
      fetch(APP_URL + '/api/chat/poll?session_id=' + sessionId + '&token=' + token + '&after=' + lastMsgId)
      .then(function(r){ return r.json(); })
      .then(function(data) {
        if (!data.ok) return;
        if (data.messages && data.messages.length) {
          data.messages.forEach(function(m) {
            appendMsg(m);
            if (m.sender === 'vendor' && !isOpen) { showBadge(); playSound(); }
            else if (m.sender === 'vendor') playSound();
          });
          scrollMsgs();
        }
        if (data.status === 'closed') { clearInterval(pollTimer); showClosedNotice(); }
      }).catch(function(){});
    }, 3000);
  }

  function showClosedNotice() {
    var inputWrap = document.getElementById('pz-input-wrap');
    if (inputWrap) inputWrap.style.display = 'none';
    var body = document.getElementById('pz-chat-body');
    if (body) {
      var n = document.createElement('div');
      n.id = 'pz-closed-notice';
      n.textContent = 'This chat has been closed.';
      body.appendChild(n);
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────────
  fetch(APP_URL + '/api/chat/settings/' + SITE_ID)
  .then(function(r){ return r.json(); })
  .then(function(data) {
    if (!data.enabled) return;
    cfg = data;
    buildUI();
    loadSession();
    if (sessionId) {
      // Resume polling in background even if window is closed
      startPolling();
    }
  }).catch(function(){});
})();
