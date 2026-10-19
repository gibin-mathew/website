/* Value standardizer: map messy values onto a canonical list. gibin.in/tools/value-standardizer/ */
(function () {
  'use strict';
  var $ = T.$, tool = $('#tool');
  var SM = ['UK', 'U.K.', 'United Kingdom', 'united kingdom', 'Great Britain', 'Untied Kingdom', 'USA', 'U.S.A.', 'United States', 'United States of America',
      'india', 'INDIA', 'India', 'Bharat', 'Republic of India', 'UAE', 'U.A.E', 'United Arab Emirates', 'Deutschland', 'Germany', 'germany',
      'Nethrelands', 'Holland', 'Netherlands', 'Canada', 'Austrailia', 'Australia', 'Singapur', 'Narnia'];
  var SC = ['United Kingdom', 'United States', 'India', 'United Arab Emirates', 'Germany', 'Netherlands', 'Canada', 'Australia', 'Singapore'];
  var M = T.source($('[data-src=m]', tool), { sample: { name: 'messy-values-sample.csv', text: 'country\n' + SM.join('\n') + '\n' } });
  var C = T.source($('[data-src=c]', tool), { sample: { name: 'canonical-list-sample.csv', text: 'country\n' + SC.join('\n') + '\n' } });
  var th = $('#th'), thv = $('#thv'), say = $('#say'), prog = $('#prog'), out = $('#out'), run = $('#run'), alias = $('#alias');
  var last = null, filter = 'all';

  function key(s) { return Fuzz.normalize(s, { abbr: false }).replace(/ /g, ''); }

  th.addEventListener('input', function () { thv.textContent = th.value; if (last) { decide(); render(); } });
  run.addEventListener('click', go);

  $('[data-sample]', tool).addEventListener('click', function () {
    M.set(SM.join('\n'));
    C.set(SC.join('\n'));
    alias.value = 'UK = United Kingdom\nGreat Britain = United Kingdom\nUSA = United States\nUAE = United Arab Emirates\nHolland = Netherlands\nDeutschland = Germany\nBharat = India';
    go();
  });

  function parseAliases(canon) {
    var map = new Map(), bad = [];
    alias.value.split(/\r\n|\n|\r/).forEach(function (line, i) {
      if (!line.trim()) return;
      var m = line.split(/\s*(?:=>|=|->|\t)\s*/);
      if (m.length < 2 || !m[0].trim() || !m[1].trim()) { bad.push(i + 1); return; }
      var target = canon.byKey.get(key(m[1]));
      if (!target) { bad.push(i + 1); return; }
      map.set(key(m[0]), target);
    });
    return { map: map, bad: bad };
  }

  function go() {
    var em = M.entries(), cv = C.values();
    if (!em.length || !cv.length) { T.say(say, 'Add the messy values on the left and your canonical list on the right.', 'warn'); return; }
    var canonList = [], byKey = new Map();
    cv.forEach(function (v) { var k = key(v); if (!byKey.has(k)) { byKey.set(k, v); canonList.push(v); } });
    var al = parseAliases({ byKey: byKey });
    var counts = new Map(), order = [];
    em.forEach(function (e) { if (!counts.has(e.v)) { counts.set(e.v, 0); order.push(e.v); } counts.set(e.v, counts.get(e.v) + 1); });
    var items = order.map(function (v) { return { v: v, n: counts.get(v), sugg: [], pick: null, how: '' }; });
    var fuzzyNeeded = [];
    items.forEach(function (it, i) {
      var k = key(it.v);
      if (byKey.has(k)) { it.fixed = byKey.get(k); it.fixedHow = 'exact'; }
      else if (al.map.has(k)) { it.fixed = al.map.get(k); it.fixedHow = 'alias'; }
      else fuzzyNeeded.push(i);
    });
    T.say(say, al.bad.length ? 'Skipped alias line' + (al.bad.length > 1 ? 's ' : ' ') + al.bad.join(', ') + ': each line needs "alias = canonical", and the canonical value has to be in your canonical list.' : '', 'warn');
    run.disabled = true;
    var tick = T.progress(prog);
    var p = fuzzyNeeded.length ? T.work({ type: 'match', a: fuzzyNeeded.map(function (i) { return items[i].v; }), b: canonList,
      opts: { method: 'smart', top: 3, abbr: true } }, tick) : Promise.resolve([]);
    p.then(function (res) {
      res.forEach(function (r, j) { items[fuzzyNeeded[j]].sugg = r.map(function (x) { return [canonList[x[0]], x[1]]; }); });
      last = { items: items, canon: canonList, em: em, tm: M.table(), col: M.column() };
      prog.hidden = true; run.disabled = false; filter = 'all';
      decide(); render(); out.hidden = false;
    }, function (err) {
      prog.hidden = true; run.disabled = false;
      T.say(say, 'Something went wrong: ' + T.esc(err.message), 'err');
    });
  }

  // apply the threshold, but never override a choice the person made by hand
  function decide() {
    var t = +th.value;
    last.items.forEach(function (it) {
      if (it.manual) return;
      if (it.fixed) { it.pick = it.fixed; it.how = it.fixedHow; return; }
      var s = it.sugg[0];
      if (s && s[1] >= t) { it.pick = s[0]; it.how = 'fuzzy'; }
      else { it.pick = null; it.how = 'review'; }
    });
  }

  var TAG = { exact: '<span class="tag2 ok">exact</span>', alias: '<span class="tag2 blue">alias</span>', fuzzy: '<span class="tag2 ok">fuzzy</span>',
    review: '<span class="tag2 warn">needs a decision</span>', manual: '<span class="tag2 blue">you picked</span>', keep: '<span class="tag2">left as is</span>' };

  function render(noGrid) {
    var c = { exact: 0, alias: 0, fuzzy: 0, review: 0, manual: 0, keep: 0 }, rows = 0, mapped = 0;
    last.items.forEach(function (it) { c[it.how]++; rows += it.n; if (it.pick) mapped += it.n; });
    $('#stats').innerHTML =
      '<div><b>' + T.n(last.items.length) + '</b><span>distinct values (' + T.n(rows) + ' rows)</span></div>' +
      '<div class="ok"><b>' + T.n(c.exact + c.alias) + '</b><span>exact or alias</span></div>' +
      '<div class="ok"><b>' + T.n(c.fuzzy) + '</b><span>fuzzy, at ' + th.value + ' or above</span></div>' +
      '<div class="warn"><b>' + T.n(c.review) + '</b><span>need your decision</span></div>' +
      '<div><b>' + (rows ? Math.round(100 * mapped / rows) : 0) + '%</b><span>of rows standardized</span></div>';
    var rc = { exact: 0, alias: 0, fuzzy: 0, review: 0, manual: 0, keep: 0 };
    last.items.forEach(function (it) { rc[it.how] += it.n; });
    T.breakdown($('#bd'), [['Exact', rc.exact, 'ok'], ['Alias rule', rc.alias, 'blue'], ['Fuzzy', rc.fuzzy, 'ok2'], ['You picked', rc.manual, 'blue'], ['Needs a decision', rc.review, 'warn'], ['Left as is', rc.keep, 'mute']], 'Rows, by how they were standardized');
    T.chips($('#filter'), [['all', 'All', last.items.length], ['review', 'Needs a decision', c.review], ['fuzzy', 'Fuzzy', c.fuzzy], ['done', 'Exact and alias', c.exact + c.alias]], function (k) { filter = k; grid(); });
    T.$$('#filter button').forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-k') === filter); });
    if (!noGrid) grid();
  }

  function visible() {
    return last.items.filter(function (it) {
      return filter === 'all' || (filter === 'done' ? it.how === 'exact' || it.how === 'alias' : it.how === filter);
    });
  }

  function select(it, idx) {
    var opts = '<option value="">Leave as is</option>', seen = {};
    function o(v, label) { if (seen[v]) return; seen[v] = 1; opts += '<option value="' + T.esc(v) + '"' + (it.pick === v ? ' selected' : '') + '>' + T.esc(label) + '</option>'; }
    if (it.pick) o(it.pick, it.pick);
    it.sugg.forEach(function (s) { o(s[0], s[0] + '  (' + s[1] + ')'); });
    if (last.canon.length <= 300) { opts += '<option disabled>──────────</option>'; last.canon.forEach(function (v) { o(v, v); }); }
    return '<select data-i="' + idx + '" aria-label="Standard value for ' + T.esc(it.v) + '">' + opts + '</select>';
  }

  function grid() {
    var V = visible(), t = +th.value;
    T.grid($('#grid'), ['Messy value', 'Rows', 'Standard value', 'How', 'Best suggestion'], V, {
      empty: 'Nothing in this group.',
      rowClass: function (it) { return it.how === 'review' ? 'hl' : ''; },
      cell: function (it, col) {
        if (col === 0) return '<td>' + T.esc(it.v) + '</td>';
        if (col === 1) return '<td class="num">' + T.n(it.n) + '</td>';
        if (col === 2) return '<td>' + select(it, last.items.indexOf(it)) + '</td>';
        if (col === 3) return '<td>' + TAG[it.how] + '</td>';
        var s = it.sugg[0];
        return '<td>' + (it.fixed ? '<span class="dim">—</span>' : s ? T.esc(s[0]) + ' ' + T.pill(s[1], t) : '<span class="dim">none</span>') + '</td>';
      }
    });
  }

  $('#grid').addEventListener('change', function (e) {
    var s = e.target; if (!s.matches('select[data-i]')) return;
    var it = last.items[+s.getAttribute('data-i')];
    it.pick = s.value || null; it.manual = true; it.how = s.value ? 'manual' : 'keep';
    var tr = s.closest('tr'); tr.classList.remove('hl'); tr.children[3].innerHTML = TAG[it.how];
    render(true);
  });

  function mapOf() { var m = new Map(); last.items.forEach(function (it) { m.set(it.v, it); }); return m; }

  $('#dl-map').addEventListener('click', function () {
    var rows = last.items.map(function (it) {
      var s = it.sugg[0];
      return [it.v, it.pick || '', it.how === 'review' ? 'unmapped' : it.how, it.fixed ? '' : s ? s[1] : '', it.n];
    });
    T.download('value-mapping.csv', T.toCSV(['messy_value', 'standard_value', 'how', 'score', 'rows'], rows), 'text/csv');
  });
  $('#dl-data').addEventListener('click', function () {
    var m = mapOf(), tm = last.tm;
    if (tm.single) {
      var rows = last.em.map(function (e) { var it = m.get(e.v); return [e.v, it && it.pick || e.v]; });
      T.download('standardized-values.csv', T.toCSV(['original', 'standardized'], rows), 'text/csv');
      return;
    }
    var col = last.col, name = tm.headers[col] + ' (standardized)';
    var body = tm.rows.map(function (r) { var v = (r[col] || '').trim(), it = m.get(v); return r.concat([v ? (it && it.pick || v) : '']); });
    T.download('standardized-data.csv', T.toCSV(tm.headers.concat([name]), body), 'text/csv');
  });
})();
