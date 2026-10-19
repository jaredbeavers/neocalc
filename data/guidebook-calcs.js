/* NeoCalc calculators - copied from the NICU Guidebook calculators (entries 300001-300018) on 2026-10-18.
   Only those not already covered elsewhere in NeoCalc (feeds, GIR, UAC/UVC, ETT are in other tabs).
   Inputs marked from:'wt' default to the patient's weight when left blank. */
window.NEOCALC_DATA = window.NEOCALC_DATA || {};
(function () {
  function num(v) { var x = parseFloat(v); return isNaN(x) ? null : x; }
  function all() { for (var i = 0; i < arguments.length; i++) if (arguments[i] === null) return false; return true; }
  function bsa(kg) { return 0.05 * kg + 0.05; }

  window.NEOCALC_DATA.calcs = [
    { id: 'wt', src: 300001, title: 'Weight conversion', formula: 'kg = lb × 0.453592 + oz × 0.0283495',
      inputs: [{ k: 'lb', label: 'Pounds', unit: 'lb' }, { k: 'oz', label: 'Ounces', unit: 'oz' }],
      compute: function (v) { var lb = num(v.lb), oz = num(v.oz); if (lb === null && oz === null) return null;
        return [{ label: 'Weight', value: (lb || 0) * 0.453592 + (oz || 0) * 0.0283495, unit: 'kg', dp: 3, usable: 'wt' }]; } },
    { id: 'bsa', src: 300004, title: 'Body surface area', formula: 'BSA (m²) = 0.05 × weight (kg) + 0.05',
      inputs: [{ k: 'wt', label: 'Weight', unit: 'kg', from: 'wt' }],
      compute: function (v) { var w = num(v.wt); if (w === null) return null; return [{ label: 'BSA', value: bsa(w), unit: 'm²', dp: 3 }]; } },
    { id: 'ebv', src: 300010, title: 'Estimated blood volume', formula: 'Blood volume (mL) = 80 mL/kg × weight (kg)',
      inputs: [{ k: 'wt', label: 'Weight', unit: 'kg', from: 'wt' }],
      compute: function (v) { var w = num(v.wt); if (w === null) return null; return [{ label: 'Estimated blood volume', value: 80 * w, unit: 'mL' }]; } },
    { id: 'pet', src: 300011, title: 'Partial exchange transfusion', formula: 'Exchange volume (mL) = blood volume (mL) × (1 − desired Hct ÷ observed Hct)',
      inputs: [{ k: 'wt', label: 'Weight (blood volume = 80 mL/kg)', unit: 'kg', from: 'wt' }, { k: 'bv', label: 'Blood volume (overrides weight)', unit: 'mL' }, { k: 'obs', label: 'Observed Hct', unit: '%' }, { k: 'des', label: 'Desired Hct', unit: '%' }],
      compute: function (v) { var w = num(v.wt), bv = num(v.bv), o = num(v.obs), d = num(v.des); var B = bv !== null ? bv : (w !== null ? 80 * w : null);
        if (!all(B, o, d) || o <= 0) return null;
        var r = [{ label: 'Blood volume used', value: B, unit: 'mL' }, { label: 'Exchange volume', value: B * (1 - d / o), unit: 'mL' }];
        if (d >= o) r.push({ label: 'Check', text: 'Desired Hct is not lower than observed Hct, so no volume is removed.' });
        return r; } },
    { id: 'dve', src: 300012, title: 'Total (double volume) exchange', formula: 'Exchange volume (mL) = 160 mL/kg × weight (kg); aliquots ≤ 10% of blood volume (80 mL/kg × weight)',
      inputs: [{ k: 'wt', label: 'Weight', unit: 'kg', from: 'wt' }],
      compute: function (v) { var w = num(v.wt); if (w === null) return null;
        return [{ label: 'Total exchange volume', value: 160 * w, unit: 'mL' }, { label: 'Largest aliquot (10% of blood volume)', value: 0.1 * 80 * w, unit: 'mL' }]; } },
    { id: 'oi', src: 300013, title: 'Oxygen index', formula: 'OI = FiO₂ (%) × mean airway pressure (cm H₂O) ÷ postductal PaO₂ (Torr)',
      inputs: [{ k: 'fio2', label: 'FiO₂', unit: '%' }, { k: 'map', label: 'Mean airway pressure', unit: 'cm H₂O' }, { k: 'pao2', label: 'Postductal PaO₂', unit: 'Torr' }],
      compute: function (v) { var f = num(v.fio2), m = num(v.map), p = num(v.pao2); if (!all(f, m, p) || p <= 0) return null; return [{ label: 'Oxygen index', value: f * m / p, unit: '' }]; } },
    { id: 'comp', src: 300014, title: 'Compliance', formula: 'Compliance = change in volume (cc) ÷ change in pressure (cm H₂O)',
      inputs: [{ k: 'dv', label: 'Change in volume', unit: 'cc' }, { k: 'dp', label: 'Change in pressure', unit: 'cm H₂O' }],
      compute: function (v) { var a = num(v.dv), p = num(v.dp); if (!all(a, p) || p === 0) return null; return [{ label: 'Compliance', value: a / p, unit: 'cc/cm H₂O' }]; } },
    { id: 'ag', src: 300015, title: 'Anion gap', formula: 'Anion gap (mmol/L) = Na − (Cl + HCO₃)',
      inputs: [{ k: 'na', label: 'Na', unit: 'mmol/L' }, { k: 'cl', label: 'Cl', unit: 'mmol/L' }, { k: 'hco3', label: 'HCO₃', unit: 'mmol/L' }],
      compute: function (v) { var a = num(v.na), c = num(v.cl), h = num(v.hco3); if (!all(a, c, h)) return null; return [{ label: 'Anion gap', value: a - (c + h), unit: 'mmol/L' }]; } },
    { id: 'fena', src: 300016, title: 'Fractional excretion of sodium', formula: 'FENa (%) = 100 × (urine Na × plasma creatinine) ÷ (urine creatinine × plasma Na)',
      inputs: [{ k: 'una', label: 'Urine Na', unit: '' }, { k: 'pcr', label: 'Plasma creatinine', unit: '' }, { k: 'ucr', label: 'Urine creatinine', unit: '' }, { k: 'pna', label: 'Plasma Na', unit: '' }],
      compute: function (v) { var a = num(v.una), b = num(v.pcr), c = num(v.ucr), d = num(v.pna); if (!all(a, b, c, d) || c * d === 0) return null; return [{ label: 'FENa', value: 100 * a * b / (c * d), unit: '%' }]; } },
    { id: 'caphos', src: 300017, title: 'Calcium phosphate precipitation', formula: 'Value = (phosphate (mmol) × 2 + calcium (mEq)) × 1000 ÷ total TPN volume per day (mL). Goal < 55',
      inputs: [{ k: 'phos', label: 'Phosphate', unit: 'mmol' }, { k: 'ca', label: 'Calcium', unit: 'mEq' }, { k: 'vol', label: 'Total TPN volume per day', unit: 'mL' }],
      compute: function (v) { var p = num(v.phos), c = num(v.ca), t = num(v.vol); if (!all(p, c, t) || t <= 0) return null; var x = (p * 2 + c) * 1000 / t;
        return [{ label: 'Value', value: x, unit: '' }, { label: 'Against goal', text: x < 55 ? 'Below 55 (meets the goal)' : '55 or higher (does not meet the goal)' }]; } },
    { id: 'osm', src: 300018, title: 'Osmolality', formula: 'mOsm/L = amino acids (g/L) × 8 + glucose (g/L) × 7 + Na (mEq/L) × 2 + phosphorus (mg/L) × 0.2 − 50',
      inputs: [{ k: 'aa', label: 'Amino acids', unit: 'g/L' }, { k: 'glu', label: 'Glucose', unit: 'g/L' }, { k: 'na', label: 'Na', unit: 'mEq/L' }, { k: 'phos', label: 'Phosphorus', unit: 'mg/L' }],
      compute: function (v) { var a = num(v.aa), g = num(v.glu), n = num(v.na), p = num(v.phos); if (!all(a, g, n, p)) return null; return [{ label: 'Osmolality', value: a * 8 + g * 7 + n * 2 + p * 0.2 - 50, unit: 'mOsm/L' }]; } }
  ];
})();
