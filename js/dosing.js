/* NeoCalc dosing helpers (adapted from the NICU Guidebook engine; NeoCalc keeps its own copy).
   Age conventions:
     - day of life 1 = day of birth, so postnatal age (pna) in days = DOL - 1
     - postmenstrual age (pma) = GA at birth + postnatal age, in completed weeks
     - ga = completed weeks at birth */
(function (root) {
  'use strict';
  var D = {};

  // patient = { wtKg, gaWeeks, gaDays, dol } from the Patient screen
  D.baby = function (p) {
    var b = {};
    if (p.wtKg !== null) b.wt = p.wtKg;
    if (p.gaWeeks !== null) b.ga = p.gaWeeks;
    if (p.dol !== null) b.pna = p.dol - 1;
    if (p.gaWeeks !== null && p.dol !== null) {
      var days = p.gaWeeks * 7 + p.gaDays + (p.dol - 1);
      b.pma = Math.floor(days / 7);
      b.pmaD = days % 7;
    }
    return b;
  };

  /* when = { ga:[[">=",32]], pna:[["<=",7]], ... } -> true / false / null (input missing) */
  D.matches = function (when, b) {
    if (!when) return true;
    var unknown = false;
    for (var k in when) {
      var v = b[k];
      if (v === undefined || v === null || isNaN(v)) { unknown = true; continue; }
      var ops = when[k];
      for (var i = 0; i < ops.length; i++) if (!cmp(v, ops[i][0], ops[i][1])) return false;
    }
    return unknown ? null : true;
  };
  function cmp(v, op, x) {
    switch (op) { case '<': return v < x; case '<=': return v <= x; case '>': return v > x; case '>=': return v >= x; case '==': return v === x; }
    return false;
  }
  D.VAR_NAMES = { ga: 'gestational age', pma: 'gestational age and day of life', pna: 'day of life', wt: 'weight' };

  D.fmt = function (x) {
    if (!isFinite(x)) return '';
    var ax = Math.abs(x), dp = ax < 0.1 ? 4 : ax < 1 ? 3 : 2;
    var f = Math.pow(10, dp), r = Math.round(parseFloat((ax * f).toPrecision(12))) / f;
    var s = (x < 0 ? -r : r).toFixed(dp);
    if (s.indexOf('.') > -1) s = s.replace(/0+$/, '').replace(/\.$/, '');
    var parts = s.split('.');
    if (parts[0].length > 4) parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  D.bsa = function (kg) { return 0.05 * kg + 0.05; };

  /* Finds "<num or range> <unit>/kg[/<time>]" (and "/m2") in text and works out the amount for this weight. */
  var NUM = '\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?|\\d+(?:\\.\\d+)?';
  var UNITS = 'mg|mcg|µg|ug|g|gm|grams?|units?|milliunits?|mEq|meq|ml|mL|mmol|kcal|cal';
  var TIMES = 'dose|day|d|hr|hour|h|min|minute|feed|week|wk';
  var RE_SRC = '(' + NUM + ')(?:\\s*(?:–|—|-|to)\\s*(' + NUM + '))?\\s*(' + UNITS + ')\\s*\\/\\s*(kg|m2|m²)(?:\\s*\\/\\s*(' + TIMES + ')\\b)?';
  // fragments whose units are uncertain in the source; never multiplied
  var NOCALC = ['40 mcg/kg IV/PO', '24 mg/kg/day'];
  function parseNum(s) { return parseFloat(String(s).replace(/,/g, '')); }
  function unitOut(u) { return u.replace(/^grams?$/i, 'g').replace(/^gm$/i, 'g').replace(/^ug$/i, 'mcg').replace(/^µg$/i, 'mcg').replace(/^meq$/i, 'mEq').replace(/^ml$/i, 'mL'); }

  D.findDoses = function (text, wt) {
    var re = new RegExp(RE_SRC, 'gi'), out = [], m;
    while ((m = re.exec(text)) !== null) {
      var per = m[4].toLowerCase().replace('²', '2');
      var nocalc = NOCALC.some(function (n) { var at = text.indexOf(n); while (at > -1) { if (m.index >= at && m.index < at + n.length) return true; at = text.indexOf(n, at + 1); } return false; });
      var before = text.slice(Math.max(0, m.index - 40), m.index);
      if (/[<>≤≥]\s*$/.test(before)) continue; // a threshold such as "> 2 mg/kg", not a dose
      var res = { start: m.index, end: m.index + m[0].length };
      var base = per === 'kg' ? wt : (wt ? D.bsa(wt) : undefined);
      if (!nocalc && base) {
        var lo = parseNum(m[1]), hi = m[2] ? parseNum(m[2]) : null;
        var tail = m[5] ? '/' + m[5].toLowerCase() : '';
        res.result = D.fmt(lo * base) + (hi !== null ? '–' + D.fmt(hi * base) : '') + ' ' + unitOut(m[3]) + tail;
        out.push(res);
      }
    }
    return out;
  };

  /* table cell holding only a number or range under a "(mg/kg/dose)" style column */
  D.cellDose = function (text, perUnit, wt) {
    var m = /^\s*(\d+(?:\.\d+)?)(?:\s*[-–]\s*(\d+(?:\.\d+)?))?\s*$/.exec(text);
    if (!m || !wt) return null;
    var parts = perUnit.split('/');
    var unit = parts[0], tail = parts[2] ? '/' + parts[2] : '';
    var lo = parseFloat(m[1]) * wt, hi = m[2] ? parseFloat(m[2]) * wt : null;
    return D.fmt(lo) + (hi !== null ? '–' + D.fmt(hi) : '') + ' ' + unit + tail;
  };

  root.NeoDosing = D;
})(window);
