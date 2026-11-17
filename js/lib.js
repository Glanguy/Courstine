/* Courstine – logique pure (sans DOM) : ingrédients, liste de courses, import TikTok, partage.
   Utilisable dans le navigateur (window.Courstine) et dans Node (tests). */
(function (root) {
  'use strict';

  /* ---------- Texte ---------- */
  const strip = (s) =>
    String(s)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/œ/g, 'oe')
      .replace(/æ/g, 'ae')
      .trim();

  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

  /* ---------- Unités ---------- */
  const UNIT_RULES = [
    [/^(?:kg|kilos?|kilogrammes?)(?![a-z])/, 'kg'],
    [/^(?:g|gr|grammes?)(?![a-z])/, 'g'],
    [/^(?:ml|millilitres?)(?![a-z])/, 'ml'],
    [/^(?:cl|centilitres?)(?![a-z])/, 'cl'],
    [/^(?:dl|decilitres?)(?![a-z])/, 'dl'],
    [/^(?:l|litres?)(?![a-z])/, 'l'],
    [/^(?:cuilleres? a soupe|c\.? ?a\.? ?soupe|c\.? ?a\.? ?s\.?|cas|cs)(?![a-z])/, 'c. à soupe'],
    [/^(?:cuilleres? a cafe|c\.? ?a\.? ?cafe|c\.? ?a\.? ?c\.?|cac|cc)(?![a-z])/, 'c. à café'],
    [/^sachets?(?![a-z])/, 'sachet'],
    [/^pincees?(?![a-z])/, 'pincée'],
    [/^gousses?(?![a-z])/, 'gousse'],
    [/^tranches?(?![a-z])/, 'tranche'],
    [/^boites?(?![a-z])/, 'boîte'],
    [/^pots?(?![a-z])/, 'pot'],
    [/^verres?(?![a-z])/, 'verre'],
    [/^bottes?(?![a-z])/, 'botte'],
    [/^bouquets?(?![a-z])/, 'bouquet'],
    [/^paquets?(?![a-z])/, 'paquet'],
    [/^briques?(?![a-z])/, 'brique'],
    [/^feuilles?(?![a-z])/, 'feuille'],
    [/^branches?(?![a-z])/, 'branche'],
  ];
  const PLURAL_UNITS = new Set([
    'sachet', 'pincée', 'gousse', 'tranche', 'boîte', 'pot', 'verre',
    'botte', 'bouquet', 'paquet', 'brique', 'feuille', 'branche',
  ]);
  const FRACTIONS = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 };

  /* ---------- Lecture d'une ligne d'ingrédient ----------
     "100 g beurre" | "2 c. à soupe de sucre" | "3 œufs" | "1/2 citron" | "sel" */
  function parseLine(line) {
    let s = String(line).replace(/^[\s\-–•*·]+/, '').trim();
    if (!s) return null;
    let qty = null;
    let m;
    if ((m = s.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)(?=\s|$)/))) {
      qty = +m[1] + +m[2] / +m[3];
      s = s.slice(m[0].length);
    } else if ((m = s.match(/^(\d+)\s*\/\s*(\d+)(?![\d])/))) {
      qty = +m[1] / +m[2];
      s = s.slice(m[0].length);
    } else if ((m = s.match(/^(\d+)?\s*([½¼¾⅓⅔])/))) {
      qty = (m[1] ? +m[1] : 0) + FRACTIONS[m[2]];
      s = s.slice(m[0].length);
    } else if ((m = s.match(/^(\d+(?:[.,]\d+)?)/))) {
      qty = parseFloat(m[1].replace(',', '.'));
      s = s.slice(m[0].length);
    }
    s = s.trim();
    let unit = '';
    if (qty !== null) {
      const norm = strip(s);
      for (const [rx, canon] of UNIT_RULES) {
        const um = norm.match(rx);
        if (um) {
          unit = canon;
          s = s.slice(um[0].length).trim();
          break;
        }
      }
    }
    s = s.replace(/^(?:de\s+la\s+|de\s+l['’]|de\s+|du\s+|des\s+|d['’])/i, '').replace(/[.,;]+$/, '').trim();
    if (!s) return null;
    return { qty, unit, name: s };
  }

  function parseIngredients(text) {
    return String(text || '')
      .split(/\r?\n/)
      .map(parseLine)
      .filter(Boolean);
  }

  /* ---------- Affichage des quantités ---------- */
  const fmtNum = (n) => String(Math.round(n * 100) / 100).replace('.', ',');

  function qtyText(qty, unit) {
    if (qty == null) return '';
    if (unit === 'g' && qty >= 1000) return fmtNum(qty / 1000) + ' kg';
    if (unit === 'ml' && qty >= 1000) return fmtNum(qty / 1000) + ' l';
    if (!unit) return fmtNum(qty);
    const u = qty > 1 && PLURAL_UNITS.has(unit) ? unit + 's' : unit;
    return fmtNum(qty) + ' ' + u;
  }

  // Ligne lisible : "100 g de beurre", "3 œufs"
  function ingredientLabel(ing) {
    const q = qtyText(ing.qty, ing.unit);
    if (!q) return ing.name;
    if (!ing.unit) return q + ' ' + ing.name;
    const vowel = /^[aeiouyéèêàâîôûhœ]/i.test(ing.name);
    return q + ' ' + (vowel ? "d'" : 'de ') + ing.name;
  }

  // Format d'édition (relu tel quel par parseLine) : "100 g beurre"
  function ingredientEditLine(ing) {
    const q = ing.qty == null ? '' : fmtNum(ing.qty);
    return [q, ing.unit, ing.name].filter(Boolean).join(' ');
  }

  /* ---------- Totaux de la liste de courses ---------- */
  function nameKey(name) {
    return strip(name)
      .replace(/[^a-z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map((w) => (w.length > 3 && /[sx]$/.test(w) && !/ss$/.test(w) ? w.slice(0, -1) : w))
      .join(' ');
  }

  function toBase(qty, unit) {
    if (qty == null) return { qty: null, unit };
    switch (unit) {
      case 'kg': return { qty: qty * 1000, unit: 'g' };
      case 'cl': return { qty: qty * 10, unit: 'ml' };
      case 'dl': return { qty: qty * 100, unit: 'ml' };
      case 'l': return { qty: qty * 1000, unit: 'ml' };
      default: return { qty, unit };
    }
  }

  const CATEGORIES = [
    ['Fruits et légumes', ['pomme', 'poire', 'banane', 'citron', 'orange', 'fraise', 'framboise', 'tomate', 'oignon', 'ail', 'echalote', 'carotte', 'courgette', 'aubergine', 'poivron', 'salade', 'laitue', 'champignon', 'patate', 'concombre', 'avocat', 'persil', 'basilic', 'coriandre', 'ciboulette', 'menthe', 'thym', 'romarin', 'epinard', 'brocoli', 'chou', 'haricot', 'poireau', 'celeri', 'radis', 'mangue', 'ananas', 'courge', 'potiron', 'raisin', 'cerise', 'peche', 'abricot', 'kiwi', 'legume', 'fruit']],
    ['Crèmerie', ['beurre', 'lait', 'creme', 'yaourt', 'fromage', 'gruyere', 'emmental', 'parmesan', 'mozzarella', 'oeuf', 'mascarpone', 'ricotta', 'feta', 'chevre', 'comte', 'raclette', 'skyr']],
    ['Viandes et poissons', ['poulet', 'boeuf', 'porc', 'jambon', 'lardon', 'bacon', 'saumon', 'thon', 'poisson', 'crevette', 'steak', 'saucisse', 'dinde', 'veau', 'agneau', 'viande', 'cabillaud', 'merguez', 'chorizo']],
    ['Boulangerie', ['pain', 'baguette', 'brioche', 'tortilla', 'wrap']],
    ['Épicerie', ['farine', 'sucre', 'sel', 'poivre', 'huile', 'vinaigre', 'pate', 'riz', 'semoule', 'levure', 'chocolat', 'vanille', 'cacao', 'miel', 'moutarde', 'sauce', 'conserve', 'lentille', 'pois', 'bouillon', 'epice', 'cannelle', 'amande', 'noisette', 'cafe', 'the', 'ketchup', 'mayonnaise', 'confiture', 'cereale', 'biscuit', 'noix', 'maizena', 'fecule', 'coulis']],
  ];
  const CATEGORY_ORDER = [...CATEGORIES.map((c) => c[0]), 'Autres'];

  function category(key) {
    const words = key.split(' ');
    for (const [label, kws] of CATEGORIES) {
      for (const w of words) {
        if (kws.some((k) => w === k || w.startsWith(k))) return label;
      }
    }
    return 'Autres';
  }

  const round3 = (n) => Math.round(n * 1000) / 1000;

  /* Identifiant d'un article de la liste : nom normalisé + unité de base */
  function itemId(name, qty, unit) {
    return nameKey(name) + '|' + (qty == null ? '' : toBase(qty, unit).unit);
  }

  /* lines : [{ qty, unit, name, from, occ, manual }]  →  articles fusionnés
     100 g + 125 g de beurre  =>  225 g de beurre
     rq = part venant des recettes, occs = repas qui ont fourni l'ingrédient */
  function aggregate(lines) {
    const byName = new Map();
    for (const ln of lines) {
      const display = String(ln.name).trim();
      const key = nameKey(display);
      if (!key) continue;
      const b = toBase(ln.qty, ln.unit);
      const none = b.qty == null;
      let g = byName.get(key);
      if (!g) {
        g = { key, variants: new Map(), subs: new Map(), from: [], nullOccs: new Set() };
        byName.set(key, g);
      }
      g.variants.set(display, (g.variants.get(display) || 0) + 1);
      const sk = none ? '∅' : b.unit;
      let s = g.subs.get(sk);
      if (!s) {
        s = { unit: none ? '' : b.unit, qty: none ? null : 0, rq: 0, occs: new Set() };
        g.subs.set(sk, s);
      }
      if (!none) {
        s.qty += b.qty;
        if (!ln.manual) s.rq += b.qty;
      }
      if (ln.occ) (none ? g.nullOccs : s.occs).add(ln.occ);
      if (ln.from && !g.from.includes(ln.from)) g.from.push(ln.from);
    }
    const out = [];
    for (const g of byName.values()) {
      const quantified = [...g.subs.values()].filter((s) => s.qty != null);
      const rows = quantified.length ? quantified : [g.subs.get('∅')];
      for (const s of rows) {
        const qty = s.qty == null ? null : round3(s.qty);
        const variants = [...g.variants.keys()];
        let name = variants[0];
        if (!s.unit && qty != null) {
          // singulier ou pluriel selon le total, en préférant l'orthographe accentuée (œufs)
          const plural = (v) => /s$/i.test(v);
          const accent = (v) => (/[œéèêàâçîôû]/i.test(v) ? 0 : 1);
          const pool = variants.filter((v) => plural(v) === qty > 1);
          const cands = pool.length ? pool : variants;
          name = [...cands].sort((a, b) => accent(a) - accent(b))[0];
        }
        out.push({
          id: g.key + '|' + (s.unit || ''),
          key: g.key,
          name: cap(name),
          qty,
          unit: s.unit,
          text: qtyText(qty, s.unit),
          cat: category(g.key),
          from: g.from,
          rq: s.qty == null ? 0 : round3(s.rq),
          occs: [...s.occs, ...g.nullOccs],
        });
      }
    }
    out.sort(
      (a, b) =>
        CATEGORY_ORDER.indexOf(a.cat) - CATEGORY_ORDER.indexOf(b.cat) ||
        a.name.localeCompare(b.name, 'fr')
    );
    return out;
  }

  /* ---------- Semaine ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const mondayOf = (d) => addDays(d, -((d.getDay() + 6) % 7));
  const weekDays = (offset, now) => {
    const m = addDays(mondayOf(now || new Date()), (offset || 0) * 7);
    return Array.from({ length: 7 }, (_, i) => addDays(m, i));
  };
  const SLOTS = ['midi', 'soir'];

  /* ---------- Liste de courses unique ----------
     = ingrédients des repas prévus aujourd'hui et après
     + ajouts et corrections à la main (state.extras, quantités signées)
     - ce qui a déjà été acheté et supprimé (state.cleared)            */
  const occKey = (day, slot, rid) => day + '|' + slot + '|' + rid;

  function shoppingList(state, todayIso) {
    const lines = [];
    const byId = new Map(state.recipes.map((r) => [r.id, r]));
    const cleared = state.cleared || {};
    for (const day of Object.keys(state.plan).sort()) {
      if (day < todayIso) continue;
      for (const slot of SLOTS) {
        const rid = (state.plan[day] || {})[slot];
        const r = byId.get(rid);
        if (!r) continue;
        const occ = occKey(day, slot, rid);
        for (const ing of r.ingredients) {
          if (cleared[occ + '#' + nameKey(ing.name)]) continue;
          lines.push({ ...ing, from: r.title, occ });
        }
      }
    }
    for (const x of state.extras || []) lines.push({ name: x.name, qty: x.qty, unit: x.unit, manual: true });
    const checked = state.checked || {};
    return aggregate(lines)
      .filter((it) => it.qty == null || it.qty > 0.0005)
      .map((it) => {
        const c = checked[it.id];
        return { ...it, done: c != null && (it.qty == null || it.qty <= c + 1e-6) };
      });
  }

  /* ---------- Description TikTok → recette ---------- */
  const NUMBER_WORDS = {
    un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8,
    neuf: 9, dix: 10, douze: 12, quinze: 15, vingt: 20, demi: 0.5, 'demie': 0.5,
  };
  const PIC = /\p{Extended_Pictographic}/u;
  const QTY_END = /^(.*?[a-zà-ÿœ)])[\s:=–-]*(\d+(?:[.,]\d+)?\s*(?:kg|g|gr|grammes?|ml|cl|dl|l|litres?)\.?)$/i;

  function cleanPiece(p) {
    let s = p.replace(/^[\s\-–—•*·.)>:]+|[\s.;:]+$/g, '').replace(/^\d+[.)]\s+(?=\D)/, '').trim();
    s = s.replace(/^(?:il\s+(?:te|vous|nous)\s+faut|il\s+faut|tu\s+as\s+besoin\s+de|prends?|prenez|ajoute[rz]?|avec)\s+/i, '');
    const w = s.match(/^([a-zéè]+)\b\s*/i);
    if (w && NUMBER_WORDS[strip(w[1])] != null && s.length > w[0].length) {
      s = NUMBER_WORDS[strip(w[1])] + ' ' + s.slice(w[0].length);
    }
    const m = s.match(QTY_END);
    if (m && !/^\d/.test(s)) s = m[2] + ' ' + m[1];
    return s;
  }

  function extractRecipe(raw) {
    let t = String(raw || '').replace(/\r/g, '').replace(/[️⃣‍]/g, '');
    t = t.replace(/(^|\s)[#@][^\s#@]+/g, '$1');
    const ingRx = /ingr[ée]dients?(?:\s+pour[^:\n]*)?\s*[:：]?/i;
    const stepRx = /\n?\s*(?:pr[ée]paration|[ée]tapes?|instructions?|d[ée]roul[ée]|recette)\s*[:：]/i;
    let head = '';
    let body = t;
    let steps = '';
    const hasKeyword = ingRx.test(t);
    if (hasKeyword) {
      const i = t.search(ingRx);
      head = t.slice(0, i);
      body = t.slice(i).replace(ingRx, '');
    }
    const si = body.search(stepRx);
    if (si >= 0) {
      steps = body.slice(si).replace(stepRx, '').trim();
      body = body.slice(0, si);
    }
    const pieces = body
      .split(/\n|[;•·|!?]|,\s+|\s[-–]\s|\s\+\s|\s(?:et|puis)\s(?=\d|un\b|une\b|deux\b|trois\b|quatre\b|cinq\b|six\b|demi)|\p{Extended_Pictographic}/iu)
      .map(cleanPiece)
      .filter((p) => p && /[a-zà-ÿœ]/i.test(p) && p.length <= 70 && !/:$/.test(p) && !/^pour\s/i.test(p));
    const isQty = (p) => /^(\d|[½¼¾⅓⅔])/.test(p);
    const ings = (hasKeyword ? pieces : pieces.filter(isQty)).map(parseLine).filter(Boolean);
    if (!hasKeyword) {
      const firstLine = t.split('\n').find((l) => l.trim()) || '';
      head = isQty(cleanPiece(firstLine)) ? '' : firstLine.split(/[.!?:]|,\s/)[0];
    }
    let title = head.split(PIC).map((x) => x.trim()).filter(Boolean)[0] || '';
    title = title.replace(/\s+/g, ' ').replace(/[\s:–-]+$/, '').trim().slice(0, 60);
    return { title: cap(title), ingredients: ings, steps };
  }

  /* ---------- Partage ---------- */
  function shareText(r) {
    const folder = r.folder === 'sucre' ? 'Recette sucrée' : 'Recette salée';
    const stars = r.rating ? ' · ' + '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating) : '';
    const parts = [`${r.emoji || '🍽️'} ${r.title}`, `${folder}${stars}`, ''];
    if (r.ingredients.length) {
      parts.push('Ingrédients :');
      r.ingredients.forEach((i) => parts.push('- ' + ingredientLabel(i)));
      parts.push('');
    }
    if (r.steps && r.steps.trim()) parts.push('Préparation :', r.steps.trim(), '');
    if (r.source) parts.push('Source : ' + r.source, '');
    parts.push('Envoyé depuis Courstine');
    return parts.join('\n');
  }

  const UNITS = ['', 'g', 'kg', 'ml', 'cl', 'dl', 'l', 'c. à soupe', 'c. à café', 'sachet', 'pincée',
    'gousse', 'tranche', 'boîte', 'pot', 'verre', 'botte', 'bouquet', 'paquet', 'brique', 'feuille', 'branche'];

  const api = {
    strip, cap, parseLine, parseIngredients, qtyText, fmtNum, ingredientLabel,
    ingredientEditLine, nameKey, toBase, itemId, aggregate, occKey, shoppingList, extractRecipe, shareText,
    iso, addDays, mondayOf, weekDays, SLOTS, CATEGORY_ORDER, UNITS,
  };
  root.Courstine = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
