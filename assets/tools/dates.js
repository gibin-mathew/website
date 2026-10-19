/* Messy date normalizer. gibin.in/tools/date-normalizer/ */
(function () {
  'use strict';
  var D = {};
  var MON = { jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8,
    sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12 };
  var MNAME = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var WD = /^(mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)(day|nesday|rsday|urday)?\.?,?\s+/i;
  var TIME = '(?:[T\\s,]+(\\d{1,2})[:.](\\d{2})(?:[:.](\\d{2})(?:\\.(\\d{1,9}))?)?\\s*([ap]\\.?m\\.?)?\\s*(z|utc|gmt|[+-]\\d{2}:?\\d{2})?)?';
  var RX = {
    iso: new RegExp('^(\\d{4})-(\\d{1,2})-(\\d{1,2})' + TIME + '$', 'i'),
    ymd: new RegExp('^(\\d{4})[\\/.](\\d{1,2})[\\/.](\\d{1,2})' + TIME + '$', 'i'),
    compact: /^(\d{4})(\d{2})(\d{2})$/,
    num: new RegExp('^(\\d{1,2})[\\/.\\-](\\d{1,2})[\\/.\\-](\\d{4}|\\d{2})' + TIME + '$', 'i'),
    dmyT: new RegExp('^(\\d{1,2})[\\s\\-\\/.]*([a-z]{3,9})\\.?[\\s\\-\\/.,]*(\\d{4}|\\d{2})' + TIME + '$', 'i'),
    mdyT: new RegExp('^([a-z]{3,9})\\.?[\\s\\-\\/.]*(\\d{1,2})[\\s,\\-\\/.]+(\\d{4}|\\d{2})' + TIME + '$', 'i'),
    ymdT: /^(\d{4})[\s\-\/.]([a-z]{3,9})\.?[\s\-\/.](\d{1,2})$/i,
    myT: /^([a-z]{3,9})\.?[\s\-\/.,]*(\d{4})$/i,
    unix: /^\d{10}$/, unixms: /^\d{13}$/, excel: /^\d{5}(\.\d+)?$/
  };

  function y2(y, pivot) { return y < pivot ? 2000 + y : 1900 + y; }
  function valid(y, m, d) { if (m < 1 || m > 12 || d < 1) return false; return d <= new Date(Date.UTC(y, m, 0)).getUTCDate(); }
  function time(r, mm, i) {
    // r: match, i: index of hour group
    if (r[i] == null) return null;
    var h = +r[i], mi = +r[i + 1], s = r[i + 2] ? +r[i + 2] : 0, ms = r[i + 3] ? Math.round(+('0.' + r[i + 3]) * 1000) : 0, ap = r[i + 4], tz = r[i + 5];
    if (ap) { ap = ap[0].toLowerCase(); if (h < 1 || h > 12) return { bad: 'hour ' + h + ' with AM/PM' }; if (ap === 'p' && h < 12) h += 12; if (ap === 'a' && h === 12) h = 0; }
    if (h > 23 || mi > 59 || s > 59) return { bad: 'time ' + r[i] + ':' + r[i + 1] + ' does not exist' };
    var off = null;
    if (tz) { tz = tz.toLowerCase(); if (tz === 'z' || tz === 'utc' || tz === 'gmt') off = 0; else { var t = tz.replace(':', ''); off = (t[0] === '-' ? -1 : 1) * (+t.slice(1, 3) * 60 + +t.slice(3, 5)); } }
    return { h: h, mi: mi, s: s, ms: ms, off: off };
  }

  /* order: 'dmy' | 'mdy' for numeric a/b/c dates */
  D.parse = function (raw, o) {
    o = o || {};
    var pivot = o.pivot == null ? 50 : o.pivot, order = o.order || 'dmy';
    var s = String(raw).trim().replace(/\s+/g, ' ');
    if (!s) return { empty: true };
    s = s.replace(WD, '').replace(/(\d)(st|nd|rd|th)\b/gi, '$1').replace(/\bof\b\s*/i, '');
    var r, y, m, d, t = null, how, flags = [];
    function done() {
      if (!valid(y, m, d)) return { err: (m < 1 || m > 12 ? 'month ' + m + ' does not exist' : 'day ' + d + ' does not exist in ' + MNAME[m - 1] + ' ' + y), how: how };
      if (t && t.bad) return { err: t.bad, how: how };
      return { y: y, m: m, d: d, t: t, how: how, flags: flags };
    }
    if ((r = RX.iso.exec(s))) { y = +r[1]; m = +r[2]; d = +r[3]; t = time(r, 0, 4); how = 'ISO year-month-day'; return done(); }
    if ((r = RX.ymd.exec(s))) { y = +r[1]; m = +r[2]; d = +r[3]; t = time(r, 0, 4); how = 'year/month/day'; return done(); }
    if ((r = RX.num.exec(s))) {
      var a = +r[1], b = +r[2]; y = r[3].length === 2 ? y2(+r[3], pivot) : +r[3];
      if (r[3].length === 2) flags.push('2-digit year');
      if (a > 12 && b <= 12) { d = a; m = b; how = 'day/month/year'; }
      else if (b > 12 && a <= 12) { m = a; d = b; how = 'month/day/year'; }
      else if (order === 'mdy') { m = a; d = b; how = 'month/day/year'; if (a !== b) flags.push('ambiguous'); }
      else { d = a; m = b; how = 'day/month/year'; if (a !== b) flags.push('ambiguous'); }
      t = time(r, 0, 4); return done();
    }
    if ((r = RX.dmyT.exec(s)) && MON[r[2].toLowerCase()]) {
      d = +r[1]; m = MON[r[2].toLowerCase()]; y = r[3].length === 2 ? y2(+r[3], pivot) : +r[3]; if (r[3].length === 2) flags.push('2-digit year');
      t = time(r, 0, 4); how = 'day month year'; return done();
    }
    if ((r = RX.mdyT.exec(s)) && MON[r[1].toLowerCase()]) {
      m = MON[r[1].toLowerCase()]; d = +r[2]; y = r[3].length === 2 ? y2(+r[3], pivot) : +r[3]; if (r[3].length === 2) flags.push('2-digit year');
      t = time(r, 0, 4); how = 'month day year'; return done();
    }
    if ((r = RX.ymdT.exec(s)) && MON[r[2].toLowerCase()]) { y = +r[1]; m = MON[r[2].toLowerCase()]; d = +r[3]; how = 'year month day'; return done(); }
    if ((r = RX.myT.exec(s)) && MON[r[1].toLowerCase()]) { y = +r[2]; m = MON[r[1].toLowerCase()]; d = 1; how = 'month year'; flags.push('no day, used the 1st'); return done(); }
    if ((r = RX.compact.exec(s)) && valid(+r[1], +r[2], +r[3]) && +r[1] >= 1900 && +r[1] <= 2100) { y = +r[1]; m = +r[2]; d = +r[3]; how = 'YYYYMMDD'; return done(); }
    if (o.unix && (RX.unix.test(s) || RX.unixms.test(s))) {
      var dt = new Date(s.length === 13 ? +s : +s * 1000);
      return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate(), t: { h: dt.getUTCHours(), mi: dt.getUTCMinutes(), s: dt.getUTCSeconds(), ms: dt.getUTCMilliseconds(), off: 0 }, how: s.length === 13 ? 'Unix milliseconds (UTC)' : 'Unix seconds (UTC)', flags: [] };
    }
    if (o.excel && RX.excel.test(s) && +s >= 20000 && +s <= 80000) {
      var n = +s, ms0 = Math.round((n - 25569) * 864e5), e = new Date(ms0);
      return { y: e.getUTCFullYear(), m: e.getUTCMonth() + 1, d: e.getUTCDate(), t: n % 1 ? { h: e.getUTCHours(), mi: e.getUTCMinutes(), s: e.getUTCSeconds(), ms: 0, off: null } : null, how: 'Excel serial number', flags: [] };
    }
    return { err: 'not a date format I recognise' };
  };

  // which order do the unambiguous rows in this column use?
  D.detectOrder = function (vals) {
    var dmy = 0, mdy = 0;
    vals.forEach(function (v) {
      var r = RX.num.exec(String(v).trim().replace(WD, '').replace(/\s+/g, ' '));
      if (!r) return;
      var a = +r[1], b = +r[2];
      if (a > 12 && b <= 12) dmy++; else if (b > 12 && a <= 12) mdy++;
    });
    return { dmy: dmy, mdy: mdy };
  };

  function pad(n, w) { n = String(n); while (n.length < (w || 2)) n = '0' + n; return n; }
  D.format = function (p, f, custom) {
    var t = p.t;
    if (f === 'iso') return p.y + '-' + pad(p.m) + '-' + pad(p.d);
    if (f === 'isodt') return p.y + '-' + pad(p.m) + '-' + pad(p.d) + ' ' + (t ? pad(t.h) + ':' + pad(t.mi) + ':' + pad(t.s) : '00:00:00');
    if (f === 'iso8601') {
      var b = p.y + '-' + pad(p.m) + '-' + pad(p.d);
      if (!t) return b;
      b += 'T' + pad(t.h) + ':' + pad(t.mi) + ':' + pad(t.s) + (t.ms ? '.' + pad(t.ms, 3) : '');
      if (t.off === 0) return b + 'Z';
      if (t.off != null) return b + (t.off < 0 ? '-' : '+') + pad(Math.floor(Math.abs(t.off) / 60)) + ':' + pad(Math.abs(t.off) % 60);
      return b;
    }
    if (f === 'unix') {
      var ms = Date.UTC(p.y, p.m - 1, p.d, t ? t.h : 0, t ? t.mi : 0, t ? t.s : 0) - (t && t.off ? t.off * 60000 : 0);
      return String(Math.floor(ms / 1000));
    }
    var tpl = { dmy: 'DD/MM/YYYY', mdy: 'MM/DD/YYYY', dmmm: 'D MMM YYYY', mmmm: 'MMMM D, YYYY', dot: 'DD.MM.YYYY' }[f] || custom || 'YYYY-MM-DD';
    return tpl.replace(/YYYY|YY|MMMM|MMM|MM|M|DD|D|HH|H|mm|ss/g, function (k) {
      switch (k) {
        case 'YYYY': return String(p.y); case 'YY': return pad(p.y % 100);
        case 'MMMM': return MNAME[p.m - 1]; case 'MMM': return MNAME[p.m - 1].slice(0, 3);
        case 'MM': return pad(p.m); case 'M': return String(p.m);
        case 'DD': return pad(p.d); case 'D': return String(p.d);
        case 'HH': return pad(t ? t.h : 0); case 'H': return String(t ? t.h : 0);
        case 'mm': return pad(t ? t.mi : 0); case 'ss': return pad(t ? t.s : 0);
      }
      return k;
    });
  };
  window.Dates = D;
  if (typeof module !== 'undefined') module.exports = D;

  /* ---------- page ---------- */
  if (typeof document === 'undefined' || !document.getElementById('tool')) return;
  var DSAMPLE = ['2026-01-15', '15/01/2026', '01/15/2026', '15-Jan-2026', 'Jan 15, 2026', '15th January 2026', 'Thursday, 15 January 2026',
      '03/04/2026', '2026/01/15', '20260115', '15.01.26', '2026-01-15T14:30:00+05:30', '15 Jan 2026 2:30 PM', 'January 2026',
      '31/02/2026', '46037', 'next Tuesday', ''];
  var $ = T.$, tool = $('#tool'), S = T.source($('[data-src=d]', tool), { sample: { name: 'dates-sample.csv', text: 'signup_date\n' + DSAMPLE.filter(Boolean).map(function (v) { return /,/.test(v) ? '"' + v + '"' : v; }).join('\n') + '\n' } }), say = $('#say'), out = $('#out'), last = null, filter = 'all';
  $('#fmt').addEventListener('change', function () { $('#custom-f').hidden = this.value !== 'custom'; if (last) go(); });
  ['#order', '#pivot', '#o-unix', '#o-excel', '#custom'].forEach(function (s) { $(s).addEventListener('change', function () { if (last) go(); }); });
  $('#run').addEventListener('click', go);
  $('[data-sample]', tool).addEventListener('click', function () {
    S.set(DSAMPLE.join('\n'));
    $('#o-excel').checked = true;
    go();
  });

  function go() {
    var E = S.entries();
    if (!E.length) { T.say(say, 'Paste some dates, one per line, or upload a CSV and pick the column.', 'warn'); return; }
    var det = D.detectOrder(E.map(function (e) { return e.v; })), sel = $('#order').value, order = sel, note = '';
    if (sel === 'auto') {
      if (det.dmy && !det.mdy) { order = 'dmy'; note = 'Read numeric dates as day/month: ' + T.plural(det.dmy, 'value') + ' only make sense that way.'; }
      else if (det.mdy && !det.dmy) { order = 'mdy'; note = 'Read numeric dates as month/day: ' + T.plural(det.mdy, 'value') + ' only make sense that way.'; }
      else if (det.dmy && det.mdy) { order = det.dmy >= det.mdy ? 'dmy' : 'mdy'; note = 'This column mixes both orders: ' + T.n(det.dmy) + ' values are clearly day/month and ' + T.n(det.mdy) + ' clearly month/day. Unclear ones were read as ' + (order === 'dmy' ? 'day/month' : 'month/day') + '. Check the flagged rows.'; }
      else { order = 'dmy'; note = 'Nothing in the column settles day/month versus month/day, so unclear dates were read as day/month. Switch "Numeric dates are" if that is wrong.'; }
    }
    var o = { order: order, pivot: +$('#pivot').value, unix: $('#o-unix').checked, excel: $('#o-excel').checked }, f = $('#fmt').value, cu = $('#custom').value || 'YYYY-MM-DD';
    var rows = E.map(function (e) {
      var p = D.parse(e.v, o), st;
      if (p.err) st = 'bad';
      else if (p.flags.length) st = p.flags.indexOf('ambiguous') >= 0 ? 'amb' : 'note';
      else st = 'ok';
      return { e: e, p: p, out: p.err ? '' : D.format(p, f, cu), st: st };
    });
    var c = { ok: 0, amb: 0, note: 0, bad: 0 }; rows.forEach(function (r) { c[r.st]++; });
    last = { rows: rows, tb: S.table(), col: S.column() };
    T.say(say, note, det.dmy && det.mdy ? 'warn' : '');
    $('#stats').innerHTML = '<div><b>' + T.n(rows.length) + '</b><span>values</span></div><div class="ok"><b>' + T.n(c.ok + c.note) + '</b><span>converted cleanly</span></div>' +
      '<div class="warn"><b>' + T.n(c.amb) + '</b><span>ambiguous, check these</span></div><div class="bad"><b>' + T.n(c.bad) + '</b><span>could not convert</span></div>';
    T.breakdown($('#bd'), [['Clean', c.ok, 'ok'], ['Converted with a note', c.note, 'ok2'], ['Ambiguous', c.amb, 'warn'], ['Failed', c.bad, 'bad']], 'Result');
    var hw = {}; rows.forEach(function (r) { var k = r.p.how || 'not recognised'; hw[k] = (hw[k] || 0) + 1; });
    var pal = ['blue', 'ok', 'ok2', 'warn', 'mute', 'bad'], hk = Object.keys(hw).sort(function (a, b) { return hw[b] - hw[a]; });
    T.breakdown($('#bd2'), hk.slice(0, 6).map(function (k, i) { return [k, hw[k], k === 'not recognised' ? 'bad' : pal[i % 5]]; }), 'Formats found in your column');
    T.chips($('#filter'), [['all', 'All', rows.length], ['amb', 'Ambiguous', c.amb], ['note', 'Notes', c.note], ['bad', 'Failed', c.bad]], function (k) { filter = k; grid(); });
    T.$$('#filter button').forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-k') === filter); });
    grid(); out.hidden = false;
  }
  function grid() {
    var R = last.rows.filter(function (r) { return filter === 'all' || r.st === filter; });
    T.grid($('#grid'), ['Input', 'Output', 'Read as', 'Note'], R, {
      empty: 'Nothing in this group.',
      rowClass: function (r) { return r.st === 'bad' ? 'bad' : r.st === 'amb' ? 'hl' : ''; },
      cell: function (r, c) {
        if (c === 0) return '<td>' + T.esc(r.e.v) + '</td>';
        if (c === 1) return '<td><b>' + T.esc(r.out) + '</b></td>';
        if (c === 2) return '<td class="dim">' + T.esc(r.p.how || '') + '</td>';
        if (r.p.err) return '<td><span class="tag2 bad">' + T.esc(r.p.err) + '</span></td>';
        return '<td>' + (r.p.flags.length ? r.p.flags.map(function (x) { return '<span class="tag2 ' + (x === 'ambiguous' ? 'warn' : '') + '">' + T.esc(x) + '</span>'; }).join(' ') : '<span class="tag2 ok">ok</span>') + '</td>';
      }
    });
  }
  function outCol(r) { return r.p.err ? '' : r.out; }
  $('#dl').addEventListener('click', function () {
    var L = last, tb = L.tb;
    if (tb.single) { T.download('dates.csv', T.toCSV(['input', 'output', 'read_as', 'note'], L.rows.map(function (r) { return [r.e.v, outCol(r), r.p.how || '', r.p.err || r.p.flags.join('; ')]; })), 'text/csv'); return; }
    var map = new Map(); L.rows.forEach(function (r) { map.set(r.e.row, r); });
    T.download('dates.csv', T.toCSV(tb.headers.concat([tb.headers[L.col] + ' (normalized)']), tb.rows.map(function (row, i) { var r = map.get(i); return row.concat([r ? outCol(r) : '']); })), 'text/csv');
  });
  $('#copy').addEventListener('click', function (e) { T.copy(last.rows.map(outCol).join('\n'), e.currentTarget); });
})();
