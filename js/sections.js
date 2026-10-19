/* NeoCalc: RSI, Meds and Calcs screens. Data comes from data/guidebook-*.js (NeoCalc's own copies). */
(function () {
  'use strict';
  var NC = window.NeoCalc, D = window.NeoDosing, DATA = window.NEOCALC_DATA;
  var $ = function (id) { return document.getElementById(id); };
  var fmt = D.fmt;

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function kv(k, v, sub) {
    return '<div class="kv"><span class="k">' + k + (sub ? '<small>' + sub + '</small>' : '') + '</span><span class="v">' + v + '</span></div>';
  }
  function list(items) { return '<ul class="plain">' + items.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>'; }

  /* ================= RSI ================= */
  var RSI = DATA.rsi;

  function renderRsi(p) {
    var wt = p.wtKg, ga = p.gaWeeks, h = '';
    $('rsi-need').hidden = wt !== null;

    // Airway
    var row = wt === null ? null : RSI.ettTable.rows.filter(function (r) { return wt >= r.minWt && wt < r.maxWt; })[0];
    h += '<div class="card rsi"><h2><span class="bar"></span>Airway</h2>';
    h += kv('ETT size', row ? row.size : '—', 'By weight, from table below');
    h += kv('Insertion depth', row ? row.depth + ' cm' : '—', 'By weight, from table below');
    h += kv('Tip-to-lip estimate', wt !== null ? fmt(wt + 6) + ' cm' : '—', 'Weight (kg) + 6');
    h += kv('ETT size by GA', ga !== null ? fmt((ga + p.gaDays / 7) / 10) + ' mm' : '—', 'GA (weeks) ÷ 10');
    h += '<div class="tbl"><table><tr>' + RSI.ettTable.cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr>';
    RSI.ettTable.rows.forEach(function (r) {
      h += '<tr' + (r === row ? ' class="hit"' : '') + '><td>' + esc(r.ga) + '</td><td>' + esc(r.wt) + '</td><td>' + esc(r.size) + '</td><td>' + esc(r.depth) + '</td></tr>';
    });
    h += '</table></div></div>';

    // Premedication
    h += '<div class="card rsi"><h2><span class="bar"></span>Premedication (give in this order)</h2>';
    RSI.premeds.forEach(function (m, i) {
      var amt = '—';
      if (wt !== null) {
        amt = m.perKgLo ? fmt(m.perKgLo * wt) + '–' + fmt(m.perKg * wt) : fmt(m.perKg * wt);
        amt += ' ' + m.unit;
      }
      var sub = esc(m.dose) + (m.note ? '<br>' + esc(m.note) : '');
      if (m.withholdBelowGa && ga !== null && ga < m.withholdBelowGa) {
        amt = '<span class="warn-text">Withhold</span><small>GA &lt; ' + m.withholdBelowGa + ' wk</small>';
      }
      h += kv((i + 1) + '. ' + esc(m.name), amt, sub);
    });
    h += '<p class="note">IV push, not on the pump. Do not remove from Pyxis until all parties are ready.</p>';
    h += '<details><summary>Candidates, exclusions &amp; what to avoid</summary>';
    h += '<h4>Candidates</h4>' + list(RSI.premedNotes.candidates);
    h += '<h4>Exclusions</h4>' + list(RSI.premedNotes.exclusions);
    h += '<h4>Avoid</h4>' + list(RSI.premedNotes.avoid);
    h += '<h4>Additional points</h4>' + list(RSI.premedNotes.points);
    h += '</details></div>';

    // Surfactant
    var S = RSI.surfactant;
    h += '<div class="card rsi"><h2><span class="bar"></span>Surfactant: ' + esc(S.name) + '</h2>';
    h += kv('Initial dose', wt !== null ? fmt(S.initialPerKg * wt) + ' mL' : '—', S.initialPerKg + ' mL/kg');
    h += kv('Repeat dose', wt !== null ? fmt(S.repeatPerKg * wt) + ' mL' : '—', S.repeatPerKg + ' mL/kg q 12 h, up to 2 more doses');
    h += '<p class="note">' + esc(S.repeatText) + '</p>';
    h += '<details><summary>When to give surfactant</summary>';
    h += '<h4>Early (within 2 h of birth)</h4>' + list(S.early);
    h += '<h4>Consider rescue (&gt; 2 h after birth)</h4>' + list(S.rescue);
    h += '<h4>Consider a second dose at 12 h</h4>' + list(S.secondDose);
    h += '</details></div>';

    $('rsi-body').innerHTML = h;
  }

  /* ================= MEDS ================= */
  var MEDS = DATA.meds.drugs;
  var byId = {};
  MEDS.forEach(function (d) { byId[d.id] = d; d._name = d.name.toLowerCase(); d._text = (d.name + ' ' + d.cls + ' ' + (d.lead || '') + ' ' + (d.body || d.html.replace(/<[^>]+>/g, ' '))).toLowerCase(); });
  var classes = [];
  MEDS.forEach(function (d) { if (classes.indexOf(d.cls) < 0) classes.push(d.cls); });
  classes.sort();
  var medState = { q: '', cls: '', open: null };

  function buildMedChips() {
    var h = '<button type="button" class="chip" data-cls="" aria-pressed="true">All</button>';
    classes.forEach(function (c) { h += '<button type="button" class="chip" data-cls="' + esc(c) + '" aria-pressed="false">' + esc(c) + '</button>'; });
    $('medChips').innerHTML = h;
    $('medChips').addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return;
      medState.cls = b.getAttribute('data-cls');
      Array.prototype.forEach.call($('medChips').children, function (c) { c.setAttribute('aria-pressed', String(c === b)); });
      renderMedList();
    });
    $('medSearch').addEventListener('input', function () { medState.q = this.value; renderMedList(); });
  }

  function renderMedList() {
    var q = medState.q.trim().toLowerCase(), tokens = q ? q.split(/\s+/) : [];
    var hits = MEDS.filter(function (d) {
      if (medState.cls && d.cls !== medState.cls) return false;
      return tokens.every(function (t) { return d._text.indexOf(t) > -1; });
    });
    if (q) {
      var score = function (d) { return d._name.indexOf(q) === 0 ? 0 : d._name.indexOf(q) > -1 ? 1 : tokens.every(function (t) { return d._name.indexOf(t) > -1; }) ? 2 : 3; };
      hits.sort(function (a, b) { return score(a) - score(b) || a.name.localeCompare(b.name); });
    }
    var h = '', lastCls = null;
    hits.forEach(function (d) {
      if (!q && d.cls !== lastCls) { h += '<li class="grp">' + esc(d.cls) + '</li>'; lastCls = d.cls; }
      h += '<li><a href="#meds/' + d.id + '"><span>' + esc(d.name) + '</span>' + (q ? '<small>' + esc(d.cls) + '</small>' : '') + '</a></li>';
    });
    $('medList').innerHTML = h || '<li class="empty">No medications match “' + esc(medState.q) + '”.</li>';
    $('medCount').textContent = hits.length + ' of ' + MEDS.length;
  }

  // Minimal markdown: headings, nested lists, bold/italic, paragraphs, {{table:N}}
  function inline(raw, wt) {
    var hits = wt ? D.findDoses(raw, wt) : [], s = '', pos = 0;
    hits.forEach(function (x) { s += esc(raw.slice(pos, x.end)) + '\u0001' + esc(x.result) + '\u0002'; pos = x.end; });
    s += esc(raw.slice(pos));
    s = s.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<em>$2</em>');
    return s.replace(/\u0001/g, ' <span class="dz">= ').replace(/\u0002/g, '</span>').replace(/&lt;br\s*\/?&gt;/gi, '<br>');
  }

  function tableHtml(tid, t) {
    if (t.html) return '<div class="tbl">' + t.html.replace('<table', '<table data-tid="' + tid + '"') + '</div>';
    var h = '<div class="tbl"><table data-tid="' + tid + '">';
    if (t.cols && t.cols.some(function (c) { return c; })) h += '<tr>' + t.cols.map(function (c) { return '<th>' + inline(c) + '</th>'; }).join('') + '</tr>';
    t.rows.forEach(function (r) { h += '<tr>' + r.map(function (c) { return '<td>' + inline(c || '') + '</td>'; }).join('') + '</tr>'; });
    return h + '</table></div>';
  }

  function renderMd(md, drug, wt) {
    var out = '', stack = [], para = [];
    function flushPara() { if (para.length) { out += '<p>' + para.join(' ') + '</p>'; para = []; } }
    function closeLists(toIndent) {
      while (stack.length && stack[stack.length - 1].indent > toIndent) out += '</li></' + stack.pop().tag + '>';
    }
    function item(tag, indent, text) {
      flushPara();
      closeLists(indent);
      var top = stack[stack.length - 1];
      if (top && top.indent === indent) {
        if (top.tag === tag) { out += '</li><li>' + text; return; }
        out += '</li></' + stack.pop().tag + '>';
      }
      out += '<' + tag + '><li>' + text;
      stack.push({ tag: tag, indent: indent });
    }
    md.split('\n').forEach(function (line) {
      var m;
      if (!line.trim()) { flushPara(); return; }
      if ((m = /^\s*\{\{table:(\d+)\}\}\s*$/.exec(line))) {
        flushPara(); closeLists(-1);
        if (drug.tables && drug.tables[m[1]]) out += tableHtml(m[1], drug.tables[m[1]]);
        return;
      }
      if ((m = /^(#{1,6})\s+(.*)$/.exec(line))) {
        flushPara(); closeLists(-1);
        out += '<h4>' + inline(m[2].replace(/^\*\*(.*)\*\*$/, '$1'), wt) + '</h4>';
        return;
      }
      if ((m = /^(\s*)[-*]\s+(.*)$/.exec(line))) { item('ul', m[1].length, inline(m[2], wt)); return; }
      if ((m = /^(\s*)\d+[.)]\s+(.*)$/.exec(line))) { item('ol', m[1].length, inline(m[2], wt)); return; }
      if (stack.length) closeLists(-1);
      para.push(inline(line.trim(), wt));
    });
    flushPara(); closeLists(-1);
    return out;
  }

  // per-kg dose columns in tables: "Dose (mg/kg/dose)" -> add the amount beside each number
  function annotateTables(root, wt) {
    Array.prototype.forEach.call(root.querySelectorAll('table'), function (t) {
      var hr = t.rows[0]; if (!hr) return;
      Array.prototype.forEach.call(hr.cells, function (th, ci) {
        var m = /\((mg|mcg|units?)\/kg(?:\/(dose|day))?\)|\b(mg|mcg)\/kg\b/i.exec(th.textContent);
        if (!m || /interval|hours/i.test(th.textContent)) return;
        var per = (m[1] || m[3]) + '/kg' + (m[2] ? '/' + m[2] : '');
        Array.prototype.forEach.call(t.rows, function (r, ri) {
          if (ri === 0) return;
          var c = r.cells[ci]; if (!c || r.cells.length !== hr.cells.length || c.querySelector('.dz')) return;
          var d = D.cellDose(c.textContent, per, wt);
          if (d) c.innerHTML = esc(c.textContent.trim()) + ' <span class="dz">= ' + esc(d) + '</span>';
        });
      });
    });
  }

  // HTML bodies: add amounts beside per-kg expressions in text nodes
  function annotateText(root, wt) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), nodes = [], n;
    while ((n = walker.nextNode())) {
      if (!/\/\s*(kg|m2|m²)/i.test(n.nodeValue) || (n.parentNode.closest && n.parentNode.closest('.dz,th'))) continue;
      nodes.push(n);
    }
    nodes.forEach(function (tn) {
      var html = inline(tn.nodeValue, wt);
      if (html.indexOf('class="dz"') < 0) return;
      var sp = document.createElement('span');
      sp.innerHTML = html;
      tn.parentNode.replaceChild(sp, tn);
    });
  }

  function ownText(li) {
    var s = '';
    Array.prototype.forEach.call(li.childNodes, function (n) { if (n.nodeName !== 'UL' && n.nodeName !== 'OL') s += n.textContent; });
    return s;
  }

  function renderMedDetail(id, p) {
    var d = byId[id];
    if (!d) { $('medDetail').innerHTML = '<p>Medication not found.</p>'; return; }
    var b = D.baby(p), wt = p.wtKg, h = '';
    h += '<div class="med-head"><a href="#meds" class="back">‹ All medications</a><h2>' + esc(d.name) + '</h2><span class="tag">' + esc(d.cls) + '</span></div>';

    // dose rules for this patient
    var applied = [];
    if (d.rules) {
      var shown = [], unknown = {}, groups = {};
      d.rules.forEach(function (r) {
        var m = D.matches(r.w, b);
        if (r.g) { groups[r.g] = groups[r.g] || { hit: 0, unk: 0 }; if (m === true) groups[r.g].hit++; else if (m === null) groups[r.g].unk++; }
        if (m === true) { shown.push(r); applied.push(r); }
        else if (m === null) Object.keys(r.w).forEach(function (k) { if (b[k] === undefined) unknown[k] = 1; });
      });
      h += '<div class="card meds"><h2><span class="bar"></span>For this patient</h2>';
      var ageLine = [];
      if (b.ga !== undefined) ageLine.push('GA ' + p.gaWeeks + '+' + p.gaDays);
      if (b.pna !== undefined) ageLine.push('postnatal age ' + b.pna + ' d');
      if (b.pma !== undefined) ageLine.push('PMA ' + b.pma + '+' + b.pmaD);
      if (wt !== null) ageLine.push(fmt(wt) + ' kg');
      if (ageLine.length) h += '<p class="hint" style="margin-top:0">' + esc(ageLine.join(' · ')) + '</p>';
      if (shown.length) {
        h += '<ul class="rules">' + shown.map(function (r) {
          return '<li>' + (r.c ? '<small>' + esc(r.c) + '</small>' : '') + inline(r.t, wt) + (r.n ? '<small>' + esc(r.n) + '</small>' : '') + '</li>';
        }).join('') + '</ul>';
      }
      var miss = Object.keys(unknown).map(function (k) { return D.VAR_NAMES[k] || k; });
      if (miss.length) h += '<p class="need-inline">Enter ' + esc(miss.filter(function (x, i) { return miss.indexOf(x) === i; }).join(', ')) + ' on <a href="#patient">Patient</a> to choose the regimen.</p>';
      var gaps = Object.keys(groups).filter(function (k) { return !groups[k].hit && !groups[k].unk; });
      if (gaps.length) h += '<p class="need-inline">This patient’s age is not covered by the source for part of this entry; see full text.</p>';
      h += '</div>';
    } else if (wt === null) {
      h += '<p class="need-inline">Enter a weight on <a href="#patient">Patient</a> to see calculated amounts.</p>';
    }

    h += '<div class="card meds med-body"><h2><span class="bar"></span>Dosing</h2>';
    if (d.lead) h += '<p>' + inline(d.lead, wt) + '</p>';
    h += (d.html ? '<div class="html-body">' + d.html + '</div>' : renderMd(d.body, d, wt)) + '</div>';
    h += '<p class="disclaimer">Source: NICU Guidebook, entry ' + d.id + ' (copied ' + esc(DATA.meds.meta.copied) + ').</p>';

    var box = $('medDetail');
    box.innerHTML = h;
    if (wt !== null) {
      annotateTables(box, wt);
      var hb = box.querySelector('.html-body');
      if (hb) annotateText(hb, wt);
    }
    applied.forEach(function (r) {
      (r.hl || []).forEach(function (x) {
        if (x[0] === 'r') {
          var t = box.querySelector('table[data-tid="' + x[1] + '"]');
          if (t && t.rows[x[2]]) t.rows[x[2]].classList.add('hit');
        } else {
          Array.prototype.forEach.call(box.querySelectorAll('.med-body li'), function (li) { if (ownText(li).indexOf(x[1]) > -1) li.classList.add('hit'); });
        }
      });
    });
  }

  function routeMeds(sub, p) {
    medState.open = sub || null;
    $('medBrowse').hidden = !!sub;
    $('medDetail').hidden = !sub;
    if (sub) renderMedDetail(Number(sub), p);
  }

  /* ================= CALCS ================= */
  var CALCS = DATA.calcs;

  function buildCalcs() {
    var h = '';
    CALCS.forEach(function (c) {
      h += '<details class="card calcs calc" data-id="' + c.id + '"><summary><span class="bar"></span>' + esc(c.title) + '</summary>';
      h += '<p class="formula">' + esc(c.formula) + '</p><div class="calc-inputs">';
      c.inputs.forEach(function (inp) {
        var id = 'calc-' + c.id + '-' + inp.k;
        h += '<div><label for="' + id + '">' + esc(inp.label) + (inp.unit ? ' <span class="unit">(' + esc(inp.unit) + ')</span>' : '') + '</label>' +
          '<input id="' + id + '" type="number" inputmode="decimal" step="any"' + (inp.from ? ' data-from="' + inp.from + '"' : '') + ' /></div>';
      });
      h += '</div><div class="calc-out" id="calc-' + c.id + '-out"></div></details>';
    });
    $('calcList').innerHTML = h;
    $('calcList').addEventListener('input', function (e) {
      var card = e.target.closest('.calc'); if (card) computeCalc(card.getAttribute('data-id'), NC.getPatient());
    });
    $('calcList').addEventListener('click', function (e) {
      var b = e.target.closest('[data-use-wt]'); if (!b) return;
      NC.setWeightKg(parseFloat(b.getAttribute('data-use-wt')));
    });
  }

  function computeCalc(id, p) {
    var c = CALCS.filter(function (x) { return x.id === id; })[0], v = {};
    c.inputs.forEach(function (inp) {
      var el = $('calc-' + c.id + '-' + inp.k);
      if (inp.from === 'wt') el.placeholder = p.wtKg !== null ? fmt(p.wtKg) + ' (patient)' : '';
      v[inp.k] = el.value !== '' ? el.value : (inp.from === 'wt' && p.wtKg !== null ? p.wtKg : '');
    });
    var res = c.compute(v), out = $('calc-' + c.id + '-out');
    if (!res) { out.innerHTML = ''; return; }
    out.innerHTML = res.map(function (r) {
      if (r.text) return kv(esc(r.label), '<span class="txt">' + esc(r.text) + '</span>');
      var val = r.dp !== undefined ? r.value.toFixed(r.dp) : fmt(r.value);
      var extra = r.usable === 'wt' && r.value > 0 ? '<button type="button" class="btn secondary small" data-use-wt="' + r.value.toFixed(3) + '">Use as patient weight</button>' : '';
      return kv(esc(r.label), esc(val) + (r.unit ? ' ' + esc(r.unit) : '')) + extra;
    }).join('');
  }

  function renderCalcs(p) { CALCS.forEach(function (c) { computeCalc(c.id, p); }); }

  /* ================= wire up ================= */
  buildMedChips();
  renderMedList();
  buildCalcs();

  NC.register({ tab: 'rsi', render: renderRsi });
  NC.register({ tab: 'meds', render: function (p) { if (medState.open) renderMedDetail(Number(medState.open), p); }, route: routeMeds });
  NC.register({ tab: 'calcs', render: renderCalcs });
})();
