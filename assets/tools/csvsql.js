/* CSV to SQL: CREATE TABLE with inferred types + batched INSERTs. gibin.in/tools/csv-to-sql/ */
(function () {
  'use strict';
  var $ = T.$, tool = $('#tool');
  var SAMPLE = 'Order ID,Customer Name,Email,Order Date,Amount,Paid,Pincode,Notes\n' +
      '1001,Priya Raman,priya.raman@example.com,2026-01-04,1250.00,true,600042,\n' +
      '1002,Arjun Mehta,arjun.m@example.com,2026-01-05,899.50,false,400050,"Call before delivery"\n' +
      '1003,Sara Thomas,sara.thomas@example.com,2026-01-05,2400,true,682001,\n' +
      '1004,Rahul O\'Neil,rahul@example.com,2026-01-06,760.25,true,060001,"Gift wrap, no invoice"\n' +
      '1005,Meera Iyer,,2026-01-06,1430.00,false,500081,\n';
  var S = T.source($('[data-src=d]', tool), { sample: { name: 'orders-sample.csv', text: SAMPLE },  onChange: function () { if (S) guessName(); } });
  var say = $('#say'), out = $('#out'), run = $('#run'), sqlBox = $('#sql');
  var state = null, gen = '';

  function guessName() {
    if (T.$('.src-file', S.el).hidden) return;
    var f = T.$('.src-fname', S.el).textContent;
    if (f && !$('#tname').dataset.touched) $('#tname').value = clean(f.replace(/\s·.*$/, '').replace(/\.[^.]+$/, '')) || 'my_table';
  }
  $('#tname').addEventListener('input', function () { this.dataset.touched = '1'; });

  $('[data-sample]', tool).addEventListener('click', function () {
    S.set(SAMPLE);
    $('#tname').value = 'orders'; $('#tname').dataset.touched = '1';
    setTimeout(go, 0);
  });
  run.addEventListener('click', go);
  T.$$('[data-regen]', tool).forEach(function (el) { el.addEventListener('change', function () { if (state) { if (el.id === 'dialect' || el.id === 'o-clean') retype(); build(); } }); });
  $('#tname').addEventListener('change', function () { if (state) build(); });

  /* ---------- names and quoting ---------- */
  function clean(s) {
    s = String(s).normalize('NFKD').replace(/[̀-ͯ]/g, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    if (!s) s = 'col';
    if (/^\d/.test(s)) s = '_' + s;
    return s.slice(0, 63);
  }
  function q(name, d) {
    if (d === 'mysql') return '`' + name.replace(/`/g, '``') + '`';
    if (d === 'mssql') return '[' + name.replace(/]/g, ']]') + ']';
    return '"' + name.replace(/"/g, '""') + '"';
  }
  function lit(v, d) {
    var s = String(v);
    if (d === 'mysql') s = s.replace(/\\/g, '\\\\');
    s = "'" + s.replace(/'/g, "''") + "'";
    return d === 'mssql' ? 'N' + s : s;
  }

  /* ---------- type inference ---------- */
  var RX = { int: /^-?(0|[1-9]\d*)$/, dec: /^-?(0|[1-9]\d*)?\.\d+$|^-?(0|[1-9]\d*)\.$/, sci: /^-?\d+(\.\d+)?[eE][-+]?\d+$/,
    bool: /^(true|false)$/i, date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
    ts: /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?$/, tstz: /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?(Z|[+-]\d{2}:?\d{2})$/ };
  var I32 = 2147483647;

  function infer(vals) {
    var k = { int: true, dec: true, sci: true, bool: true, date: true, ts: true, tstz: true }, any = false, maxLen = 0, empties = 0, big = false, huge = false, ip = 0, fp = 0;
    for (var i = 0; i < vals.length; i++) {
      var v = vals[i] == null ? '' : vals[i].trim();
      if (!v) { empties++; continue; }
      any = true;
      if (vals[i].length > maxLen) maxLen = vals[i].length;
      if (k.int && !RX.int.test(v)) k.int = false;
      if (k.int) { var digits = v.replace('-', ''); if (digits.length > 18) huge = true; else if (Math.abs(+v) > I32) big = true; }
      var isNum = RX.int.test(v) || RX.dec.test(v);
      if (k.dec && !isNum) k.dec = false;
      if (k.dec && isNum) { var parts = v.replace('-', '').split('.'); ip = Math.max(ip, parts[0].replace(/^0+(?=\d)/, '').length); fp = Math.max(fp, (parts[1] || '').length); }
      if (k.sci && !(isNum || RX.sci.test(v))) k.sci = false;
      if (k.bool && !RX.bool.test(v)) k.bool = false;
      if (k.date && !(RX.date.test(v) && validDate(v))) k.date = false;
      if (k.ts && !(RX.ts.test(v) || (RX.date.test(v) && validDate(v)))) k.ts = false;
      if (k.tstz && !RX.tstz.test(v)) k.tstz = false;
    }
    var base;
    if (!any) base = 'text';
    else if (k.bool) base = 'bool';
    else if (k.int) base = huge ? 'numeric' : big ? 'bigint' : 'int';
    else if (k.dec) base = (ip + fp) > 38 ? 'text' : 'decimal';
    else if (k.sci) base = 'float';
    else if (k.date) base = 'date';
    else if (k.ts) base = 'timestamp';
    else if (k.tstz) base = 'timestamptz';
    else base = 'text';
    return { base: base, ip: ip, fp: fp, maxLen: maxLen, empties: empties, digits: huge ? 38 : 0 };
  }
  function validDate(v) { var d = new Date(v + 'T00:00:00Z'); return !isNaN(d) && d.toISOString().slice(0, 10) === v; }
  function vlen(n) { var steps = [16, 32, 64, 128, 255, 512, 1000, 2000, 4000]; for (var i = 0; i < steps.length; i++) if (n <= steps[i]) return steps[i]; return 0; }

  function typeName(t, d) {
    var p = Math.min(38, Math.max(t.ip + t.fp, 1)), s = t.fp;
    var M = {
      pg: { int: 'INTEGER', bigint: 'BIGINT', numeric: 'NUMERIC(38,0)', decimal: 'NUMERIC(' + p + ',' + s + ')', float: 'DOUBLE PRECISION', bool: 'BOOLEAN', date: 'DATE', timestamp: 'TIMESTAMP', timestamptz: 'TIMESTAMPTZ' },
      mysql: { int: 'INT', bigint: 'BIGINT', numeric: 'DECIMAL(38,0)', decimal: 'DECIMAL(' + p + ',' + s + ')', float: 'DOUBLE', bool: 'BOOLEAN', date: 'DATE', timestamp: 'DATETIME', timestamptz: null },
      sqlite: { int: 'INTEGER', bigint: 'INTEGER', numeric: 'NUMERIC', decimal: 'NUMERIC', float: 'REAL', bool: 'INTEGER', date: 'TEXT', timestamp: 'TEXT', timestamptz: 'TEXT' },
      mssql: { int: 'INT', bigint: 'BIGINT', numeric: 'DECIMAL(38,0)', decimal: 'DECIMAL(' + p + ',' + s + ')', float: 'FLOAT', bool: 'BIT', date: 'DATE', timestamp: 'DATETIME2', timestamptz: 'DATETIMEOFFSET' }
    };
    var name = M[d][t.base];
    if (name) return name;
    var n = vlen(Math.max(t.maxLen, 1));
    if (d === 'pg' || d === 'sqlite') return 'TEXT';
    if (d === 'mysql') return n ? 'VARCHAR(' + n + ')' : t.maxLen <= 65535 ? 'TEXT' : 'LONGTEXT';
    return n ? 'NVARCHAR(' + n + ')' : 'NVARCHAR(MAX)';
  }

  /* ---------- flow ---------- */
  function go() {
    if (S.isEmpty()) { T.say(say, 'Paste a CSV or upload one first.', 'warn'); return; }
    var tb = S.table();
    if (!tb.rows.length) { T.say(say, 'There are no data rows under the header.', 'warn'); return; }
    T.say(say, tb.unclosed ? 'A quote is opened and never closed in this file, so the last rows may have been read as one cell. Check the preview.' : '', 'warn');
    var cols = tb.headers.map(function (h, i) {
      return { src: h, inf: infer(tb.rows.map(function (r) { return r[i]; })), sample: (tb.rows.find(function (r) { return r[i] && r[i].trim(); }) || [])[i] || '' };
    });
    state = { tb: tb, cols: cols };
    retype();
    var pk = $('#pk');
    pk.innerHTML = '<option value="">None</option>' + cols.map(function (c, i) { return '<option value="' + i + '">' + T.esc(c.src) + '</option>'; }).join('');
    var guess = cols.findIndex(function (c) { return /(^|[_\s])id$|^id$/i.test(c.src.trim()) && (c.inf.base === 'int' || c.inf.base === 'bigint'); });
    if (guess >= 0) pk.value = String(guess);
    out.hidden = false;
    build();
  }

  function retype() {
    var d = $('#dialect').value, cl = $('#o-clean').checked, used = {};
    state.cols.forEach(function (c) {
      var n = cl ? clean(c.src) : c.src.trim() || 'col', base = n, k = 2;
      while (used[n.toLowerCase()]) n = base + '_' + (k++);
      used[n.toLowerCase()] = 1;
      c.name = n; c.type = typeName(c.inf, d); c.nullable = c.inf.empties > 0;
    });
    editor();
  }

  function editor() {
    var box = $('#cols');
    box.innerHTML = '<div class="tgrid-wrap" style="max-height:none"><table class="tgrid"><thead><tr><th>CSV column</th><th>SQL column</th><th>Type</th><th>Null</th><th>Example</th></tr></thead><tbody>' +
      state.cols.map(function (c, i) {
        return '<tr><td class="dim">' + T.esc(c.src) + '</td><td><input type="text" class="mono-in" data-c="' + i + '" data-f="name" value="' + T.esc(c.name) + '" aria-label="SQL name for ' + T.esc(c.src) + '"></td>' +
          '<td><input type="text" class="mono-in" data-c="' + i + '" data-f="type" value="' + T.esc(c.type) + '" aria-label="SQL type for ' + T.esc(c.src) + '" style="width:12em"></td>' +
          '<td><input type="checkbox" data-c="' + i + '" data-f="nullable"' + (c.nullable ? ' checked' : '') + ' aria-label="Allow NULL in ' + T.esc(c.src) + '"></td>' +
          '<td class="dim">' + T.esc(c.sample.length > 40 ? c.sample.slice(0, 40) + '…' : c.sample) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  $('#cols').addEventListener('change', function (e) {
    var el = e.target, i = el.getAttribute('data-c'); if (i == null) return;
    var c = state.cols[+i], f = el.getAttribute('data-f');
    if (f === 'nullable') c.nullable = el.checked; else c[f] = el.value.trim() || c[f];
    build();
  });

  function valueSQL(v, c, d, emptyNull) {
    if (v == null || v === '' || (v.trim() === '' && emptyNull)) return emptyNull ? 'NULL' : lit(v || '', d);
    var t = c.type.toUpperCase(), tv = v.trim();
    if (/^(BOOL|BOOLEAN|BIT)$/.test(t) || (d === 'sqlite' && c.inf.base === 'bool' && t === 'INTEGER')) {
      if (/^(true|1)$/i.test(tv)) return d === 'pg' || d === 'mysql' ? 'TRUE' : '1';
      if (/^(false|0)$/i.test(tv)) return d === 'pg' || d === 'mysql' ? 'FALSE' : '0';
    }
    if (/INT|NUMERIC|DECIMAL|REAL|FLOAT|DOUBLE/.test(t) && /^-?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(tv) && !/^-?0\d/.test(tv)) return tv;
    return lit(v, d);
  }

  function build() {
    var d = $('#dialect').value, tb = state.tb, cols = state.cols;
    var tn = $('#tname').value.trim() || 'my_table'; if ($('#o-clean').checked) tn = clean(tn);
    var T1 = q(tn, d), L = [], emptyNull = $('#o-null').checked, tx = $('#o-tx').checked;
    var batch = +$('#batch').value; if (d === 'mssql') batch = Math.min(batch, 1000);
    var pk = $('#pk').value, warn = [];
    if ($('#o-drop').checked) L.push(d === 'mssql' ? "IF OBJECT_ID(N'" + tn.replace(/'/g, "''") + "', N'U') IS NOT NULL DROP TABLE " + T1 + ';' : 'DROP TABLE IF EXISTS ' + T1 + ';');
    if ($('#o-create').checked) {
      var defs = cols.map(function (c, i) { return '  ' + q(c.name, d) + ' ' + c.type + (c.nullable && String(i) !== pk ? '' : ' NOT NULL'); });
      if (pk !== '') {
        defs.push('  PRIMARY KEY (' + q(cols[+pk].name, d) + ')');
        var seen = new Set(), dup = 0, emp = 0;
        tb.rows.forEach(function (r) { var v = (r[+pk] || '').trim(); if (!v) emp++; else if (seen.has(v)) dup++; else seen.add(v); });
        if (dup || emp) warn.push('The primary key column has ' + (dup ? T.plural(dup, 'repeated value') : '') + (dup && emp ? ' and ' : '') + (emp ? T.plural(emp, 'empty value') : '') + '. The INSERT will fail on those rows.');
      }
      cols.forEach(function (c, i) { if (!c.nullable && c.inf.empties && String(i) !== pk) warn.push('"' + c.name + '" is NOT NULL but has ' + T.plural(c.inf.empties, 'empty value') + '.'); });
      L.push('CREATE TABLE ' + ($('#o-drop').checked || d === 'mssql' ? '' : 'IF NOT EXISTS ') + T1 + ' (\n' + defs.join(',\n') + '\n);');
    }
    var nIns = 0;
    if ($('#o-insert').checked && tb.rows.length) {
      if (tx) L.push(d === 'mysql' ? 'START TRANSACTION;' : d === 'pg' ? 'BEGIN;' : 'BEGIN TRANSACTION;');
      var head = 'INSERT INTO ' + T1 + ' (' + cols.map(function (c) { return q(c.name, d); }).join(', ') + ') VALUES\n';
      for (var s = 0; s < tb.rows.length; s += batch) {
        var part = [];
        for (var r = s; r < Math.min(s + batch, tb.rows.length); r++) {
          var row = tb.rows[r];
          part.push('  (' + cols.map(function (c, i) { return valueSQL(row[i], c, d, emptyNull); }).join(', ') + ')');
        }
        L.push(head + part.join(',\n') + ';');
        nIns++;
      }
      if (tx) L.push('COMMIT;');
    }
    gen = L.join('\n\n') + '\n';
    var lim = 300000;
    sqlBox.textContent = gen.length > lim ? gen.slice(0, lim) + '\n\n-- Preview cut at 300 KB. Copy or download to get all ' + T.bytes(gen.length) + '.' : gen;
    $('#meta').textContent = T.plural(tb.rows.length, 'row') + ' · ' + T.plural(nIns, 'INSERT statement') + ' · ' + T.bytes(new Blob([gen]).size);
    T.say(say, warn.join(' '), 'warn');
  }

  $('#copy').addEventListener('click', function (e) { T.copy(gen, e.currentTarget); });
  $('#dl').addEventListener('click', function () { T.download(T.fname($('#tname').value || 'table', 'sql'), gen, 'application/sql'); });
})();
