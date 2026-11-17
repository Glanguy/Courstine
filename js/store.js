/* Courstine – stockage local (localStorage) + recettes d'exemple.
   Aucune donnée ne quitte l'appareil. */
(function (root) {
  'use strict';
  const L = root.Courstine;
  const KEY = 'courstine.v1'; // même clé : les anciennes données sont reprises et converties

  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

  const ing = (text) => L.parseIngredients(text);

  function sampleRecipes() {
    return [
      {
        id: 'r-crepes', title: 'Crêpes', emoji: '🥞', folder: 'sucre', rating: 0, fav: false, source: '',
        ingredients: ing('250 g farine\n3 œufs\n50 cl lait\n100 g beurre\n30 g sucre\n1 pincée de sel'),
        steps: 'Mélanger la farine, le sucre et le sel. Ajouter les œufs, puis le lait peu à peu en fouettant.\nIncorporer le beurre fondu. Laisser reposer 30 minutes.\nCuire à la poêle chaude, 1 à 2 minutes de chaque côté.',
      },
      {
        id: 'r-gateau', title: 'Gâteau au chocolat', emoji: '🍫', folder: 'sucre', rating: 0, fav: false, source: '',
        ingredients: ing('200 g chocolat noir\n125 g beurre\n100 g sucre\n3 œufs\n50 g farine'),
        steps: 'Faire fondre le chocolat avec le beurre. Ajouter le sucre, les œufs un à un, puis la farine.\nVerser dans un moule beurré et cuire 25 minutes à 180 °C.',
      },
      {
        id: 'r-tarte', title: 'Tarte aux pommes', emoji: '🍎', folder: 'sucre', rating: 0, fav: false, source: '',
        ingredients: ing('1 pâte brisée\n5 pommes\n60 g sucre\n30 g beurre'),
        steps: 'Étaler la pâte dans un moule. Disposer les pommes en lamelles, parsemer de sucre et de noisettes de beurre.\nCuire 35 minutes à 180 °C.',
      },
      {
        id: 'r-carbonara', title: 'Pâtes carbonara', emoji: '🍝', folder: 'sale', rating: 0, fav: false, source: '',
        ingredients: ing('400 g pâtes\n200 g lardons\n3 œufs\n80 g parmesan\npoivre'),
        steps: 'Cuire les pâtes. Faire dorer les lardons.\nMélanger les œufs et le parmesan, verser sur les pâtes égouttées hors du feu avec les lardons. Poivrer.',
      },
      {
        id: 'r-poulet', title: 'Poulet rôti et pommes de terre', emoji: '🍗', folder: 'sale', rating: 0, fav: false, source: '',
        ingredients: ing('1 poulet\n1 kg pommes de terre\n4 gousses d\'ail\n2 c. à soupe huile d\'olive\nthym'),
        steps: 'Placer le poulet et les pommes de terre en morceaux dans un plat. Ajouter l\'ail, l\'huile et le thym.\nEnfourner 1 h 15 à 200 °C en arrosant de temps en temps.',
      },
      {
        id: 'r-salade', title: 'Salade tomates mozzarella', emoji: '🥗', folder: 'sale', rating: 0, fav: false, source: '',
        ingredients: ing('4 tomates\n250 g mozzarella\n1 botte basilic\n2 c. à soupe huile d\'olive\nsel'),
        steps: 'Couper les tomates et la mozzarella en tranches. Alterner dans un plat, ajouter le basilic, l\'huile et le sel.',
      },
    ];
  }

  // Quelques repas d'exemple sur 3 jours de la semaine en cours (effaçables en un clic).
  function samplePlan() {
    const days = L.weekDays(0);
    const start = Math.min((new Date().getDay() + 6) % 7, 4);
    const d = (i) => L.iso(days[start + i]);
    return {
      [d(0)]: { midi: 'r-carbonara', soir: 'r-crepes' },
      [d(1)]: { soir: 'r-gateau' },
      [d(2)]: { midi: 'r-poulet', soir: 'r-salade' },
    };
  }

  function fresh() {
    return { v: 2, recipes: sampleRecipes(), plan: samplePlan(), checked: {}, extras: [], cleared: {} };
  }

  const num = (x) => (typeof x === 'number' && isFinite(x) ? x : null);

  function normalize(s) {
    const out = { v: 2, recipes: [], plan: {}, checked: {}, extras: [], cleared: {} };
    (Array.isArray(s.recipes) ? s.recipes : []).forEach((r) => {
      if (!r || typeof r.title !== 'string') return;
      out.recipes.push({
        id: String(r.id || uid()),
        title: r.title.slice(0, 120),
        emoji: typeof r.emoji === 'string' && r.emoji ? r.emoji.slice(0, 4) : '🍽️',
        folder: r.folder === 'sucre' ? 'sucre' : 'sale',
        rating: Math.max(0, Math.min(5, parseInt(r.rating, 10) || 0)),
        fav: !!r.fav,
        source: typeof r.source === 'string' ? r.source : '',
        steps: typeof r.steps === 'string' ? r.steps : '',
        ingredients: (Array.isArray(r.ingredients) ? r.ingredients : [])
          .filter((i) => i && typeof i.name === 'string' && i.name.trim())
          .map((i) => ({
            qty: typeof i.qty === 'number' && isFinite(i.qty) ? i.qty : null,
            unit: typeof i.unit === 'string' ? i.unit : '',
            name: i.name,
          })),
      });
    });
    const ids = new Set(out.recipes.map((r) => r.id));
    if (s.plan && typeof s.plan === 'object') {
      Object.keys(s.plan).forEach((k) => {
        const day = s.plan[k] || {};
        const clean = {};
        L.SLOTS.forEach((slot) => { if (ids.has(day[slot])) clean[slot] = day[slot]; });
        if (Object.keys(clean).length) out.plan[k] = clean;
      });
    }
    // Articles cochés : id -> quantité au moment où on a coché (version 2)
    if (s.v === 2 && s.checked && typeof s.checked === 'object') {
      Object.keys(s.checked).forEach((k) => { const n = num(s.checked[k]); if (n != null) out.checked[k] = n; });
    }
    // Ajouts et corrections à la main. Version 1 : { text, done } -> converti
    (Array.isArray(s.extras) ? s.extras : []).forEach((x) => {
      if (!x) return;
      let e = null;
      if (typeof x.name === 'string' && x.name.trim()) {
        e = { id: String(x.id || uid()), name: x.name.slice(0, 80), qty: num(x.qty), unit: typeof x.unit === 'string' ? x.unit : '' };
      } else if (typeof x.text === 'string' && x.text.trim()) {
        const p = L.parseLine(x.text.slice(0, 80));
        if (p) e = { id: String(x.id || uid()), name: p.name, qty: p.qty, unit: p.unit };
        if (e && x.done) out.checked[L.itemId(e.name, e.qty, e.unit)] = e.qty == null ? 0 : L.toBase(e.qty, e.unit).qty;
      }
      if (e) out.extras.push(e);
    });
    if (s.cleared && typeof s.cleared === 'object') {
      Object.keys(s.cleared).forEach((k) => { if (s.cleared[k]) out.cleared[k] = 1; });
    }
    return out;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return normalize(JSON.parse(raw));
    } catch (e) { /* stockage indisponible ou corrompu : on repart d'un état neuf */ }
    return fresh();
  }

  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  root.CourstineStore = { load, save, normalize, uid };
})(window);
