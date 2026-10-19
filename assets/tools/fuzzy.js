/* Fuzzy match two lists. gibin.in/tools/fuzzy-match/ */
(function () {
  'use strict';
  var $ = T.$, tool = $('#tool');
  var SA = ['Bluepeak Analytics Pvt. Ltd.', 'Riverstone Foods & Beverages', 'KALPA SYSTEMS INC', 'Orchid Health Care', 'Northfield Univ.',
      'Sundar Motors', 'Vertex Labs', 'Greenline Logistics (India)', 'Meridian Capital Partners', 'Lotus Textiles', 'Bharat Steel Works',
      'Tidewater Shipping Co.', 'Silverline Tea Estates'];
  var SB = ['Bluepeak Analytics Private Limited', 'Riverstone Foods and Beverages', 'Kalpa Systems Incorporated', 'Orchid Healthcare',
      'Northfield University', 'Northfield College', 'Sundaram Motors', 'Vertex Laboratories', 'Greenline Logistics India', 'Meridian Capital',
      'Lotus Textile Mills', 'Tidewater Shipping Company', 'Bharat Steel', 'Apex Pharma'];
  var A = T.source($('[data-src=a]', tool), { sample: { name: 'list-a-sample.csv', text: 'company\n' + SA.map(csv1).join('\n') + '\n' } });
  var B = T.source($('[data-src=b]', tool), { sample: { name: 'list-b-sample.csv', text: 'company\n' + SB.map(csv1).join('\n') + '\n' } });
  function csv1(v) { return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  var th = $('#th'), thv = $('#thv'), say = $('#say'), prog = $('#prog'), out = $('#out'), run = $('#run');
  var last = null, filter = 'all';

  th.addEventListener('input', function () { thv.textContent = th.value; if (last) render(); });

  $('[data-sample]', tool).addEventListener('click', function () {
    A.set(SA.join('\n'));
    B.set(SB.join('\n'));
    go();
  });

  run.addEventListener('click', go);

  function go() {
    var ea = A.entries(), eb = B.entries();
    if (!ea.length || !eb.length) { T.say(say, 'Add at least one value to each list. Paste one value per line, or upload a CSV and pick the column.', 'warn'); return; }
    T.say(say, '');
    // match each distinct value once
    var ua = [], ia = new Map(), ub = [], ib = new Map();
    ea.forEach(function (e) { if (!ia.has(e.v)) { ia.set(e.v, ua.length); ua.push(e.v); } });
    eb.forEach(function (e) { if (!ib.has(e.v)) { ib.set(e.v, ub.length); ub.push(e); } });
    var opts = { method: $('#method').value, top: 2, punct: $('#o-punct').checked, accents: $('#o-acc').checked,
      abbr: $('#o-abbr').checked, stop: $('#stop').value };
    run.disabled = true;
    var tick = T.progress(prog);
    var t0 = performance.now();
    T.work({ type: 'match', a: ua, b: ub.map(function (e) { return e.v; }), opts: opts }, tick).then(function (res) {
      last = { ea: ea, ua: ua, ia: ia, ub: ub, res: res, ms: performance.now() - t0, ta: A.table(), tb: B.table(), cb: B.column(), single: !!A.table().single };
      prog.hidden = true; run.disabled = false; filter = 'all';
      render();
      out.hidden = false;
    }, function (err) {
      prog.hidden = true; run.disabled = false;
      T.say(say, 'Something went wrong while matching: ' + T.esc(err.message) + '. Try a smaller list, or reload the page.', 'err');
    });
  }

  function rows() {
    var t = +th.value, L = last;
    return L.ea.map(function (e, k) {
      var r = L.res[L.ia.get(e.v)] || [], b1 = r[0], b2 = r[1];
      var sc = b1 ? b1[1] : 0, st = !b1 ? 'none' : sc >= t ? 'match' : sc >= t - 10 ? 'review' : 'none';
      return { i: k, row: e.row, a: e.v, b: b1 ? L.ub[b1[0]].v : '', brow: b1 ? L.ub[b1[0]].row : -1, sc: sc, st: st,
        b2: b2 ? L.ub[b2[0]].v : '', sc2: b2 ? b2[1] : null };
    });
  }

  function render() {
    var R = rows(), t = +th.value;
    var c = { match: 0, review: 0, none: 0 };
    R.forEach(function (r) { c[r.st]++; });
    $('#stats').innerHTML =
      '<div><b>' + T.n(R.length) + '</b><span>values in list A</span></div>' +
      '<div class="ok"><b>' + T.n(c.match) + '</b><span>matched at ' + t + ' or above</span></div>' +
      '<div class="warn"><b>' + T.n(c.review) + '</b><span>close, scored ' + (t - 10) + ' to ' + t + '</span></div>' +
      '<div class="bad"><b>' + T.n(c.none) + '</b><span>no good match</span></div>' +
      '<div><b>' + (last.ms < 1000 ? Math.round(last.ms) + ' ms' : (last.ms / 1000).toFixed(1) + ' s') + '</b><span>on your device</span></div>';
    T.histogram($('#hist'), R.filter(function (r) { return r.b; }).map(function (r) { return r.sc; }), t, 'drag the slider and watch the line move');
    T.breakdown($('#bd'), [['Matched', c.match, 'ok'], ['Check by hand', c.review, 'warn'], ['No match', c.none, 'bad']]);
    T.chips($('#filter'), [['all', 'All', R.length], ['match', 'Matched', c.match], ['review', 'Review', c.review], ['none', 'No match', c.none]], function (k) { filter = k; grid(); });
    T.$$('#filter button').forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-k') === filter); });
    grid();
  }

  var LABEL = { match: '<span class="tag2 ok">match</span>', review: '<span class="tag2 warn">review</span>', none: '<span class="tag2 bad">no match</span>' };
  function shown() { var R = rows(); return filter === 'all' ? R : R.filter(function (r) { return r.st === filter; }); }

  function grid() {
    var t = +th.value, R = shown();
    T.grid($('#grid'), ['List A', 'Best match in list B', 'Score', 'Status', 'Next best'], R, {
      thClass: ['', '', '', '', ''],
      empty: 'Nothing in this group.',
      cell: function (r, col) {
        if (col === 0) return '<td>' + T.esc(r.a) + '</td>';
        if (col === 1) return '<td' + (r.st === 'none' ? ' class="dim"' : '') + '>' + T.esc(r.b || '—') + '</td>';
        if (col === 2) return '<td>' + (r.b ? T.pill(r.sc, t) : '') + '</td>';
        if (col === 3) return '<td>' + LABEL[r.st] + '</td>';
        return '<td class="dim">' + (r.b2 ? T.esc(r.b2) + ' <small>' + r.sc2 + '</small>' : '') + '</td>';
      }
    });
  }

  function exportRows() {
    var L = last, R = shown(), ta = L.ta, tb = L.tb, bExtra = tb && !tb.single;
    var head = (L.single ? ['value'] : ta.headers.slice()).concat(['match', 'match_score', 'match_status', 'next_best', 'next_best_score']);
    if (bExtra) head = head.concat(tb.headers.map(function (h) { return 'B: ' + h; }));
    var body = R.map(function (r) {
      var base = L.single ? [r.a] : ta.rows[r.row].slice();
      base = base.concat([r.b, r.b ? r.sc : '', r.st === 'none' ? 'no match' : r.st, r.b2, r.sc2 == null ? '' : r.sc2]);
      if (bExtra) base = base.concat(r.brow >= 0 ? tb.rows[r.brow] : tb.headers.map(function () { return ''; }));
      return base;
    });
    return { head: head, body: body };
  }

  $('#dl').addEventListener('click', function () {
    var x = exportRows();
    T.download('fuzzy-match-results.csv', T.toCSV(x.head, x.body), 'text/csv');
  });
  $('#copy').addEventListener('click', function (e) {
    var x = exportRows();
    T.copy(T.toCSV(x.head, x.body, '\t'), e.currentTarget);
  });
})();
