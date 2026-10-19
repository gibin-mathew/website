/* Shared helpers for the gibin.in tools: CSV, file input, tables, downloads, the matching worker.
   Everything runs in the browser. Nothing you paste or upload is sent anywhere. */
(function () {
  'use strict';
  var d = document;
  var T = window.T = {};

  T.$ = function (s, r) { return (r || d).querySelector(s); };
  T.$$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  T.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var NF = new Intl.NumberFormat('en-US');
  T.n = function (x) { return NF.format(x); };
  T.bytes = function (b) { return b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB'; };
  T.plural = function (n, one, many) { return T.n(n) + ' ' + (n === 1 ? one : (many || one + 's')); };
  T.later = function (fn) { return new Promise(function (res) { requestAnimationFrame(function () { setTimeout(function () { res(fn()); }, 0); }); }); };

  /* ---------- CSV ---------- */
  function detectDelimiter(text) {
    var sample = text.slice(0, 20000), lines = [], cur = '', q = false;
    for (var i = 0; i < sample.length && lines.length < 25; i++) {
      var c = sample[i];
      if (c === '"') q = !q;
      if (!q && (c === '\n' || c === '\r')) { if (cur) lines.push(cur); cur = ''; continue; }
      if (!q) cur += c; else cur += ' ';
    }
    if (cur && lines.length < 25) lines.push(cur);
    var best = ',', bestScore = -1;
    [',', '\t', ';', '|'].forEach(function (dl) {
      var counts = lines.map(function (l) { return l.split(dl).length - 1; });
      if (!counts.length || !counts[0]) return;
      var same = counts.filter(function (c) { return c === counts[0]; }).length / counts.length;
      var sc = same * 10 + Math.min(counts[0], 50) / 50;
      if (sc > bestScore) { bestScore = sc; best = dl; }
    });
    return best;
  }

  T.parseCSV = function (text, delimiter) {
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    var dl = delimiter || detectDelimiter(text);
    var rows = [], row = [], field = '', i = 0, n = text.length, q = false, unclosed = false;
    while (i < n) {
      var c = text[i];
      if (q) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
          q = false; i++; continue;
        }
        field += c; i++; continue;
      }
      if (c === '"' && field === '') { q = true; i++; continue; }
      if (c === dl) { row.push(field); field = ''; i++; continue; }
      if (c === '\r' || c === '\n') {
        row.push(field); rows.push(row); row = []; field = '';
        if (c === '\r' && text[i + 1] === '\n') i++;
        i++; continue;
      }
      field += c; i++;
    }
    if (q) unclosed = true;
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    // drop fully empty trailing rows
    while (rows.length && rows[rows.length - 1].every(function (v) { return v === ''; })) rows.pop();
    return { rows: rows, delimiter: dl, unclosed: unclosed };
  };

  function csvCell(v, dl) {
    v = v == null ? '' : String(v);
    if (v.indexOf('"') >= 0 || v.indexOf(dl) >= 0 || v.indexOf('\n') >= 0 || v.indexOf('\r') >= 0 || /^\s|\s$/.test(v)) return '"' + v.replace(/"/g, '""') + '"';
    return v;
  }
  T.toCSV = function (headers, rows, dl) {
    dl = dl || ',';
    var out = [];
    if (headers) out.push(headers.map(function (h) { return csvCell(h, dl); }).join(dl));
    for (var i = 0; i < rows.length; i++) out.push(rows[i].map(function (v) { return csvCell(v, dl); }).join(dl));
    return out.join('\r\n') + '\r\n';
  };

  // rows -> {headers, rows}, padding short rows and naming blank or duplicate headers
  T.table = function (rows, hasHeader) {
    var width = 0;
    rows.forEach(function (r) { if (r.length > width) width = r.length; });
    var headers, body;
    if (hasHeader && rows.length) {
      headers = rows[0].slice();
      body = rows.slice(1);
    } else {
      headers = [];
      body = rows;
    }
    var seen = {};
    for (var c = 0; c < width; c++) {
      var h = (headers[c] || '').trim() || 'Column ' + (c + 1);
      var base = h, k = 2;
      while (seen[h.toLowerCase()]) h = base + ' (' + (k++) + ')';
      seen[h.toLowerCase()] = 1;
      headers[c] = h;
    }
    for (var r = 0; r < body.length; r++) while (body[r].length < width) body[r].push('');
    return { headers: headers, rows: body };
  };

  /* ---------- where does this JSON break? (browsers word JSON.parse errors differently) ---------- */
  T.jsonError = function (t) {
    var i = 0, n = t.length, why = '';
    function ws() { while (i < n && /[ \t\r\n]/.test(t[i])) i++; }
    function fail(m) { why = m; throw 0; }
    function str() {
      i++;
      while (i < n) {
        var c = t[i];
        if (c === '"') { i++; return; }
        if (c === '\\') { var e = t[i + 1]; if ('"\\/bfnrt'.indexOf(e) >= 0) { i += 2; continue; } if (e === 'u' && /^[0-9a-fA-F]{4}$/.test(t.substr(i + 2, 4))) { i += 6; continue; } fail('bad escape sequence'); }
        if (c < ' ') fail(c === '\n' ? 'line break inside a string (a quote is probably missing)' : 'control character inside a string');
        i++;
      }
      fail('a string is never closed');
    }
    function val() {
      ws();
      var c = t[i];
      if (c === '{') {
        i++; ws(); if (t[i] === '}') { i++; return; }
        for (;;) { ws(); if (t[i] !== '"') fail(t[i] === '}' ? 'trailing comma before }' : 'expected a "quoted" key'); str(); ws(); if (t[i] !== ':') fail('expected : after the key'); i++; val(); ws();
          if (t[i] === ',') { i++; continue; } if (t[i] === '}') { i++; return; } fail('expected , or }'); }
      }
      if (c === '[') {
        i++; ws(); if (t[i] === ']') { i++; return; }
        for (;;) { ws(); if (t[i] === ']') fail('trailing comma before ]'); val(); ws(); if (t[i] === ',') { i++; continue; } if (t[i] === ']') { i++; return; } fail('expected , or ]'); }
      }
      if (c === '"') return str();
      var m = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(t.slice(i, i + 400));
      if (m && m[0]) { i += m[0].length; return; }
      if (t.substr(i, 4) === 'true' || t.substr(i, 4) === 'null') { i += 4; return; }
      if (t.substr(i, 5) === 'false') { i += 5; return; }
      if (c === "'") fail('single quotes; JSON needs double quotes');
      fail(i >= n ? 'the text ends too early' : 'unexpected "' + c + '"');
    }
    try { val(); ws(); if (i < n) fail('extra text after the end of the JSON'); return null; }
    catch (e) {
      if (e !== 0) throw e;
      var before = t.slice(0, i), line = before.split('\n').length, col = i - before.lastIndexOf('\n');
      return { pos: i, line: line, col: col, why: why };
    }
  };

  /* ---------- files ---------- */
  T.readFile = function (file) {
    return file.arrayBuffer().then(function (buf) {
      try { return new TextDecoder('utf-8', { fatal: true }).decode(buf); }
      catch (e) { return new TextDecoder('windows-1252').decode(buf); }
    });
  };

  T.download = function (name, text, mime) {
    var bom = /csv|tab-separated/.test(mime || '') ? '﻿' : '';
    var blob = new Blob([bom + text], { type: (mime || 'text/plain') + ';charset=utf-8' });
    var a = d.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    d.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  };

  T.copy = function (text, btn) {
    function done(ok) {
      if (!btn) return;
      var old = btn.getAttribute('data-label') || btn.textContent;
      btn.setAttribute('data-label', old);
      btn.textContent = ok ? 'Copied' : 'Copy failed';
      setTimeout(function () { btn.textContent = old; }, 1400);
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(function () { done(true); }, fallback);
    else fallback();
    function fallback() {
      var ta = d.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      d.body.appendChild(ta); ta.select();
      var ok = false; try { ok = d.execCommand('copy'); } catch (e) {}
      ta.remove(); done(ok);
    }
  };

  /* ---------- source widget: paste or upload ----------
     <div class="src" data-src="a" data-kind="list|table|text" data-label="List A" data-accept=".csv,.txt" data-placeholder="..."></div>
     list: one value per line, or a column from a CSV/TSV file (or pasted from Excel)
     table: CSV/TSV, pasted or uploaded
     text: raw text (JSON, HTML, MRZ ...) */
  var uid = 0;
  T.source = function (el, opts) {
    opts = opts || {};
    var kind = el.getAttribute('data-kind') || 'list', id = 'src' + (++uid);
    var label = el.getAttribute('data-label') || 'Input';
    var accept = el.getAttribute('data-accept') || (kind === 'text' ? '.txt' : '.csv,.tsv,.txt');
    var acceptTxt = accept.split(',').map(function (x) { return x.trim(); }).filter(Boolean).join(' ');
    var hint = el.getAttribute('data-hint') || '';
    el.innerHTML =
      '<div class="src-bar"><label for="' + id + '">' + T.esc(label) + '</label><span class="src-act">' +
      '<button type="button" class="tbtn ghost sm" data-upload>Upload file</button><button type="button" class="tbtn ghost sm" data-clear>Clear</button></span></div>' +
      '<div class="src-box"><textarea id="' + id + '" spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="' + T.esc(el.getAttribute('data-placeholder') || '') + '"></textarea>' +
      '<div class="src-drop" aria-hidden="true">Drop the file here</div></div>' +
      '<div class="src-file" hidden><span class="src-fname"></span><button type="button" class="tbtn ghost sm" data-unload>Remove file</button></div>' +
      '<div class="src-opts" hidden><label class="fld"><span>Column</span><select data-col></select></label>' +
      '<label class="chk"><input type="checkbox" data-header checked> First row is a header</label></div>' +
      '<div class="src-meta" aria-live="polite"></div>' +
      '<div class="src-accept"><span>Accepts <b>' + T.esc(acceptTxt) + '</b> files' + (kind === 'text' ? '' : ' (save Excel sheets as CSV first)') + ', or paste' + (hint ? '. ' + T.esc(hint) : '') + '. It stays on your device.</span>' +
      (opts.sample ? '<button type="button" class="linkbtn" data-samplefile>Download a sample file</button>' : '') + '</div>' +
      '<input type="file" hidden accept="' + T.esc(accept) + '">';
    var ta = T.$('textarea', el), file = T.$('input[type=file]', el), meta = T.$('.src-meta', el);
    var fileBox = T.$('.src-file', el), optsBox = T.$('.src-opts', el), colSel = T.$('[data-col]', el), hdr = T.$('[data-header]', el);
    if (opts.rows) ta.rows = opts.rows;
    var loaded = null; // {name, size, text}
    var cache = { key: null, parsed: null };

    function rawText() { return loaded ? loaded.text : ta.value; }

    function parsed() {
      var text = rawText(), key = (loaded ? 'f:' + loaded.name + loaded.size : 't:' + text.length + ':' + text.slice(0, 64) + text.slice(-64)) + ':' + hdr.checked;
      if (cache.key === key && cache.text === text) return cache.parsed;
      var res;
      if (kind === 'text') res = null;
      else {
        var tabular = kind === 'table' || !!loaded && /\.(csv|tsv)$/i.test(loaded.name) || text.indexOf('\t') >= 0;
        if (kind === 'list' && !tabular) {
          var vals = text.split(/\r\n|\n|\r/);
          res = { headers: ['Value'], rows: vals.map(function (v) { return [v]; }), single: true };
        } else {
          var delim = kind === 'list' && !loaded ? '\t' : null;
          var p = T.parseCSV(text, delim);
          res = T.table(p.rows, hdr.checked);
          res.delimiter = p.delimiter; res.unclosed = p.unclosed;
        }
      }
      cache = { key: key, text: text, parsed: res };
      return res;
    }

    function refresh() {
      var text = rawText(), p = parsed();
      el.classList.toggle('has-file', !!loaded);
      fileBox.hidden = !loaded;
      T.$('.src-box', el).hidden = !!loaded;
      if (loaded) T.$('.src-fname', el).textContent = loaded.name + ' · ' + T.bytes(loaded.size);
      var showOpts = p && !p.single && kind !== 'text';
      optsBox.hidden = !showOpts;
      if (showOpts && kind === 'list') {
        var prev = colSel.value;
        colSel.innerHTML = p.headers.map(function (h, i) { return '<option value="' + i + '">' + T.esc(h) + '</option>'; }).join('');
        if (prev && +prev < p.headers.length) colSel.value = prev;
        colSel.parentNode.hidden = false;
      } else colSel.parentNode.hidden = true;
      if (!text.trim()) meta.textContent = '';
      else if (kind === 'text') meta.textContent = T.plural(text.length, 'character');
      else if (kind === 'list') meta.textContent = T.plural(api.values().length, 'value') + (p.unclosed ? ' · a quote is never closed, check the file' : '');
      else meta.textContent = T.plural(p.rows.length, 'row') + ' · ' + T.plural(p.headers.length, 'column') + (p.unclosed ? ' · a quote is never closed, check the file' : '');
      if (opts.onChange) opts.onChange();
    }

    var api = {
      el: el,
      text: rawText,
      isEmpty: function () { return !rawText().trim(); },
      table: function () { return parsed(); },
      column: function () { var p = parsed(); return p && !p.single ? +colSel.value || 0 : 0; },
      // list: non-empty trimmed values with their source row index
      entries: function () {
        var p = parsed(); if (!p) return [];
        var c = api.column(), out = [];
        for (var i = 0; i < p.rows.length; i++) { var v = (p.rows[i][c] || '').trim(); if (v) out.push({ v: v, row: i }); }
        return out;
      },
      values: function () { return api.entries().map(function (e) { return e.v; }); },
      set: function (text) { loaded = null; file.value = ''; ta.value = text; cache.key = null; refresh(); },
      load: function (f) {
        if (f.size > 200 * 1048576) { meta.textContent = 'That file is ' + T.bytes(f.size) + '. The limit here is 200 MB.'; return; }
        meta.textContent = 'Reading ' + f.name + '…';
        T.readFile(f).then(function (text) {
          loaded = { name: f.name, size: f.size, text: text }; cache.key = null;
          if (text.length < 300000 && kind === 'text') { loaded = null; ta.value = text; }
          refresh();
        }, function () { meta.textContent = 'Could not read that file.'; });
      },
      clear: function () { loaded = null; file.value = ''; ta.value = ''; cache.key = null; refresh(); }
    };

    T.$('[data-upload]', el).addEventListener('click', function () { file.click(); });
    if (opts.sample) T.$('[data-samplefile]', el).addEventListener('click', function () { T.download(opts.sample.name, opts.sample.text, opts.sample.mime || 'text/csv'); });
    T.$('[data-clear]', el).addEventListener('click', api.clear);
    T.$('[data-unload]', el).addEventListener('click', api.clear);
    file.addEventListener('change', function () { if (file.files[0]) api.load(file.files[0]); });
    var t; ta.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { cache.key = null; refresh(); }, 250); });
    colSel.addEventListener('change', refresh);
    hdr.addEventListener('change', function () { cache.key = null; refresh(); });
    ['dragenter', 'dragover'].forEach(function (ev) { el.addEventListener(ev, function (e) { if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types, 'Files') >= 0) { e.preventDefault(); el.classList.add('drag'); } }); });
    ['dragleave', 'drop'].forEach(function (ev) { el.addEventListener(ev, function (e) { if (ev === 'dragleave' && el.contains(e.relatedTarget)) return; el.classList.remove('drag'); }); });
    el.addEventListener('drop', function (e) { e.preventDefault(); var f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) api.load(f); });
    refresh();
    return api;
  };

  /* ---------- result table with "show more" ---------- */
  T.grid = function (box, headers, rows, o) {
    o = o || {};
    var shown = 0, step = o.step || 200;
    box.innerHTML = '<div class="tgrid-wrap"><table class="tgrid"><thead><tr>' +
      headers.map(function (h, i) { return '<th' + (o.thClass && o.thClass[i] ? ' class="' + o.thClass[i] + '"' : '') + '>' + T.esc(h) + '</th>'; }).join('') +
      '</tr></thead><tbody></tbody></table></div><div class="tgrid-more"></div>';
    var tb = T.$('tbody', box), more = T.$('.tgrid-more', box);
    function render() {
      var end = Math.min(rows.length, shown + step), html = '';
      for (var r = shown; r < end; r++) {
        var row = rows[r], cls = o.rowClass ? o.rowClass(row, r) : '';
        html += '<tr' + (cls ? ' class="' + cls + '"' : '') + '>';
        for (var c = 0; c < headers.length; c++) html += o.cell ? o.cell(row, c, r) : '<td>' + T.esc(row[c]) + '</td>';
        html += '</tr>';
      }
      tb.insertAdjacentHTML('beforeend', html);
      shown = end;
      more.innerHTML = shown < rows.length
        ? '<span>Showing ' + T.n(shown) + ' of ' + T.n(rows.length) + '</span><button type="button" class="tbtn ghost sm">Show ' + T.n(Math.min(step, rows.length - shown)) + ' more</button>'
        : (rows.length ? '<span>' + T.plural(rows.length, 'row') + '</span>' : '<span>' + T.esc(o.empty || 'Nothing to show.') + '</span>');
      var b = T.$('button', more); if (b) b.addEventListener('click', render);
    }
    render();
  };

  /* ---------- status line ---------- */
  T.say = function (el, msg, kind) {
    el.className = 'tsay' + (kind ? ' ' + kind : '');
    el.innerHTML = msg || '';
    el.hidden = !msg;
  };

  /* ---------- matching worker ---------- */
  var W = null, jobs = 0;
  T.work = function (payload, onProgress) {
    return new Promise(function (resolve, reject) {
      var id = ++jobs;
      function local() {
        // no Worker available (very old browser or file://): run here
        T.later(function () {
          try {
            resolve(payload.type === 'self' ? Fuzz.selfPairs(payload.items, payload.opts, onProgress) : Fuzz.matchAll(payload.a, payload.b, payload.opts, onProgress));
          } catch (e) { reject(e); }
        });
      }
      try { if (!W) W = new Worker('/assets/tools/match-worker.js?v=3'); }
      catch (e) { W = null; return local(); }
      payload.id = id;
      W.onmessage = function (e) {
        var m = e.data;
        if (m.id !== id) return;
        if (m.type === 'progress' && onProgress) onProgress(m.done, m.total);
        else if (m.type === 'done') resolve(m.result);
        else if (m.type === 'error') reject(new Error(m.message));
      };
      W.onerror = function (e) { e.preventDefault && e.preventDefault(); W = null; local(); };
      W.postMessage(payload);
    });
  };
  T.cancelWork = function () { if (W) { W.terminate(); W = null; } };

  /* progress bar inside an element */
  T.progress = function (el) {
    el.innerHTML = '<div class="tprog"><i></i></div><span class="tprog-t">Working…</span>';
    el.hidden = false;
    var bar = T.$('i', el), txt = T.$('.tprog-t', el);
    return function (done, total) {
      var p = total ? done / total : 0;
      bar.style.width = (p * 100).toFixed(1) + '%';
      txt.textContent = total ? T.n(done) + ' of ' + T.n(total) : 'Working…';
    };
  };

  /* segmented filter chips */
  T.chips = function (el, items, onPick) {
    el.innerHTML = items.map(function (it, i) {
      return '<button type="button" role="tab" aria-selected="' + (i === 0) + '" data-k="' + it[0] + '">' + T.esc(it[1]) + (it[2] != null ? ' <b>' + T.n(it[2]) + '</b>' : '') + '</button>';
    }).join('');
    T.$$('button', el).forEach(function (b) {
      b.addEventListener('click', function () {
        T.$$('button', el).forEach(function (x) { x.setAttribute('aria-selected', x === b); });
        onPick(b.getAttribute('data-k'));
      });
    });
  };

  // score pill
  T.pill = function (score, th) {
    var cls = score >= th ? 'ok' : score >= th - 10 ? 'warn' : 'bad';
    return '<span class="spill ' + cls + '"><i style="--w:' + Math.max(0, Math.min(100, score)) + '%"></i><b>' + (Math.round(score * 10) / 10) + '</b></span>';
  };

  // a tidy file name from a label
  T.fname = function (base, ext) { return base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.' + ext; };

  /* ---------- 1-2-3 stepper at the top of each tool: ticks itself as the person works ---------- */
  T.steps = function () {
    var box = T.$('.tg-steps'); if (!box) return;
    var items = T.$$('li', box), out = T.$('#out') || T.$('#res'), tool = T.$('#tool');
    function hasInput() {
      // form tools mark their required fields with data-req; step 1 is done once all of them are filled
      var req = T.$$('[data-req]', tool);
      if (req.length) return req.every(function (el) { return String(el.value).trim() !== ''; });
      return T.$$('.tsrc textarea, textarea.plain', tool).some(function (t) { return t.value.trim(); }) || !!T.$('.tsrc.has-file', tool);
    }
    function upd() {
      var done1 = hasInput(), done3 = out && !out.hidden && done1;
      items[0].classList.toggle('done', done1);
      items[1].classList.toggle('done', !!done3);
      items[2].classList.toggle('done', !!done3);
      var cur = !done1 ? 0 : !done3 ? 1 : -1;
      items.forEach(function (li, i) { li.classList.toggle('now', i === cur); });
    }
    tool.addEventListener('input', upd); tool.addEventListener('change', upd); tool.addEventListener('click', function () { setTimeout(upd, 50); });
    if (out) new MutationObserver(upd).observe(out, { attributes: true, attributeFilter: ['hidden'] });
    new MutationObserver(upd).observe(tool, { subtree: true, attributes: true, attributeFilter: ['class'] });
    upd();
  };
  document.addEventListener('DOMContentLoaded', function () { setTimeout(T.steps, 0); T.figures(); });

  /* ---------- hero figures: play when visible, replay every 10s, never with reduced motion ---------- */
  T.figures = function () {
    var figs = T.$$('.fig.tf');
    if (!figs.length || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    figs.forEach(function (f) {
      var timer = null, visible = false;
      function play() {
        f.classList.add('out');
        setTimeout(function () { f.classList.remove('play'); void f.offsetWidth; f.classList.remove('out'); f.classList.add('play'); }, 380);
      }
      function start() { if (timer) return; f.classList.add('play'); timer = setInterval(function () { if (visible && !document.hidden) play(); }, 10000); }
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { es.forEach(function (e) { visible = e.isIntersecting; if (visible) start(); }); }, { threshold: 0.25 }).observe(f);
      } else { visible = true; start(); }
    });
  };

  /* ---------- 100% breakdown bar: [[label, count, cls], ...] ---------- */
  T.breakdown = function (el, segs, title) {
    var total = segs.reduce(function (a, s) { return a + s[1]; }, 0) || 1;
    el.innerHTML = (title ? '<div class="bd-t">' + T.esc(title) + '</div>' : '') + '<div class="bd" role="img" aria-label="' + T.esc(segs.map(function (s) { return s[0] + ' ' + s[1]; }).join(', ')) + '">' +
      segs.filter(function (s) { return s[1] > 0; }).map(function (s) {
        return '<i class="' + s[2] + '" style="flex-grow:' + s[1] + '" title="' + T.esc(s[0] + ': ' + T.n(s[1]) + ' (' + Math.round(100 * s[1] / total) + '%)') + '"></i>';
      }).join('') + '</div><div class="bd-l">' + segs.filter(function (s) { return s[1] > 0; }).map(function (s) {
        return '<span><i class="' + s[2] + '"></i>' + T.esc(s[0]) + ' <b>' + T.n(s[1]) + '</b> <em>' + Math.round(100 * s[1] / total) + '%</em></span>';
      }).join('') + '</div>';
  };

  /* ---------- score histogram (0-100 in 5-point bins), coloured by where the threshold sits ---------- */
  T.histogram = function (el, scores, th, note) {
    var bins = new Array(20).fill(0);
    scores.forEach(function (s) { bins[Math.min(19, Math.floor(s / 5))]++; });
    var max = Math.max.apply(null, bins) || 1;
    el.innerHTML = '<div class="hg-h"><b>How the scores are spread</b><span>' + T.esc(note || '') + '</span></div><div class="hg" role="img" aria-label="Histogram of match scores">' +
      bins.map(function (n, i) {
        var lo = i * 5, cls = lo >= th ? 'ok' : lo + 5 > th - 10 ? 'warn' : 'bad';
        return '<div class="hg-c" title="' + lo + ' to ' + (lo + 5) + ': ' + T.n(n) + '"><i class="' + cls + '" style="height:' + (n ? Math.max(3, 100 * n / max) : 0) + '%"></i></div>';
      }).join('') + '<span class="hg-th" style="left:' + th + '%"><em>' + th + '</em></span></div><div class="hg-x"><span>0</span><span>50</span><span>100</span></div>';
  };
})();
