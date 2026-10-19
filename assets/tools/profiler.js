/* CSV profiler / data quality checker. gibin.in/tools/csv-profiler/ */
(function () {
  'use strict';
  var $ = T.$, tool = $('#tool');
  var SAMPLE = 'order_id,customer,email,order_date,city,amount,status,pincode\n' +
      '1001,Priya Raman,priya.raman@example.com,2026-01-04,Chennai,1250.00,Paid,600042\n' +
      '1002,Arjun Mehta,arjun.m@example.com,2026-01-05,Mumbai,899.50,paid,400050\n' +
      '1003,Sara Thomas,,2026-01-05,Kochi,2400.00,Paid,682001\n' +
      '1004,Rahul Nair,rahul.nair@example,05/01/2026,Bengaluru,"1,200",PAID,560001\n' +
      '1005,Meera Iyer ,meera.iyer@example.com,2026-01-06,Hyderabad,760.00,Refunded,500081\n' +
      '1006,Kiran Rao,kiran.rao@example.com,2026-01-07,chennai,N/A,Paid,600017\n' +
      '1007,Anjali Das,anjali.das@example.com,2026-01-07,Kolkata,1430.00,Pending,700019\n' +
      '1007,Anjali Das,anjali.das@example.com,2026-01-07,Kolkata,1430.00,Pending,700019\n' +
      '1009,Vikram Singh,vikram.s@example.com,2026-01-08,Delhi,98000.00,Paid,110001\n' +
      '1010,Fatima Khan,fatima.khan@example.com,Jan 9 2026,Lucknow,1100.00,Paid,226001\n' +
      '1011,Deepak Kumar,deepak.k@example.com,2026-01-09,Patna,950.00,Paid,800001\n' +
      '1012,Lakshmi Menon,lakshmi.m@example.com,2026-01-10,Chennai,1320.00,paid,06000\n';
  var S = T.source($('[data-src=d]', tool), { sample: { name: 'orders-sample.csv', text: SAMPLE } }), say = $('#say'), prog = $('#prog'), out = $('#out'), run = $('#run');
  var last = null;

  $('[data-sample]', tool).addEventListener('click', function () {
    S.set(SAMPLE);
    setTimeout(go, 0);
  });
  run.addEventListener('click', go);

  var PH = /^(n\/a|na|null|none|nil|-|--|#n\/a|nan|undefined|\?)$/i;
  var R = {
    bool: /^(true|false|yes|no|y|n)$/i,
    int: /^[-+]?(0|[1-9]\d*)$/,
    lead0: /^0\d+$/,
    dec: /^[-+]?(\d+\.\d*|\.\d+|\d+(\.\d+)?[eE][-+]?\d+)$/,
    grp: /^[-+]?\d{1,3}(,\d{3})+(\.\d+)?$/,
    cur: /^[-+]?([$€£₹¥]\s?\d[\d,]*(\.\d+)?|\d[\d,]*(\.\d+)?\s?[$€£₹¥])$/,
    pct: /^[-+]?\d+(\.\d+)?\s?%$/,
    iso: /^\d{4}-\d{2}-\d{2}$/,
    isot: /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/,
    dmy: /^\d{1,2}[\/.\-]\d{1,2}[\/.\-](\d{2}|\d{4})$/,
    txtdate: /^(\d{1,2}(st|nd|rd|th)?\s+[A-Za-z]{3,9}\.?,?\s+\d{4}|[A-Za-z]{3,9}\.?\s+\d{1,2}(st|nd|rd|th)?,?\s+\d{4})$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/,
    url: /^(https?:\/\/|www\.)\S+\.\S+$/i
  };
  var LABEL = { bool: 'true / false', int: 'whole number', lead0: 'code with leading zeros', dec: 'decimal', grp: 'number with commas',
    cur: 'money with a symbol', pct: 'percentage', iso: 'date (YYYY-MM-DD)', isot: 'date and time', dmy: 'date (d/m/y or m/d/y)', txtdate: 'date written out',
    email: 'email', url: 'URL', text: 'text' };
  var NUM = { int: 1, dec: 1, grp: 1, cur: 1, pct: 1 }, DATE = { iso: 1, isot: 1, dmy: 1, txtdate: 1 };

  function classify(v) {
    if (R.lead0.test(v)) return 'lead0';
    if (R.int.test(v)) return 'int';
    if (R.dec.test(v)) return 'dec';
    if (R.bool.test(v)) return 'bool';
    if (R.grp.test(v)) return 'grp';
    if (R.pct.test(v)) return 'pct';
    if (R.cur.test(v)) return 'cur';
    if (R.isot.test(v)) return 'isot';
    if (R.iso.test(v)) return 'iso';
    if (R.dmy.test(v)) return 'dmy';
    if (R.txtdate.test(v)) return 'txtdate';
    if (R.email.test(v)) return 'email';
    if (R.url.test(v)) return 'url';
    if (v.indexOf('@') > 0 && !/\s/.test(v)) return 'bademail';
    return 'text';
  }
  LABEL.bademail = 'email-like but broken';
  function num(v) { return parseFloat(v.replace(/[,$€£₹¥%\s]/g, '')); }
  function mask(v) { return v.length > 24 ? null : v.replace(/[A-Z]/g, 'A').replace(/[a-z]/g, 'a').replace(/[0-9]/g, '9'); }

  var ID = /(^|[_\s.\-])(id|code|no|num|key|number|uuid)$|^(id|uuid|key)$|e-?mail/i;
  function profile(name, vals) {
    var idLike = ID.test(name.trim()) || /[a-z](Id|ID|Code|No)$/.test(name.trim());
    var n = vals.length, empty = 0, ph = 0, ws = 0, inv = 0, counts = new Map(), capped = false, cls = {}, lens = [Infinity, 0];
    var nums = [], isoDates = [], masks = new Map(), lower = new Map();
    for (var i = 0; i < n; i++) {
      var raw = vals[i] == null ? '' : vals[i];
      if (/[​-‍⁠﻿­ ]/.test(raw)) inv++;
      var v = raw.trim();
      if (!v) { empty++; continue; }
      if (PH.test(v)) { ph++; continue; }
      if (v !== raw) ws++;
      if (!capped) { counts.set(v, (counts.get(v) || 0) + 1); if (counts.size > 200000) capped = true; }
      var c = classify(v);
      cls[c] = (cls[c] || 0) + 1;
      if (v.length < lens[0]) lens[0] = v.length;
      if (v.length > lens[1]) lens[1] = v.length;
      if (NUM[c]) { var x = num(v); if (isFinite(x)) nums.push(x); }
      if (c === 'iso' || c === 'isot') isoDates.push(v.slice(0, 10));
      if (masks.size < 5000) { var m = mask(v); if (m) masks.set(m, (masks.get(m) || 0) + 1); }
      if (!capped) { var lo = v.toLowerCase(), set = lower.get(lo); if (!set) lower.set(lo, set = new Set()); set.add(v); }
    }
    var filled = n - empty - ph;
    // column type
    var type = 'empty', fam = null;
    if (filled) {
      var best = Object.keys(cls).sort(function (a, b) { return cls[b] - cls[a]; })[0];
      var numN = 0, dateN = 0;
      Object.keys(cls).forEach(function (k) { if (NUM[k]) numN += cls[k]; if (DATE[k]) dateN += cls[k]; });
      if (cls[best] / filled >= 0.95) type = best;
      else if (numN / filled >= 0.95) { type = 'number'; fam = 'num'; }
      else if (dateN / filled >= 0.95) { type = 'date'; fam = 'date'; }
      else type = 'mixed';
      if (type === 'int' && (cls.int || 0) === filled && counts.size === 2 && Array.from(counts.keys()).every(function (k) { return k === '0' || k === '1'; })) type = 'bool';
    }
    var tlabel = type === 'number' ? 'number, mixed formats' : type === 'date' ? 'date, mixed formats' : type === 'mixed' ? 'mixed' : type === 'empty' ? 'empty' : LABEL[type];
    var distinct = counts.size;
    var top = Array.from(counts.entries()).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 5);
    var pats = Array.from(masks.entries()).sort(function (a, b) { return b[1] - a[1]; });
    var st = {};
    if (nums.length) {
      nums.sort(function (a, b) { return a - b; });
      var q = function (p) { var k = (nums.length - 1) * p, f = Math.floor(k); return nums[f] + (nums[Math.min(f + 1, nums.length - 1)] - nums[f]) * (k - f); };
      var sum = 0; nums.forEach(function (x) { sum += x; });
      st.min = nums[0]; st.max = nums[nums.length - 1];
      if (!idLike && !/pin|zip|postal|phone|mobile|code/i.test(name)) { st.mean = sum / nums.length; st.median = q(0.5); }
      var q1 = q(0.25), q3 = q(0.75), iqr = q3 - q1;
      st.outliers = iqr > 0 && !idLike && !/pin|zip|postal|phone|mobile|code/i.test(name) ? nums.filter(function (x) { return x < q1 - 3 * iqr || x > q3 + 3 * iqr; }) : [];
    }
    if (isoDates.length) { isoDates.sort(); st.dmin = isoDates[0]; st.dmax = isoDates[isoDates.length - 1]; }
    // issues
    var iss = [];
    function add(level, text) { iss.push([level, text]); }
    if (type === 'empty') add('bad', 'Every value is empty.');
    if (empty && type !== 'empty') add(empty / n > 0.2 ? 'bad' : 'warn', T.plural(empty, 'empty value') + ' (' + pct(empty, n) + ').');
    if (ph) add('warn', T.plural(ph, 'placeholder') + ' like N/A, null or "-" stored as text. These look filled but carry no value.');
    if (ws) add('warn', T.plural(ws, 'value') + ' with spaces at the start or end.');
    if (inv) add('warn', T.plural(inv, 'value') + ' with invisible characters (zero-width or non-breaking spaces).');
    if (type === 'mixed' || fam) {
      var parts = Object.keys(cls).sort(function (a, b) { return cls[b] - cls[a]; }).slice(0, 4).map(function (k) { return LABEL[k] + ' ' + T.n(cls[k]); });
      add('warn', 'More than one format: ' + parts.join(', ') + '.');
    } else if (filled) {
      var odd = filled - (cls[type] || 0);
      if (odd) {
        var others = Object.keys(cls).filter(function (k) { return k !== type; }).map(function (k) { return LABEL[k] + ' ' + T.n(cls[k]); });
        add('warn', T.plural(odd, 'value') + ' not in the main format: ' + others.join(', ') + '.');
      }
    }
    if (cls.bademail) add('bad', (cls.bademail === 1 ? '1 value looks' : T.n(cls.bademail) + ' values look') + ' like an email address but is not valid.'.replace('is not', cls.bademail === 1 ? 'is not' : 'are not'));
    if (cls.grp && type !== 'grp') add('warn', T.plural(cls.grp, 'number') + ' written with thousands separators, which most tools read as text.');
    if (cls.dmy) add('warn', T.plural(cls.dmy, 'date') + ' like 05/01/2026. Day-first or month-first is ambiguous; the <a href="/tools/date-normalizer/">date normalizer</a> can fix these.');
    if (st.outliers && st.outliers.length) add('warn', T.plural(st.outliers.length, 'extreme value') + ' far outside the typical range (beyond 3 × IQR), e.g. ' + fmt(st.outliers[st.outliers.length - 1]) + '.');
    var variants = 0, vex = null;
    lower.forEach(function (set) { if (set.size > 1) { variants++; if (!vex) vex = Array.from(set).slice(0, 3); } });
    if (variants) add('warn', T.plural(variants, 'value') + ' written in different letter case, e.g. ' + vex.map(function (x) { return '"' + T.esc(x) + '"'; }).join(', ') + '.');
    if (idLike && filled > 5 && !capped && distinct / filled >= 0.8 && distinct < filled) {
      var rep = top.filter(function (t) { return t[1] > 1; }).slice(0, 3).map(function (t) { return '"' + T.esc(t[0]) + '"'; });
      add('bad', 'Looks like a key, but ' + T.plural(filled - distinct, 'value') + (filled - distinct === 1 ? ' repeats' : ' repeat') + (rep.length ? ', e.g. ' + rep.join(', ') : '') + '.');
    }
    if (distinct === 1 && filled > 1) add('warn', 'Only one distinct value. This column may not be useful.');
    if (type === 'lead0' || (cls.lead0 && (cls.int || 0) > 0)) add('warn', 'Leading zeros matter here. Opening this file in Excel will strip them unless you import the column as text.');
    return { idLike: idLike, name: name, n: n, filled: filled, empty: empty, ph: ph, distinct: distinct, capped: capped, type: type, tlabel: tlabel,
      top: top, pats: pats.slice(0, 5), npats: masks.size, lens: lens, st: st, iss: iss, cls: cls };
  }
  function pct(a, b) { return b ? (100 * a / b < 1 && a ? '<1' : Math.round(100 * a / b)) + '%' : '0%'; }
  function fmt(x) { return Math.abs(x) >= 1e6 || (Math.abs(x) < 0.01 && x !== 0) ? x.toExponential(2) : (Math.round(x * 100) / 100).toLocaleString('en-US'); }

  function go() {
    if (S.isEmpty()) { T.say(say, 'Paste a CSV or upload one first.', 'warn'); return; }
    T.say(say, '');
    var tb = S.table();
    if (!tb.rows.length) { T.say(say, 'There are no data rows under the header.', 'warn'); return; }
    run.disabled = true;
    var tick = T.progress(prog), cols = [], c = 0, t0 = performance.now();
    function step() {
      var vals = tb.rows.map(function (r) { return r[c]; });
      cols.push(profile(tb.headers[c], vals));
      c++; tick(c, tb.headers.length);
      if (c < tb.headers.length) setTimeout(step, 0);
      else done();
    }
    function done() {
      var seen = new Set(), dupRows = 0, emptyRows = 0, cells = 0, filled = 0;
      tb.rows.forEach(function (r) {
        var k = r.join('\u0001'); if (seen.has(k)) dupRows++; else seen.add(k);
        if (r.every(function (v) { return !v || !v.trim(); })) emptyRows++;
      });
      cols.forEach(function (p) { cells += p.n; filled += p.filled; });
      last = { cols: cols, rows: tb.rows.length, dupRows: dupRows, emptyRows: emptyRows, complete: cells ? filled / cells : 0, ms: performance.now() - t0, unclosed: tb.unclosed };
      prog.hidden = true; run.disabled = false;
      render(); out.hidden = false;
    }
    setTimeout(step, 30);
  }

  function render() {
    var L = last, issues = 0;
    L.cols.forEach(function (p) { issues += p.iss.length; });
    $('#stats').innerHTML =
      '<div><b>' + T.n(L.rows) + '</b><span>rows</span></div>' +
      '<div><b>' + T.n(L.cols.length) + '</b><span>columns</span></div>' +
      '<div class="' + (L.complete > 0.97 ? 'ok' : 'warn') + '"><b>' + (Math.floor(L.complete * 1000) / 10) + '%</b><span>cells filled</span></div>' +
      '<div class="' + (L.dupRows ? 'warn' : 'ok') + '"><b>' + T.n(L.dupRows) + '</b><span>duplicate rows</span></div>' +
      '<div class="' + (issues ? 'warn' : 'ok') + '"><b>' + T.n(issues) + '</b><span>things to check</span></div>';
    var extra = [];
    if (L.emptyRows) extra.push(T.plural(L.emptyRows, 'row') + ' completely empty.');
    if (L.dupRows) extra.push(T.plural(L.dupRows, 'row') + ' exactly repeat an earlier row. The <a href="/tools/remove-duplicates/">deduplicator</a> can drop them.');
    if (L.unclosed) extra.push('A quote is opened and never closed, so the end of the file may have been read as one cell.');
    $('#overall').innerHTML = extra.length ? '<div class="tsay warn">' + extra.join(' ') + '</div>' : '';
    $('#glance').innerHTML = '<div class="bd-t">Every column at a glance: how full it is, and how many things to check</div><div class="gl">' + L.cols.map(function (p, i) {
      var fp = p.n ? p.filled / p.n : 0, bad = p.iss.filter(function (x) { return x[0] === 'bad'; }).length;
      return '<a class="gl-r" href="#pc' + i + '"><span class="gl-n">' + T.esc(p.name) + '</span><span class="gl-b"><i style="width:' + (fp * 100) + '%"></i>' + (p.ph ? '<i class="ph" style="width:' + (100 * p.ph / p.n) + '%"></i>' : '') + '</span><span class="gl-p">' + Math.round(fp * 100) + '%</span>' +
        '<span class="tag2 ' + (bad ? 'bad' : p.iss.length ? 'warn' : 'ok') + '">' + (p.iss.length ? T.plural(p.iss.length, 'issue') : 'clean') + '</span></a>';
    }).join('') + '</div>';
    $('#cards').innerHTML = L.cols.map(card).join('');
  }

  function card(p) {
    var fp = p.n ? p.filled / p.n : 0;
    var kv = [['Filled', T.n(p.filled) + ' of ' + T.n(p.n)], ['Distinct', (p.capped ? '200,000+' : T.n(p.distinct)) + (p.distinct === p.filled && p.filled > 1 ? ' · all unique' : '')]];
    var code = p.idLike || /pin|zip|postal|phone|mobile|code|year/i.test(p.name) || (p.type === 'int' && p.lens[0] === p.lens[1]);
    var f = code ? String : fmt;
    if (p.st.min != null) kv.push(['Min / max', f(p.st.min) + ' / ' + f(p.st.max)]);
    if (p.st.mean != null && !code) kv.push(['Mean / median', fmt(p.st.mean) + ' / ' + fmt(p.st.median)]);
    if (p.st.dmin) kv.push(['Earliest / latest', p.st.dmin + ' / ' + p.st.dmax]);
    if (p.filled) kv.push(['Length', p.lens[0] === p.lens[1] ? p.lens[0] + ' characters' : p.lens[0] + ' to ' + p.lens[1] + ' characters']);
    var topMax = p.top.length ? p.top[0][1] : 1;
    var showPats = p.npats > 1 && p.npats <= Math.max(6, p.filled * 0.3) && p.type !== 'text';
    return '<article class="pcol" id="pc' + last.cols.indexOf(p) + '">' +
      '<header><h3>' + T.esc(p.name) + '</h3><span class="tag2 ' + (p.type === 'mixed' || p.type === 'empty' ? 'warn' : 'blue') + '">' + T.esc(p.tlabel) + '</span></header>' +
      '<div class="pbar" title="' + Math.round(fp * 100) + '% filled"><i style="width:' + (fp * 100) + '%"></i>' + (p.ph ? '<i class="ph" style="width:' + (100 * p.ph / p.n) + '%"></i>' : '') + '</div>' +
      '<dl class="pkv">' + kv.map(function (x) { return '<div><dt>' + x[0] + '</dt><dd>' + x[1] + '</dd></div>'; }).join('') + '</dl>' +
      (p.top.length ? '<div class="ptop"><b>Most common</b>' + p.top.map(function (t) {
        return '<div><span>' + T.esc(t[0]) + '</span><i style="--w:' + (100 * t[1] / topMax) + '%"></i><em>' + T.n(t[1]) + '</em></div>';
      }).join('') + '</div>' : '') +
      (showPats ? '<div class="ptop pat"><b>Shapes</b>' + p.pats.map(function (t) { return '<div><span>' + T.esc(t[0]) + '</span><em>' + T.n(t[1]) + '</em></div>'; }).join('') + '</div>' : '') +
      (p.iss.length ? '<ul class="piss">' + p.iss.map(function (x) { return '<li class="' + x[0] + '">' + x[1] + '</li>'; }).join('') + '</ul>' : '<p class="pok">No problems found.</p>') +
      '</article>';
  }

  function plain(h) { return h.replace(/<[^>]+>/g, ''); }
  function summaryRows() {
    return last.cols.map(function (p) {
      return [p.name, p.tlabel, p.n, p.filled, p.n ? Math.round(1000 * p.filled / p.n) / 10 : 0, p.empty, p.ph, p.capped ? '200000+' : p.distinct,
        p.st.min != null ? p.st.min : p.st.dmin || '', p.st.max != null ? p.st.max : p.st.dmax || '', p.st.mean != null ? Math.round(p.st.mean * 100) / 100 : '',
        p.st.median != null ? p.st.median : '', p.filled ? p.lens[0] : '', p.filled ? p.lens[1] : '', p.iss.map(function (x) { return plain(x[1]); }).join(' | ')];
    });
  }
  var HEAD = ['column', 'type', 'rows', 'filled', 'filled_pct', 'empty', 'placeholders', 'distinct', 'min', 'max', 'mean', 'median', 'min_length', 'max_length', 'issues'];
  $('#dl').addEventListener('click', function () { T.download('data-profile.csv', T.toCSV(HEAD, summaryRows()), 'text/csv'); });
  $('#md').addEventListener('click', function (e) {
    var lines = ['| Column | Type | Filled | Distinct | Issues |', '|---|---|---|---|---|'];
    last.cols.forEach(function (p) {
      lines.push('| ' + [p.name, p.tlabel, pct(p.filled, p.n), p.capped ? '200,000+' : T.n(p.distinct), p.iss.map(function (x) { return plain(x[1]); }).join(' ') || 'none'].map(function (x) { return String(x).replace(/\|/g, '\\|'); }).join(' | ') + ' |');
    });
    T.copy('Data profile: ' + T.n(last.rows) + ' rows, ' + last.cols.length + ' columns, ' + T.n(last.dupRows) + ' duplicate rows.\n\n' + lines.join('\n') + '\n', e.currentTarget);
  });
})();
