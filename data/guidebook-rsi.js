/* NeoCalc RSI data - copied from the NICU Guidebook on 2026-10-18.
   Sources (guidebook entry ids, for tracing only; NeoCalc does not read the guidebook):
     ETT table          data table 51 (entry 111)
     ETT formulas       calculators 300005, 300006
     Premedication      drug entry 200155 and guideline page 394 (updated by AL 09/2023)
     Surfactant         drug entry 200142 (Poractant / Curosurf) and guideline page 470 (updated 12/2020, AL 09/2023) */
window.NEOCALC_DATA = window.NEOCALC_DATA || {};
window.NEOCALC_DATA.rsi = {
  ettTable: {
    cols: ['Gestational age', 'Weight (kg)', 'ETT size', 'Depth (cm)'],
    // minWt/maxWt pick the row for the current weight (upper bound exclusive)
    rows: [
      { ga: '< 28 weeks', wt: '< 1', size: '2.5', depth: '6–7', minWt: 0, maxWt: 1 },
      { ga: '28–34 weeks', wt: '1–2', size: '3.0', depth: '7–8', minWt: 1, maxWt: 2 },
      { ga: '34–38 weeks', wt: '2–3', size: '3.5', depth: '8–9', minWt: 2, maxWt: 3 },
      { ga: '≥ 38 weeks', wt: '≥ 3', size: '3.5–4', depth: '9–10', minWt: 3, maxWt: Infinity }
    ]
  },
  formulas: {
    ettSize: 'ETT size (mm) = gestational age (weeks) ÷ 10',
    tipToLip: 'Length to lip (cm) = weight (kg) + 6'
  },

  // Order of administration per the premedication guideline. IV push, not on the pump.
  // Atropine: guideline page 394 prints "0.2mg/kg"; drug entries 200155 and 200036 give 0.02 mg/kg, used here.
  premeds: [
    { name: 'Atropine', perKg: 0.02, unit: 'mg', dose: '0.02 mg/kg IV' },
    { name: 'Lorazepam (Ativan) – optional', perKgLo: 0.05, perKg: 0.1, unit: 'mg', dose: '0.05–0.1 mg/kg IV',
      note: 'Consider the lower dose (0.05 mg/kg). Half-life can be up to 12 h. Withhold for infants < 34 weeks GA and those likely to wean and extubate quickly.',
      withholdBelowGa: 34 },
    { name: 'Fentanyl', perKg: 2, unit: 'mcg', dose: '2 mcg/kg IV',
      note: 'Slow push over 1 minute preferred.' },
    { name: 'Rocuronium', perKg: 1, unit: 'mg', dose: '1 mg/kg IV',
      note: 'Treatment for chest wall rigidity: have it ordered, diluted and ready.' }
  ],
  premedNotes: {
    candidates: [
      'Spontaneous respiratory effort and good heart rate',
      'IV access in place'
    ],
    exclusions: [
      'Emergent intubation during resuscitation or acute deterioration',
      'Craniofacial or airway anomalies where the infant may need to maintain their own airway',
      'Planned INSURE (intubate, surfactant, extubate): give atropine alone if IV access is in place or easily obtained'
    ],
    avoid: [
      'A sedative (e.g. Ativan) alone with no analgesic',
      'A muscle relaxant / paralytic without an analgesic',
      'IM administration'
    ],
    points: [
      'Limit less experienced providers to 2 intubation attempts',
      'Tiny Baby protocol infants: most experienced provider intubates',
      'Attending or upper level fellow in the room before drugs are given',
      'Extra RN and an RT in the room before medication administration'
    ]
  },

  surfactant: {
    name: 'Poractant alfa (Curosurf)',
    initialPerKg: 2.5,
    repeatPerKg: 1.25,
    repeatText: 'May repeat 1.25 mL/kg/dose at 12-hour intervals for up to 2 additional doses; discuss criteria with the attending.',
    early: [
      'Extremely preterm (22–24 weeks): early intubation and surfactant within 2 hours of birth',
      'Preterm with apnea or low HR not responding to PPV'
    ],
    rescue: [
      'pH < 7.20 and not improving',
      'CO₂ > 60 and not improving',
      'Persistent FiO₂ > 30% to maintain target saturations',
      'Chest radiograph consistent with surfactant deficiency',
      'Severe increased work of breathing',
      'Term / late preterm (> 34 weeks) with RDS, pneumonia, meconium aspiration or other parenchymal disease and persistent FiO₂ > 40%'
    ],
    secondDose: [
      'Remains on significant ventilator support and/or FiO₂ persistently > 30%',
      'Chest film consistent with RDS'
    ]
  }
};
