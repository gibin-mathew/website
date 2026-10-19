/* Runs the matching off the main thread so the page stays responsive on big lists. */
importScripts('fuzz.js?v=3');
self.onmessage = function (e) {
  var m = e.data, last = 0;
  function progress(done, total) {
    var now = Date.now();
    if (now - last > 120 || done === total) { last = now; self.postMessage({ id: m.id, type: 'progress', done: done, total: total }); }
  }
  try {
    var result = m.type === 'self'
      ? Fuzz.selfPairs(m.items, m.opts, progress)
      : Fuzz.matchAll(m.a, m.b, m.opts, progress);
    self.postMessage({ id: m.id, type: 'done', result: result });
  } catch (err) {
    self.postMessage({ id: m.id, type: 'error', message: String(err && err.message || err) });
  }
};
