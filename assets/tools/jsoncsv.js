/* Nested JSON to flat CSV. gibin.in/tools/json-to-csv/ */
(function () {
  'use strict';
  var $ = T.$, tool = $('#tool');
  var SAMPLE = JSON.stringify({ page: 1, orders: [
      { id: 1001, placed: '2026-01-04', customer: { name: 'Priya Raman', address: { city: 'Chennai', pin: '600042' } }, tags: ['gift', 'priority'],
        items: [{ sku: 'TEA-250', qty: 2, price: 320 }, { sku: 'MUG-01', qty: 1, price: 450 }], paid: true },
      { id: 1002, placed: '2026-01-05', customer: { name: 'Arjun Mehta', address: { city: 'Mumbai', pin: '400050' } }, tags: [],
        items: [{ sku: 'COF-500', qty: 1, price: 899.5 }], paid: false, note: 'Call before delivery' },
      { id: 1003, placed: '2026-01-05', customer: { name: 'Sara Thomas', address: { city: 'Kochi', pin: null } }, tags: ['priority'],
        items: [{ sku: 'TEA-250', qty: 4, price: 320 }, { sku: 'TEA-100', qty: 2, price: 150 }, { sku: 'MUG-01', qty: 2, price: 450 }], paid: true }
    ] }, null, 2);
  var S = T.source($('[data-src=d]', tool), { sample: { name: 'orders-sample.json', text: SAMPLE, mime: 'application/json' }, onChange: function () { clearTimeout(pt); pt = setTimeout(scan, 200); } });
  var pt, say = $('#say'), out = $('#out'), run = $('#run'), doc = null, last = null;

  $('[data-sample]', tool).addEventListener('click', function () {
    S.set(SAMPLE);
    $('#arr').value = 'rows'; $('#explode-f').hidden = false; $('#join-f').hidden = true;
    setTimeout(function () { scan(); go(); }, 0);
  });
  run.addEventListener('click', function () { scan(); go(); });
  ['#sep', '#arr', '#explode', '#root', '#join'].forEach(function (s) { $(s).addEventListener('change', function () { if (s === '#root') explodeOpts(); if (last) go(); }); });
  $('#arr').addEventListener('change', function () { $('#explode-f').hidden = this.value !== 'rows'; $('#join-f').hidden = this.value !== 'join'; });

  function parse(text) {
    var t = text.replace(/^﻿/, '').trim();
    if (!t) return null;
    try { return { v: JSON.parse(t), lines: false }; }
    catch (e) {
      var rows = [], ls = t.split(/\r?\n/), n = 0;
      try { ls.forEach(function (l, i) { n = i + 1; if (l.trim()) rows.push(JSON.parse(l)); }); }
      catch (e2) {
        var x = T.jsonError(t);
        throw new Error(x ? 'That is not valid JSON. Line ' + x.line + ', column ' + x.col + ': ' + x.why + '. JSON Lines (one object per line) is also accepted.'
          : 'That is not valid JSON: ' + e.message);
      }
      return { v: rows, lines: true };
    }
  }

  // arrays of objects reachable through objects only: candidate record lists
  function arrayPaths(v, path, outp, depth) {
    if (depth > 6 || v == null || typeof v !== 'object') return;
    if (Array.isArray(v)) { outp.push({ path: path, n: v.length }); return; }
    Object.keys(v).forEach(function (k) { arrayPaths(v[k], path.concat(k), outp, depth + 1); });
  }
  function get(v, path) { for (var i = 0; i < path.length && v != null; i++) v = v[path[i]]; return v; }
  function label(p) { return p.length ? p.join('.') : '(top level)'; }

  function scan() {
    try { doc = parse(S.text()); T.say(say, ''); }
    catch (e) { doc = null; T.say(say, T.esc(e.message), 'err'); return; }
    if (!doc) return;
    var paths = [];
    if (Array.isArray(doc.v)) paths.push({ path: [], n: doc.v.length });
    else arrayPaths(doc.v, [], paths, 0);
    paths = paths.filter(function (p) { var a = get(doc.v, p.path); return a.some(function (x) { return x && typeof x === 'object'; }) || p.path.length === 0; });
    var root = $('#root'), prev = root.value;
    paths.sort(function (a, b) { return b.n - a.n; });
    root.innerHTML = (Array.isArray(doc.v) ? '' : '<option value="__self">The whole object as one row</option>') +
      paths.map(function (p) { return '<option value="' + T.esc(JSON.stringify(p.path)) + '">' + T.esc(label(p.path)) + ' (' + T.n(p.n) + ')</option>'; }).join('');
    if (paths.length && !Array.isArray(doc.v)) root.value = JSON.stringify(paths[0].path);
    if (prev && Array.prototype.some.call(root.options, function (o) { return o.value === prev; })) root.value = prev;
    $('#root-f').hidden = Array.isArray(doc.v) && paths.length <= 1;
    explodeOpts();
  }

  function records() {
    var r = $('#root').value;
    if (!doc) return [];
    if (r === '__self' || r === '') return Array.isArray(doc.v) ? doc.v : [doc.v];
    return get(doc.v, JSON.parse(r)) || [];
  }

  function explodeOpts() {
    var recs = records().slice(0, 200), seen = {}, list = [];
    recs.forEach(function (rec) { walk(rec, []); });
    function walk(v, p) {
      if (v == null || typeof v !== 'object' || p.length > 5) return;
      if (Array.isArray(v)) { var k = p.join('.'); if (p.length && !seen[k]) { seen[k] = 1; list.push(p.slice()); } return; }
      Object.keys(v).forEach(function (k) { walk(v[k], p.concat(k)); });
    }
    var ex = $('#explode'), prev = ex.value;
    ex.innerHTML = list.length ? list.map(function (p) { return '<option value="' + T.esc(JSON.stringify(p)) + '">' + T.esc(p.join('.')) + '</option>'; }).join('') : '<option value="">No lists inside the records</option>';
    if (prev && Array.prototype.some.call(ex.options, function (o) { return o.value === prev; })) ex.value = prev;
    if (!prev) { var it = list.findIndex(function (p) { return p[p.length - 1] === 'items'; }); if (it >= 0) ex.selectedIndex = it; }
  }

  function scalar(v) { return v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v); }

  function flatten(v, prefix, o, sep, mode, join) {
    if (v === null || v === undefined) { if (prefix) o.set(prefix, ''); return; }
    if (Array.isArray(v)) {
      if (mode === 'index') {
        if (!v.length) { if (prefix) o.set(prefix, ''); return; }
        v.forEach(function (x, i) { flatten(x, prefix ? prefix + sep + i : String(i), o, sep, mode, join); });
      } else {
        var allScalar = v.every(function (x) { return x == null || typeof x !== 'object'; });
        o.set(prefix || 'value', allScalar ? v.map(scalar).join(join) : JSON.stringify(v));
      }
      return;
    }
    if (typeof v === 'object') {
      var ks = Object.keys(v);
      if (!ks.length) { if (prefix) o.set(prefix, ''); return; }
      ks.forEach(function (k) { flatten(v[k], prefix ? prefix + sep + k : k, o, sep, mode, join); });
      return;
    }
    o.set(prefix || 'value', scalar(v));
  }

  function go() {
    if (!doc) { if (!S.isEmpty()) return; T.say(say, 'Paste JSON or upload a .json file first.', 'warn'); return; }
    var recs = records(), sep = $('#sep').value, mode = $('#arr').value, join = $('#join').value.replace(/\\t/g, '\t');
    if (!Array.isArray(recs)) recs = [recs];
    var exPath = mode === 'rows' && $('#explode').value ? JSON.parse($('#explode').value) : null;
    var rowsOut = [], cols = new Map();
    var flatMode = mode === 'rows' ? 'join' : mode;
    for (var i = 0; i < recs.length; i++) {
      var rec = recs[i];
      if (rec == null || typeof rec !== 'object' || Array.isArray(rec)) rec = { value: rec };
      var variants = [rec];
      if (exPath) {
        var arr = get(rec, exPath);
        if (Array.isArray(arr) && arr.length) {
          variants = arr.map(function (item) {
            var c = JSON.parse(JSON.stringify(rec)), p = c;
            for (var k = 0; k < exPath.length - 1; k++) p = p[exPath[k]];
            p[exPath[exPath.length - 1]] = item;
            return c;
          });
        }
      }
      variants.forEach(function (v) {
        var o = new Map();
        flatten(v, '', o, sep, flatMode, join);
        o.forEach(function (_, k) { if (!cols.has(k)) cols.set(k, cols.size); });
        rowsOut.push(o);
      });
    }
    var H = Array.from(cols.keys());
    var rows = rowsOut.map(function (o) { return H.map(function (h) { return o.has(h) ? o.get(h) : ''; }); });
    last = { H: H, rows: rows };
    var note = [];
    if (H.length > 1000) note.push('That is ' + T.n(H.length) + ' columns. If you used numbered columns for a long list, one row per item is usually easier to work with.');
    T.say(say, note.join(' '), 'warn');
    $('#meta').textContent = T.plural(recs.length, 'record') + ' → ' + T.plural(rows.length, 'row') + ' × ' + T.plural(H.length, 'column');
    T.grid($('#grid'), H, rows, { step: 100, empty: 'No records found at that path.' });
    out.hidden = false;
  }

  $('#dl').addEventListener('click', function () { T.download('data.csv', T.toCSV(last.H, last.rows), 'text/csv'); });
  $('#copy').addEventListener('click', function (e) { T.copy(T.toCSV(last.H, last.rows, '\t'), e.currentTarget); });
})();
