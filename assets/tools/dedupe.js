/* CSV and JSON cleaner + deduplicator. gibin.in/tools/remove-duplicates/ */
(function () {
  'use strict';
  var $ = T.$, tool = $('#tool');
  var say = $('#say'), prog = $('#prog'), out = $('#out'), run = $('#run'), colsBox = $('#cols');
  var data = null, last = null, view = 'kept';
  var SAMPLE = 'name,email,city,phone\n' +
      'Priya Raman,priya.raman@example.com,Chennai,98400 12345\n' +
      'Arjun Mehta,arjun.m@example.com,Mumbai,N/A\n' +
      '  Priya Raman ,PRIYA.RAMAN@example.com,Chennai,98400 12345\n' +
      'Sara Thomas,sara.thomas@example.com,Kochi,99470 55501\n' +
      ',,,\n' +
      'Arjun  Mehta,arjun.m@example.com,Mumbai,null\n' +
      'Rahul Nair,rahul.nair@example.com,Bengaluru,90080 11223\n' +
      'Sara Thomas,sara.thomas@example.com,Kochi,99470 55501\n' +
      'Priya Raman,priya.raman@example.com,chennai,98400 12345\n' +
      'Meera Iyer,meera.iyer@example.com,Hyderabad,-\n';
  var S = T.source($('[data-src=d]', tool), { sample: { name: 'contacts-sample.csv', text: SAMPLE },  onChange: function () { clearTimeout(pt); pt = setTimeout(prepare, 150); } });
  var pt;

  $('#mode').addEventListener('change', function () { $('#near').hidden = this.value !== 'near'; $('#exact-opts').hidden = this.value === 'near'; });
  $('#th').addEventListener('input', function () { $('#thv').textContent = this.value; });

  $('[data-sample]', tool).addEventListener('click', function () {
    S.set(SAMPLE);
    setTimeout(function () { prepare(); go(); }, 0);
  });

  /* ---------- parse CSV or JSON ---------- */
  function parse(text) {
    var t = text.replace(/^﻿/, '').trim();
    if (!t) return null;
    if (t[0] === '[' || t[0] === '{') {
      var j, lines = null;
      try { j = JSON.parse(t); }
      catch (e) {
        // JSON Lines?
        try { lines = t.split(/\r?\n/).filter(function (l) { return l.trim(); }).map(function (l) { return JSON.parse(l); }); j = lines; }
        catch (e2) { var x = T.jsonError(t); throw new Error('This looks like JSON but it does not parse' + (x ? ': line ' + x.line + ', column ' + x.col + ', ' + x.why : ': ' + e.message) + '.'); }
      }
      var arr = j, path = '';
      if (!Array.isArray(arr) && arr && typeof arr === 'object') {
        var k = Object.keys(arr).find(function (k) { return Array.isArray(arr[k]); });
        if (!k) throw new Error('The JSON is a single object. Paste an array of records, or JSON Lines (one object per line).');
        arr = arr[k]; path = k;
      }
      var objs = arr.map(function (x) { return x && typeof x === 'object' && !Array.isArray(x) ? x : { value: x }; });
      var headers = [], seen = {};
      objs.forEach(function (o) { Object.keys(o).forEach(function (k) { if (!seen[k]) { seen[k] = 1; headers.push(k); } }); });
      var rows = objs.map(function (o) { return headers.map(function (h) { var v = o[h]; return v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v); }); });
      return { kind: lines ? 'jsonl' : 'json', objs: objs, headers: headers, rows: rows, wrap: path ? { obj: j, key: path } : null };
    }
    var pc = T.parseCSV(text), tb = T.table(pc.rows, $('#hdr').checked);
    return { kind: 'csv', headers: tb.headers, rows: tb.rows, delimiter: pc.delimiter };
  }

  function prepare() {
    try { data = parse(S.text()); T.say(say, ''); }
    catch (e) { data = null; T.say(say, T.esc(e.message), 'err'); }
    if (!data) { colsBox.innerHTML = '<span class="dim">Paste or upload data to choose columns.</span>'; return; }
    var prev = {};
    T.$$('input', colsBox).forEach(function (c) { prev[c.value] = c.checked; });
    colsBox.innerHTML = data.headers.map(function (h, i) {
      var on = prev[h] === undefined ? true : prev[h];
      return '<label class="chk"><input type="checkbox" value="' + T.esc(h) + '" data-i="' + i + '"' + (on ? ' checked' : '') + '> ' + T.esc(h) + '</label>';
    }).join('');
  }
  $('#hdr').addEventListener('change', prepare);
  $('#all').addEventListener('click', function () { var c = T.$$('input', colsBox), on = c.some(function (x) { return !x.checked; }); c.forEach(function (x) { x.checked = on; }); });

  /* ---------- cleaning ---------- */
  var PLACE = /^(n\/a|na|null|none|nil|-|--|#n\/a|nan|undefined|\?)$/i;
  function cleaner() {
    var o = { inv: $('#c-inv').checked, trim: $('#c-trim').checked, sp: $('#c-sp').checked, q: $('#c-q').checked, ph: $('#c-ph').checked, cs: $('#c-case').value };
    return function (v) {
      if (typeof v !== 'string') return v;
      var s = v;
      if (o.inv) s = s.replace(/[​-‍⁠﻿­]/g, '').replace(/[   ]/g, ' ');
      if (o.q) s = s.replace(/[‘’‚′]/g, "'").replace(/[“”„″]/g, '"');
      if (o.sp) s = s.replace(/[ \t]{2,}/g, ' ');
      if (o.trim) s = s.trim();
      if (o.ph && PLACE.test(s.trim())) s = '';
      if (o.cs === 'lower') s = s.toLowerCase();
      else if (o.cs === 'upper') s = s.toUpperCase();
      else if (o.cs === 'title') s = s.toLowerCase().replace(/(^|[\s\-('"\/])(\p{L})/gu, function (m, a, b) { return a + b.toUpperCase(); });
      return s;
    };
  }

  run.addEventListener('click', function () { prepare(); go(); });

  function go() {
    if (!data) { T.say(say, 'Paste some CSV or JSON first, or upload a file.', 'warn'); return; }
    var cols = T.$$('input:checked', colsBox).map(function (c) { return +c.getAttribute('data-i'); });
    if (!cols.length) { T.say(say, 'Tick at least one column to compare on.', 'warn'); return; }
    var clean = cleaner(), changed = 0, H = data.headers;
    // clean every cell (strings only for JSON objects)
    var rows = data.rows.map(function (r) { return r.map(function (v) { var c = clean(v); if (c !== v) changed++; return c; }); });
    var objs = null;
    if (data.objs) {
      objs = data.objs.map(function (o) {
        var n = {};
        Object.keys(o).forEach(function (k) { n[k] = typeof o[k] === 'string' ? clean(o[k]) : o[k]; });
        return n;
      });
    }
    var keepIdx = [], empty = [];
    var dropEmpty = $('#c-empty').checked;
    rows.forEach(function (r, i) { if (dropEmpty && r.every(function (v) { return v === ''; })) empty.push(i); else keepIdx.push(i); });
    var ic = $('#e-case').checked, ip = $('#e-punct').checked, last1 = $('#keep').value === 'last';
    function keyOf(i) {
      return cols.map(function (c) {
        var v = rows[i][c];
        if (ic) v = v.toLowerCase();
        if (ip) v = v.replace(/[^\p{L}\p{N}]+/gu, '');
        return v;
      }).join('\u0001');
    }
    var mode = $('#mode').value;
    var t0 = performance.now();
    var dupOf = new Map(); // removed row -> [kept row, score]
    var finish = function () {
      var removed = new Set(empty);
      dupOf.forEach(function (_, i) { removed.add(i); });
      var kept = [];
      for (var i = 0; i < rows.length; i++) if (!removed.has(i)) kept.push(i);
      last = { rows: rows, objs: objs, H: H, kept: kept, dupOf: dupOf, empty: empty, changed: changed, ms: performance.now() - t0, kind: data.kind, wrap: data.wrap, delimiter: data.delimiter };
      prog.hidden = true; run.disabled = false; view = 'kept';
      render(); out.hidden = false;
    };
    if (mode === 'exact') {
      var seen = new Map(), order = last1 ? keepIdx.slice().reverse() : keepIdx;
      order.forEach(function (i) { var k = keyOf(i); if (seen.has(k)) dupOf.set(i, [seen.get(k), 'exact']); else seen.set(k, i); });
      finish();
    } else {
      var strs = keepIdx.map(function (i) { return cols.map(function (c) { return rows[i][c]; }).join(' '); });
      run.disabled = true;
      T.work({ type: 'self', items: strs, opts: { threshold: +$('#th').value, abbr: true } }, T.progress(prog)).then(function (pairs) {
        // union-find over near-duplicate pairs
        var parent = keepIdx.map(function (_, i) { return i; });
        function f(x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; }
        var best = new Map();
        pairs.forEach(function (p) {
          var a = f(p[0]), b = f(p[1]); if (a !== b) parent[Math.max(a, b)] = Math.min(a, b);
          [p[0], p[1]].forEach(function (x) { if (!best.has(x) || best.get(x) < p[2]) best.set(x, p[2]); });
        });
        var groups = new Map();
        keepIdx.forEach(function (row, j) { var g = f(j); if (!groups.has(g)) groups.set(g, []); groups.get(g).push(j); });
        groups.forEach(function (m) {
          if (m.length < 2) return;
          var keep = last1 ? m[m.length - 1] : m[0];
          m.forEach(function (j) { if (j !== keep) dupOf.set(keepIdx[j], [keepIdx[keep], best.get(j)]); });
        });
        finish();
      }, function (err) { prog.hidden = true; run.disabled = false; T.say(say, 'Something went wrong: ' + T.esc(err.message), 'err'); });
    }
  }

  function render() {
    var L = last;
    $('#stats').innerHTML =
      '<div><b>' + T.n(L.rows.length) + '</b><span>rows in</span></div>' +
      '<div class="warn"><b>' + T.n(L.dupOf.size) + '</b><span>duplicates removed</span></div>' +
      '<div><b>' + T.n(L.empty.length) + '</b><span>empty rows removed</span></div>' +
      '<div><b>' + T.n(L.changed) + '</b><span>cells cleaned</span></div>' +
      '<div class="ok"><b>' + T.n(L.kept.length) + '</b><span>rows out</span></div>';
    T.breakdown($('#bd'), [['Kept', L.kept.length, 'ok'], ['Duplicates removed', L.dupOf.size, 'warn'], ['Empty rows removed', L.empty.length, 'mute']], 'What happened to your ' + T.n(L.rows.length) + ' rows');
    T.chips($('#views'), [['kept', 'Clean data', L.kept.length], ['dups', 'Removed duplicates', L.dupOf.size]], function (k) { view = k; grid(); });
    $('#dl').textContent = 'Download clean ' + (L.kind === 'csv' ? 'CSV' : L.kind === 'jsonl' ? 'JSON Lines' : 'JSON');
    grid();
  }

  function grid() {
    var L = last;
    if (view === 'kept') {
      T.grid($('#grid'), ['Row'].concat(L.H), L.kept, {
        empty: 'No rows left.',
        cell: function (i, c) { return c === 0 ? '<td class="num dim">' + (i + 1) + '</td>' : '<td>' + T.esc(L.rows[i][c - 1]) + '</td>'; }
      });
    } else {
      var rem = Array.from(L.dupOf.keys()).sort(function (a, b) { return a - b; });
      T.grid($('#grid'), ['Row', 'Duplicate of', 'Match'].concat(L.H), rem, {
        empty: 'No duplicates found with these settings.',
        cell: function (i, c) {
          var d = L.dupOf.get(i);
          if (c === 0) return '<td class="num dim">' + (i + 1) + '</td>';
          if (c === 1) return '<td class="num">row ' + (d[0] + 1) + '</td>';
          if (c === 2) return '<td>' + (d[1] === 'exact' ? '<span class="tag2 ok">exact</span>' : '<span class="tag2 warn">' + d[1] + '</span>') + '</td>';
          return '<td>' + T.esc(L.rows[i][c - 3]) + '</td>';
        }
      });
    }
  }

  $('#dl').addEventListener('click', function () {
    var L = last;
    if (L.kind === 'csv') T.download('clean-data.csv', T.toCSV(L.H, L.kept.map(function (i) { return L.rows[i]; })), 'text/csv');
    else {
      var arr = L.kept.map(function (i) { return L.objs[i]; });
      if (L.kind === 'jsonl') T.download('clean-data.jsonl', arr.map(function (o) { return JSON.stringify(o); }).join('\n') + '\n', 'application/x-ndjson');
      else {
        var outv = arr;
        if (L.wrap) { outv = Object.assign({}, L.wrap.obj); outv[L.wrap.key] = arr; }
        T.download('clean-data.json', JSON.stringify(outv, null, 2), 'application/json');
      }
    }
  });
  $('#dl-rm').addEventListener('click', function () {
    var L = last, rem = Array.from(L.dupOf.keys()).sort(function (a, b) { return a - b; });
    T.download('removed-duplicates.csv', T.toCSV(['row', 'duplicate_of_row', 'match'].concat(L.H), rem.map(function (i) {
      var d = L.dupOf.get(i); return [i + 1, d[0] + 1, d[1]].concat(L.rows[i]);
    })), 'text/csv');
  });
  prepare();
})();
