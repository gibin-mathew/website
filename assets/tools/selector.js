/* CSS selector and XPath tester for scraping. gibin.in/tools/selector-tester/
   The pasted HTML is parsed with DOMParser into an inert document: no scripts run, nothing is fetched. */
(function () {
  'use strict';
  var $ = T.$, tool = $('#tool');
  var SAMPLE = '<!doctype html>\n<html><body>\n<main class="listing">\n' +
      '  <div class="product" data-id="TEA-250">\n    <a href="/p/masala-chai"><img src="/img/chai.jpg" alt=""></a>\n    <h2 class="title">Masala Chai, 250 g</h2>\n    <span class="price">₹ 320</span>\n    <span class="rating" data-stars="4.6">4.6 ★</span>\n  </div>\n' +
      '  <div class="product" data-id="COF-500">\n    <a href="/p/filter-coffee"><img src="/img/coffee.jpg" alt=""></a>\n    <h2 class="title">Filter Coffee, 500 g</h2>\n    <span class="price">₹ 899.50</span>\n    <span class="badge">Out of stock</span>\n  </div>\n' +
      '  <div class="product" data-id="MUG-01">\n    <a href="/p/steel-tumbler"><img src="/img/tumbler.jpg" alt=""></a>\n    <h2 class="title">Steel Tumbler and Dabara</h2>\n    <span class="price">₹ 450</span>\n    <span class="rating" data-stars="4.2">4.2 ★</span>\n  </div>\n' +
      '</main>\n<script>alert("scripts never run here")</script>\n</body></html>';
  var S = T.source($('[data-src=h]', tool), { sample: { name: 'product-page-sample.html', text: SAMPLE, mime: 'text/html' }, onChange: function () { doc = null; later(); } });
  var say = $('#say'), out = $('#out'), fieldsBox = $('#fields'), doc = null, docText = null, last = null;
  var lt; function later() { clearTimeout(lt); lt = setTimeout(evaluate, 200); }

  var EXTRACT = [['text', 'Text'], ['textall', 'Text, all matches'], ['attr:href', 'href'], ['attr:src', 'src'], ['attr:content', 'content'], ['attr:value', 'value'], ['attr:data-id', 'data-id'], ['html', 'HTML'], ['count', 'Count'], ['attr:', 'Other attribute…']];

  function fieldRow(f) {
    var row = document.createElement('div');
    row.className = 'frow';
    var custom = /^attr:/.test(f.x) && !EXTRACT.some(function (e) { return e[0] === f.x; });
    row.innerHTML = '<input type="text" class="mono-in fn" value="' + T.esc(f.name) + '" aria-label="Field name" placeholder="name">' +
      '<input type="text" class="mono-in fs" value="' + T.esc(f.sel) + '" aria-label="Selector" placeholder="selector" spellcheck="false" autocapitalize="off">' +
      '<select class="fx" aria-label="What to extract">' + EXTRACT.map(function (e) { return '<option value="' + e[0] + '"' + ((custom ? 'attr:' : f.x) === e[0] ? ' selected' : '') + '>' + e[1] + '</option>'; }).join('') + '</select>' +
      '<input type="text" class="mono-in fa" value="' + T.esc(custom ? f.x.slice(5) : '') + '" aria-label="Attribute name" placeholder="attribute"' + (custom ? '' : ' hidden') + '>' +
      '<span class="fcount"></span><button type="button" class="tbtn ghost sm frm" aria-label="Remove field">×</button>';
    fieldsBox.appendChild(row);
  }
  function fields() {
    return T.$$('.frow', fieldsBox).map(function (r) {
      var x = T.$('.fx', r).value;
      if (x === 'attr:') x = 'attr:' + T.$('.fa', r).value.trim();
      return { row: r, name: T.$('.fn', r).value.trim() || 'field', sel: T.$('.fs', r).value.trim(), x: x };
    });
  }
  fieldsBox.addEventListener('input', later);
  fieldsBox.addEventListener('change', function (e) {
    if (e.target.classList.contains('fx')) T.$('.fa', e.target.parentNode).hidden = e.target.value !== 'attr:';
    later();
  });
  fieldsBox.addEventListener('click', function (e) { if (e.target.classList.contains('frm')) { e.target.parentNode.remove(); later(); } });
  $('#add').addEventListener('click', function () { fieldRow({ name: 'field' + (T.$$('.frow', fieldsBox).length + 1), sel: '', x: 'text' }); T.$('.frow:last-child .fs', fieldsBox).focus(); });
  ['#mode', '#each', '#base', '#ws'].forEach(function (s) { $(s).addEventListener('input', later); $(s).addEventListener('change', later); });
  $('#mode').addEventListener('change', function () { $('#each').placeholder = this.value === 'css' ? 'e.g. div.product' : 'e.g. //div[@class="product"]'; });

  $('[data-sample]', tool).addEventListener('click', function () {
    S.set(SAMPLE);
    $('#mode').value = 'css'; $('#each').value = 'div.product'; $('#base').value = 'https://shop.example.com';
    fieldsBox.innerHTML = '';
    [{ name: 'sku', sel: ':scope', x: 'attr:data-id' }, { name: 'title', sel: 'h2.title', x: 'text' }, { name: 'price', sel: '.price', x: 'text' },
      { name: 'link', sel: 'a', x: 'attr:href' }, { name: 'stars', sel: '.rating', x: 'attr:data-stars' }, { name: 'stock', sel: '.badge', x: 'text' }].forEach(fieldRow);
    doc = null; evaluate();
  });

  function getDoc() {
    var text = S.text();
    if (doc && docText === text) return doc;
    docText = text; doc = new DOMParser().parseFromString(text, 'text/html');
    return doc;
  }
  function clean(s) { return $('#ws').checked ? String(s).replace(/\s+/g, ' ').trim() : String(s); }

  // returns array of nodes or a single primitive value
  function select(root, sel, mode, d) {
    if (mode === 'css') return Array.prototype.slice.call(root.querySelectorAll(sel));
    var r = d.evaluate(sel, root, null, XPathResult.ANY_TYPE, null);
    if (r.resultType === XPathResult.NUMBER_TYPE) return { prim: r.numberValue };
    if (r.resultType === XPathResult.STRING_TYPE) return { prim: r.stringValue };
    if (r.resultType === XPathResult.BOOLEAN_TYPE) return { prim: r.booleanValue };
    var out = [], n; while ((n = r.iterateNext())) out.push(n);
    return out;
  }
  function extract(node, x, base) {
    if (node.nodeType === 2) {                                  // attribute node (XPath /@href)
      var av = node.value;
      if (base && /^(href|src|action|data-src|poster)$/i.test(node.name)) { try { av = new URL(av, base).href; } catch (e) {} }
      return av;
    }
    if (node.nodeType === 3 || node.nodeType === 4) return clean(node.nodeValue);
    if (x === 'html') return node.outerHTML || '';
    if (x === 'text' || x === 'textall') return clean(node.textContent || '');
    if (x.indexOf('attr:') === 0) {
      var a = x.slice(5), v = node.getAttribute ? node.getAttribute(a) : null;
      if (v == null) return '';
      if (base && /^(href|src|action|data-src|poster)$/i.test(a)) { try { v = new URL(v, base).href; } catch (e) {} }
      return v;
    }
    return '';
  }

  function evaluate() {
    var F = fields().filter(function (f) { return f.sel; }), mode = $('#mode').value, each = $('#each').value.trim(), base = $('#base').value.trim();
    if (base && !/^https?:\/\//i.test(base)) base = 'https://' + base;
    T.$$('.fcount', fieldsBox).forEach(function (c) { c.textContent = ''; c.className = 'fcount'; });
    if (S.isEmpty()) { out.hidden = true; T.say(say, ''); return; }
    if (!F.length) { out.hidden = true; T.say(say, 'Add a field with a selector to see what it extracts.', ''); return; }
    var d = getDoc(), errors = [], roots;
    if (each) {
      try { roots = select(d, each, mode, d); if (!Array.isArray(roots)) { errors.push('"Repeat for each" has to select elements, not a ' + typeof roots.prim + '.'); roots = []; } }
      catch (e) { errors.push('"Repeat for each" is not a valid ' + (mode === 'css' ? 'CSS selector' : 'XPath') + '.'); roots = []; }
      roots = roots.filter(function (n) { return n.nodeType === 1; });
    }
    var rows = [], counts = F.map(function () { return 0; });
    function cellFor(f, i, root) {
      var sel = f.sel;
      if (mode === 'css' && root !== d && /^:scope$/.test(sel)) return [root];
      if (mode === 'xpath' && root !== d && sel[0] === '/' ) errors.push('Field "' + f.name + '": inside "repeat for each", start the XPath with "." (like .//h2), or it searches the whole page.');
      try { return select(root, sel, mode, d); }
      catch (e) { f.bad = true; return []; }
    }
    if (each) {
      roots.forEach(function (root) {
        rows.push(F.map(function (f, i) {
          var m = cellFor(f, i, root);
          if (!Array.isArray(m)) { counts[i]++; return String(m.prim); }
          if (m.length) counts[i]++;
          if (f.x === 'count') return String(m.length);
          if (f.x === 'textall') return m.map(function (n) { return extract(n, 'text', base); }).filter(Boolean).join(' | ');
          return m.length ? extract(m[0], f.x, base) : '';
        }));
      });
    } else {
      var cols = F.map(function (f, i) {
        var m = cellFor(f, i, d);
        if (!Array.isArray(m)) return [String(m.prim)];
        if (f.x === 'count') return [String(m.length)];
        if (f.x === 'textall') return [m.map(function (n) { return extract(n, 'text', base); }).filter(Boolean).join(' | ')];
        return m.map(function (n) { return extract(n, f.x, base); });
      });
      var n = Math.max.apply(null, cols.map(function (c) { return c.length; }).concat(0));
      for (var r = 0; r < n; r++) rows.push(cols.map(function (c) { return c[r] == null ? '' : c[r]; }));
      cols.forEach(function (c, i) { counts[i] = c.length; });
    }
    F.forEach(function (f, i) {
      var c = T.$('.fcount', f.row);
      if (f.bad) { c.textContent = 'invalid'; c.className = 'fcount bad'; errors.push('Field "' + f.name + '" is not a valid ' + (mode === 'css' ? 'CSS selector' : 'XPath') + '.'); }
      else { c.textContent = each ? counts[i] + '/' + rows.length : T.n(counts[i]); c.className = 'fcount' + (counts[i] ? ' ok' : ' none'); c.title = each ? 'Found in ' + counts[i] + ' of ' + rows.length + ' items' : counts[i] + ' matches'; }
      f.bad = false;
    });
    T.say(say, errors.filter(function (x, i, a) { return a.indexOf(x) === i; }).map(T.esc).join('<br>'), errors.length ? 'warn' : '');
    last = { H: F.map(function (f) { return f.name; }), rows: rows, F: F, mode: mode, each: each, base: base };
    $('#meta').textContent = each ? T.plural(rows.length, 'item') + ' found by "repeat for each"' : T.plural(rows.length, 'row');
    T.grid($('#grid'), last.H, rows, { step: 100, empty: each ? 'The "repeat for each" selector matched nothing.' : 'Nothing matched.', cell: function (row, c) { return '<td>' + (row[c] === '' ? '<span class="dim">·</span>' : T.esc(row[c].length > 300 ? row[c].slice(0, 300) + '…' : row[c])) + '</td>'; } });
    out.hidden = false;
  }

  /* ---------- code export ---------- */
  function py() {
    var L = last, m = L.mode, lines = ['from parsel import Selector  # pip install parsel'];
    if (L.base) lines.push('from urllib.parse import urljoin', '', 'BASE = ' + JSON.stringify(L.base));
    lines.push('', 'sel = Selector(text=html)', 'rows = []');
    function q(s) { return JSON.stringify(s); }
    function linky(f) { return L.base && (/^attr:(href|src|action|data-src|poster)$/i.test(f.x) || (m === 'xpath' && /\/@(href|src|action|data-src|poster)$/i.test(f.sel))); }
    var expr = function (root, f) {
      if (m === 'css') {
        var s = f.sel === ':scope' ? null : f.sel;
        if (f.x === 'count') return 'len(' + root + '.css(' + q(s || '*') + '))';
        if (f.x.indexOf('attr:') === 0) return s ? root + '.css(' + q(s + '::attr(' + f.x.slice(5) + ')') + ').get(default="")' : root + '.attrib.get(' + q(f.x.slice(5)) + ', "")';
        if (f.x === 'html') return root + '.css(' + q(s || '*') + ').get(default="")';
        if (f.x === 'textall') return '" | ".join(" ".join(x.split()) for x in ' + root + '.css(' + q(s) + ').xpath("string()").getall())';
        return '" ".join((' + (s ? root + '.css(' + q(s) + ')' : root) + '.xpath("string()").get() or "").split())';
      }
      if (f.x === 'count') return 'len(' + root + '.xpath(' + q(f.sel) + '))';
      if (/\/@[\w:.-]+$|text\(\)$/.test(f.sel)) return root + '.xpath(' + q(f.sel) + ').get(default="")';
      if (f.x.indexOf('attr:') === 0) return root + '.xpath(' + q(f.sel) + ').attrib.get(' + q(f.x.slice(5)) + ', "")';
      if (f.x === 'html') return root + '.xpath(' + q(f.sel) + ').get(default="")';
      return '" ".join((' + root + '.xpath(' + q(f.sel) + ').xpath("string()").get() or "").split())';
    };
    var expr0 = expr;
    expr = function (root, f) { var e = expr0(root, f); return linky(f) ? '(urljoin(BASE, ' + e + ') if ' + e + ' else "")' : e; };
    if (L.each) {
      lines.push('for item in sel.' + (m === 'css' ? 'css' : 'xpath') + '(' + q(L.each) + '):', '    rows.append({');
      L.F.forEach(function (f) { lines.push('        ' + q(f.name) + ': ' + expr('item', f) + ','); });
      lines.push('    })');
    } else {
      lines.push('rows.append({');
      L.F.forEach(function (f) { lines.push('    ' + q(f.name) + ': ' + expr('sel', f) + ','); });
      lines.push('})');
    }
    return lines.join('\n') + '\n';
  }
  function js() {
    var L = last, m = L.mode;
    var head = m === 'css'
      ? ['// Playwright (Node). Runs inside the page, so it works the same in the browser console.', 'const rows = await page.evaluate(() => {', '  const one = (root, sel) => sel === ":scope" ? root : root.querySelector(sel);', '  const all = (root, sel) => [...root.querySelectorAll(sel)];']
      : ['// Playwright (Node). Runs inside the page, so it works the same in the browser console.', 'const rows = await page.evaluate(() => {', '  const all = (root, xp) => { const r = document.evaluate(xp, root, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null); return Array.from({ length: r.snapshotLength }, (_, i) => r.snapshotItem(i)); };', '  const one = (root, xp) => all(root, xp)[0] || null;'];
    head.push('  const text = (n) => (n ? n.textContent : "").replace(/\\s+/g, " ").trim();');
    head.push('  const attr = (n, a) => !n ? "" : n.nodeType === 2 ? n.value : (n.getAttribute(a) ?? "");');
    if (L.base) head.push('  const abs = (v) => v ? new URL(v, ' + JSON.stringify(L.base) + ').href : "";');
    function linkyJ(f) { return L.base && (/^attr:(href|src|action|data-src|poster)$/i.test(f.x) || (m === 'xpath' && /\/@(href|src|action|data-src|poster)$/i.test(f.sel))); }
    var expr = function (root, f) {
      var s = JSON.stringify(f.sel);
      if (f.x === 'count') return 'all(' + root + ', ' + s + ').length';
      if (f.x === 'textall') return 'all(' + root + ', ' + s + ').map(text).filter(Boolean).join(" | ")';
      if (f.x === 'html') return '(one(' + root + ', ' + s + ')?.outerHTML ?? "")';
      if (f.x.indexOf('attr:') === 0) return 'attr(one(' + root + ', ' + s + '), ' + JSON.stringify(f.x.slice(5)) + ')';
      return 'text(one(' + root + ', ' + s + '))';
    };
    var exprJ0 = expr;
    expr = function (root, f) { var e = exprJ0(root, f); return linkyJ(f) ? 'abs(' + e + ')' : e; };
    if (L.each) {
      head.push('  return all(document, ' + JSON.stringify(L.each) + ').map((item) => ({');
      L.F.forEach(function (f) { head.push('    ' + JSON.stringify(f.name) + ': ' + expr('item', f) + ','); });
      head.push('  }));');
    } else {
      head.push('  return [{');
      L.F.forEach(function (f) { head.push('    ' + JSON.stringify(f.name) + ': ' + expr('document', f) + ','); });
      head.push('  }];');
    }
    head.push('});', 'console.log(rows);');
    return head.join('\n') + '\n';
  }
  $('#copy-py').addEventListener('click', function (e) { T.copy(py(), e.currentTarget); });
  $('#copy-js').addEventListener('click', function (e) { T.copy(js(), e.currentTarget); });
  $('#dl').addEventListener('click', function () { T.download('extracted.csv', T.toCSV(last.H, last.rows), 'text/csv'); });
  $('#dl-json').addEventListener('click', function () {
    T.download('extracted.json', JSON.stringify(last.rows.map(function (r) { var o = {}; last.H.forEach(function (h, i) { o[h] = r[i]; }); return o; }), null, 2), 'application/json');
  });

  fieldRow({ name: 'title', sel: '', x: 'text' });
})();
