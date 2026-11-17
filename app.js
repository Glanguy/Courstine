/* Courstine – interface */
(function () {
  'use strict';
  const C = window.Courstine;
  const S = window.CourstineStore;
  const state = S.load();
  const ui = { route: 'home', weekOffset: 0, q: '', filter: 'all', sort: 'name', menuId: null, open: { sale: true, sucre: true } };

  /* ---------- Utilitaires ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const save = () => S.save(state);
  const recipe = (id) => state.recipes.find((r) => r.id === id);
  const FOLDER = { sale: 'Recettes salées', sucre: 'Recettes sucrées' };
  const fmtWeekday = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' });
  const fmtShort = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
  const fmtDay = new Intl.DateTimeFormat('fr-FR', { day: 'numeric' });
  const fmtMonth = new Intl.DateTimeFormat('fr-FR', { month: 'long' });
  const fmtMonthShort = new Intl.DateTimeFormat('fr-FR', { month: 'short' });
  const sameDay = (a, b) => C.iso(a) === C.iso(b);

  function weekLabel(days) {
    const a = days[0], b = days[6];
    const d1 = a.getDate() === 1 ? '1er' : fmtDay.format(a);
    if (a.getMonth() === b.getMonth()) return `Du ${d1} au ${fmtDay.format(b)} ${fmtMonth.format(b)}`;
    return `Du ${d1} ${fmtMonthShort.format(a)} au ${fmtDay.format(b)} ${fmtMonthShort.format(b)}`;
  }

  function planGet(iso, slot) { return (state.plan[iso] || {})[slot] || null; }
  function planSet(iso, slot, rid) {
    const day = state.plan[iso] || (state.plan[iso] = {});
    if (rid) day[slot] = rid; else delete day[slot];
    if (!Object.keys(day).length) delete state.plan[iso];
  }

  /* ---------- Icônes ---------- */
  const svg = (inner, extra = '') => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${inner}</svg>`;
  const I = {
    chev: svg('<path d="M9 5l7 7-7 7"/>'),
    left: svg('<path d="M15 5l-7 7 7 7"/>'),
    right: svg('<path d="M9 5l7 7-7 7"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 'stroke-width="3"'),
    dots: svg('<circle cx="12" cy="5" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="19" r="1.6" fill="currentColor"/>'),
    star: svg('<polygon points="12 2.8 14.9 8.7 21.4 9.6 16.7 14.2 17.8 20.7 12 17.6 6.2 20.7 7.3 14.2 2.6 9.6 9.1 8.7"/>'),
    heart: svg('<path d="M12 20.5s-8-4.9-8-11A4.5 4.5 0 0 1 12 6.8 4.5 4.5 0 0 1 20 9.5c0 6.1-8 11-8 11z"/>'),
    trash: svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
    folder: svg('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
    share: svg('<path d="M12 15V3M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>'),
    edit: svg('<path d="M4 20l4-1 11-11-3-3L5 16zM14 6l3 3"/>'),
    sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>'),
    moon: svg('<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>'),
  };

  /* ---------- Créneaux ---------- */
  function slotHTML(iso, slot, opt) {
    const o = opt || {};
    const rid = planGet(iso, slot);
    const r = rid && recipe(rid);
    const label = slot === 'midi' ? 'Midi' : 'Soir';
    const aria = r ? `${label} : ${r.title}. Modifier` : `${label} : vide. Choisir une recette`;
    return `<div class="slot${r ? ' filled' : ''}" role="button" tabindex="0" data-action="pick-slot" data-iso="${iso}" data-slot="${slot}"
        ${r && o.drag ? `data-drag data-rid="${esc(r.id)}"` : ''} aria-label="${esc(aria)}">
      <span class="slot-name">${slot === 'midi' ? I.sun : I.moon}${label}</span>
      <span class="plate">${r ? esc(r.emoji) : I.plus}</span>
      <span class="slot-title">${r ? esc(r.title) : 'Choisir'}</span>
      ${r && o.clear ? `<button type="button" class="slot-x" data-action="clear-slot" data-iso="${iso}" data-slot="${slot}" aria-label="Retirer ${esc(r.title)} du menu">${I.close}</button>` : ''}
    </div>`;
  }

  /* ---------- Liste de courses ---------- */
  function currentItems(days) {
    const weekKey = C.iso(days[0]);
    const items = C.shoppingForWeek(state, days).map((it) => ({ ...it, k: weekKey + '|' + it.id, done: !!state.checked[weekKey + '|' + it.id] }));
    return items;
  }

  function itemHTML(it) {
    return `<li class="item${it.done ? ' done' : ''}">
      <button type="button" class="check" data-action="toggle-item" data-k="${esc(it.k)}" aria-pressed="${it.done}" aria-label="${esc(it.name)}">${I.check}</button>
      <div class="item-main"><span class="item-name">${esc(it.name)}</span>${it.from && it.from.length ? `<span class="item-from">${esc(it.from.join(', '))}</span>` : ''}</div>
      <span class="item-qty">${esc(it.text)}</span>
    </li>`;
  }

  /* ---------- Vues ---------- */
  function viewHome() {
    const today = new Date();
    const days = Array.from({ length: 5 }, (_, i) => C.addDays(today, i));
    const items = currentItems(C.weekDays(0));
    const shown = items.slice(0, 6);
    const names = ["Aujourd'hui", 'Demain'];
    return `<div class="stack">
      <a class="banner banner-green" href="#/menus"><span>Repas de la semaine</span>${I.chev}</a>
      <div class="carousel" id="carousel" aria-label="Repas des prochains jours">
        ${days.map((d, i) => {
          const iso = C.iso(d);
          return `<section class="card">
            <h2 class="day-head">${names[i] ? names[i] : cap(fmtWeekday.format(d))} <small>${fmtShort.format(d)}</small></h2>
            <div class="slots">${slotHTML(iso, 'midi')}${slotHTML(iso, 'soir')}</div>
          </section>`;
        }).join('')}
      </div>
      <a class="banner banner-orange" href="#/courses"><span>Liste de courses</span>${I.chev}</a>
      <section class="card">
        ${shown.length ? `<ul class="items">${shown.map(itemHTML).join('')}</ul>
          ${items.length > shown.length ? `<p class="more">+ ${items.length - shown.length} autre${items.length - shown.length > 1 ? 's' : ''} article${items.length - shown.length > 1 ? 's' : ''}</p>` : ''}`
          : `<p class="more" style="margin:0">Ta liste se remplit toute seule : planifie des repas dans Menus.</p>`}
      </section>
      <p class="credit">Merci à Justine la queen<br>pour cette super idée d’appli
        <small><button type="button" data-action="backup">Sauvegarder ou restaurer mes données</button></small></p>
    </div>`;
  }

  function weekBar(days) {
    return `<div class="weekbar">
      <button type="button" class="round" data-action="week-prev" aria-label="Semaine précédente">${I.left}</button>
      <div class="mid">${esc(weekLabel(days))}${ui.weekOffset ? `<button type="button" data-action="week-today">Revenir à cette semaine</button>` : ''}</div>
      <button type="button" class="round" data-action="week-next" aria-label="Semaine suivante">${I.right}</button>
    </div>`;
  }

  function viewMenus() {
    const days = C.weekDays(ui.weekOffset);
    const today = new Date();
    const hasPlan = days.some((d) => state.plan[C.iso(d)]);
    const sorted = [...state.recipes].sort((a, b) => a.title.localeCompare(b.title, 'fr'));
    return `${weekBar(days)}
      <div class="days">
        ${days.map((d) => {
          const iso = C.iso(d);
          const isToday = sameDay(d, today);
          return `<section class="card day${isToday ? ' is-today' : ''}">
            <h2 class="day-head">${cap(fmtWeekday.format(d))} <small>${fmtShort.format(d)}</small>${isToday ? '<span class="today">Aujourd’hui</span>' : ''}</h2>
            <div class="slots">${slotHTML(iso, 'midi', { drag: true, clear: true })}${slotHTML(iso, 'soir', { drag: true, clear: true })}</div>
          </section>`;
        }).join('')}
      </div>
      ${hasPlan ? `<button type="button" class="btn-text" data-action="clear-week">Vider la semaine</button>` : ''}
      <div class="tray" role="region" aria-label="Mes recettes">
        <div class="tray-in">
          ${sorted.length ? `<p class="tray-title">Maintiens une recette, puis glisse-la sur un repas</p>
          <div class="tray-strip" id="tray">${sorted.map((r) => `<div class="rchip ${r.folder}" role="button" tabindex="0" data-drag data-rid="${esc(r.id)}" data-action="assign-open" data-id="${esc(r.id)}"><span class="emo">${esc(r.emoji)}</span>${esc(r.title)}</div>`).join('')}</div>`
          : `<p class="tray-title" style="margin:0">Pas encore de recette. <a href="#/recettes">Ajoute-en une</a> pour remplir ton menu.</p>`}
        </div>
      </div>`;
  }

  function viewCourses() {
    const days = C.weekDays(ui.weekOffset);
    const items = currentItems(days);
    const extras = state.extras;
    const total = items.length + extras.length;
    const done = items.filter((i) => i.done).length + extras.filter((e) => e.done).length;
    const groups = [];
    items.forEach((it) => {
      let g = groups.find((x) => x.cat === it.cat);
      if (!g) groups.push((g = { cat: it.cat, list: [] }));
      g.list.push(it);
    });
    return `${weekBar(days)}
      ${total ? `<div class="progress"><span>${done} sur ${total} dans le panier</span>${done ? `<button type="button" data-action="uncheck-all">Tout décocher</button>` : ''}</div>
        <div class="bar" aria-hidden="true"><i style="width:${total ? Math.round((done / total) * 100) : 0}%"></i></div>` : ''}
      ${!items.length ? `<section class="card empty">
          <div class="plate">${I.plus}</div>
          <p><strong>Aucun repas prévu cette semaine.</strong><br>Planifie des recettes dans Menus : leurs ingrédients s’additionnent ici.</p>
          <a class="btn-primary" style="display:inline-block;text-decoration:none" href="#/menus">Planifier les repas</a>
        </section>` : groups.map((g) => `<section class="card group" style="margin-bottom:14px"><h3>${esc(g.cat)}</h3><ul class="items">${g.list.map(itemHTML).join('')}</ul></section>`).join('')}
      ${extras.length ? `<section class="card group"><h3>Ajouts</h3><ul class="items">${extras.map((e) => `<li class="item${e.done ? ' done' : ''}">
          <button type="button" class="check" data-action="toggle-extra" data-id="${esc(e.id)}" aria-pressed="${e.done}" aria-label="${esc(e.text)}">${I.check}</button>
          <div class="item-main"><span class="item-name">${esc(e.text)}</span></div>
          <button type="button" class="x" data-action="del-extra" data-id="${esc(e.id)}" aria-label="Supprimer ${esc(e.text)}">${I.close}</button></li>`).join('')}</ul></section>` : ''}
      <form class="addline" id="extra-form" autocomplete="off">
        <label class="sr" for="extra-input">Ajouter un article</label>
        <input id="extra-input" type="text" maxlength="80" placeholder="Ajouter un article (ex. papier toilette)">
        <button class="btn-primary" type="submit">Ajouter</button>
      </form>`;
  }

  function recipeCard(r) {
    const n = r.ingredients.length;
    return `<article class="card rcard">
      <button type="button" class="dots" data-action="menu" data-id="${esc(r.id)}" aria-label="Options pour ${esc(r.title)}" aria-haspopup="menu" aria-expanded="${ui.menuId === r.id}">${I.dots}</button>
      ${ui.menuId === r.id ? `<div class="popover" role="menu">
        <button type="button" role="menuitem" class="danger" data-action="del-recipe" data-id="${esc(r.id)}">${I.trash}Supprimer la recette</button>
        <button type="button" role="menuitem" data-action="move-recipe" data-id="${esc(r.id)}">${I.folder}Changer de dossier</button>
        <button type="button" role="menuitem" data-action="share-recipe" data-id="${esc(r.id)}">${I.share}Partager</button>
      </div>` : ''}
      <button type="button" class="rmain" data-action="open-recipe" data-id="${esc(r.id)}">
        <span class="plate sm">${esc(r.emoji)}</span>
        <span><span class="rtitle">${esc(r.title)}</span><span class="rmeta">${n} ingrédient${n > 1 ? 's' : ''}</span></span>
      </button>
      <div class="rfoot">
        ${starsHTML(r)}
        <button type="button" class="heart" data-action="fav" data-id="${esc(r.id)}" aria-pressed="${r.fav}" aria-label="Favori : ${esc(r.title)}">${r.fav ? I.heart.replace('fill="none"', 'fill="currentColor"') : I.heart}</button>
      </div>
    </article>`;
  }

  function starsHTML(r) {
    let out = '';
    for (let n = 1; n <= 5; n++) {
      out += `<button type="button" class="${n <= r.rating ? 'on' : ''}" data-action="rate" data-id="${esc(r.id)}" data-n="${n}" aria-label="Noter ${n} sur 5" aria-pressed="${n === r.rating}">${I.star}</button>`;
    }
    return `<div class="stars" role="group" aria-label="Note de ${esc(r.title)}">${out}</div>`;
  }

  function viewRecettes() {
    const q = C.strip(ui.q);
    let list = state.recipes.filter((r) => (!q || C.strip(r.title).includes(q)) && (ui.filter !== 'fav' || r.fav));
    list = list.sort((a, b) => (ui.sort === 'rating' ? b.rating - a.rating || a.title.localeCompare(b.title, 'fr') : a.title.localeCompare(b.title, 'fr')));
    const section = (key) => {
      const rs = list.filter((r) => r.folder === key);
      const open = ui.open[key];
      return `<h2 style="margin:0"><button type="button" class="sec-head ${key}" data-action="toggle-section" data-f="${key}" aria-expanded="${open}"><span>${FOLDER[key]} (${rs.length})</span>${I.chev}</button></h2>
        ${open ? `<div class="cards">${rs.length ? rs.map(recipeCard).join('') : `<p class="more">${state.recipes.some((r) => r.folder === key) ? 'Aucune recette ne correspond.' : 'Aucune recette ici pour l’instant.'}</p>`}</div>` : ''}`;
    };
    return `<label class="sr" for="q">Rechercher une recette</label>
      <input class="search" id="q" type="search" placeholder="Rechercher une recette" value="${esc(ui.q)}" autocomplete="off">
      <div class="filters">
        <button type="button" class="fchip" data-action="filter-fav" aria-pressed="${ui.filter === 'fav'}">${I.heart}Favoris</button>
        <button type="button" class="fchip" data-action="sort-rating" aria-pressed="${ui.sort === 'rating'}">${I.star}Mieux notées d’abord</button>
      </div>
      ${section('sale')}${section('sucre')}
      <button type="button" class="fab" data-action="new-recipe" aria-label="Nouvelle recette">${I.plus}</button>`;
  }

  const VIEWS = { home: viewHome, menus: viewMenus, courses: viewCourses, recettes: viewRecettes };
  const cap = C.cap;

  /* ---------- Rendu ---------- */
  let lastRoute = null;
  function render() {
    const y = window.scrollY;
    const act = document.activeElement;
    const aid = act && act.id && $('#view').contains(act) ? act.id : null;
    const keep = {};
    $$('#carousel, #tray').forEach((el) => { keep[el.id] = el.scrollLeft; });
    $('#view').innerHTML = VIEWS[ui.route]();
    $$('#carousel, #tray').forEach((el) => { if (keep[el.id] != null) el.scrollLeft = keep[el.id]; });
    const tabs = $('#tabs');
    tabs.classList.toggle('dim', ui.route !== 'home');
    $$('.pill', tabs).forEach((p) => {
      const on = p.dataset.tab === ui.route;
      p.classList.toggle('on', on);
      if (on) p.setAttribute('aria-current', 'page'); else p.removeAttribute('aria-current');
    });
    document.body.classList.toggle('has-tray', ui.route === 'menus');
    document.body.classList.toggle('has-fab', ui.route === 'recettes');
    document.title = ui.route === 'home' ? 'Courstine' : { menus: 'Menus', courses: 'Courses', recettes: 'Recettes' }[ui.route] + ' · Courstine';
    if (lastRoute === ui.route) window.scrollTo(0, y);
    lastRoute = ui.route;
    if (aid) {
      const el = document.getElementById(aid);
      if (el) { el.focus(); if (el.setSelectionRange && /text|search/.test(el.type || '')) { const n = el.value.length; try { el.setSelectionRange(n, n); } catch (e) { /* ignore */ } } }
    }
  }

  function route() {
    const h = (location.hash.replace(/^#\/?/, '') || 'home').split('?')[0];
    const next = VIEWS[h] ? h : 'home';
    if (next !== ui.route || lastRoute === null) {
      ui.route = next;
      ui.menuId = null;
      if (next === 'home') ui.weekOffset = 0;
      lastRoute = null;
      closeSheet();
      render();
      window.scrollTo(0, 0);
    }
  }

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  /* ---------- Feuilles ---------- */
  let sheet = null;
  let sheetState = {};
  function openSheet(renderFn, label) {
    sheet = { renderFn, label };
    paintSheet(true);
  }
  function paintSheet(first) {
    if (!sheet) return;
    const root = $('#sheet-root');
    root.className = first ? '' : 'no-anim';
    root.innerHTML = `<div class="backdrop" data-action="close-sheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(sheet.label)}">${sheet.renderFn()}</div>`;
    if (first) {
      document.body.classList.add('noscroll');
      const f = $('.sheet input[type=text], .sheet input[type=search]');
      if (f && !/Mobi|Android|iPhone|iPad/.test(navigator.userAgent)) f.focus();
    }
  }
  function closeSheet() {
    sheet = null;
    sheetState = {};
    $('#sheet-root').innerHTML = '';
    document.body.classList.remove('noscroll');
  }

  /* Choix d'une recette pour un repas */
  function openPicker(iso, slot) {
    const d = C.weekDays(0).concat(C.weekDays(ui.weekOffset), C.weekDays(1)).find((x) => C.iso(x) === iso) || new Date(iso + 'T12:00:00');
    sheetState = { iso, slot, q: '', folder: 'all', title: `${cap(fmtWeekday.format(d))} ${slot} · ${fmtShort.format(d)}` };
    openSheet(() => {
      const cur = planGet(iso, slot);
      return `<h2>${esc(sheetState.title)}</h2>
        <label class="sr" for="picker-q">Rechercher une recette</label>
        <input class="search" id="picker-q" type="search" placeholder="Rechercher une recette" autocomplete="off">
        <div class="filters">
          ${[['all', 'Toutes'], ['sale', 'Salées'], ['sucre', 'Sucrées']].map(([f, l]) => `<button type="button" class="fchip" data-action="picker-folder" data-f="${f}" aria-pressed="${sheetState.folder === f}">${l}</button>`).join('')}
        </div>
        <div id="picker-list">${pickerList()}</div>
        <div class="sheet-actions">
          ${cur ? `<button type="button" class="btn-ghost" data-action="clear-slot" data-iso="${iso}" data-slot="${slot}">Retirer ce repas</button>` : ''}
          <button type="button" class="btn-ghost" data-action="close-sheet">Fermer</button>
        </div>`;
    }, sheetState.title);
  }
  function pickerList() {
    const q = C.strip(sheetState.q || '');
    const f = sheetState.folder;
    const cur = planGet(sheetState.iso, sheetState.slot);
    const rs = state.recipes
      .filter((r) => (f === 'all' || r.folder === f) && (!q || C.strip(r.title).includes(q)))
      .sort((a, b) => b.rating - a.rating || a.title.localeCompare(b.title, 'fr'));
    if (!rs.length) return `<p class="sub" style="margin-top:12px">Aucune recette trouvée.</p>`;
    return rs.map((r) => `<button type="button" class="list-btn${cur === r.id ? ' current' : ''}" data-action="pick" data-rid="${esc(r.id)}">
      <span class="plate sm">${esc(r.emoji)}</span><span>${esc(r.title)}<small>${FOLDER[r.folder]}</small></span>
      ${r.rating ? `<span class="stars-s" aria-label="${r.rating} sur 5">${'★'.repeat(r.rating)}</span>` : ''}</button>`).join('');
  }

  /* Ajouter une recette au menu (alternative au glisser-déposer) */
  function openAssign(rid) {
    const r = recipe(rid);
    if (!r) return;
    openSheet(() => {
      const days = C.weekDays(ui.weekOffset);
      return `<h2>Ajouter « ${esc(r.title)} » au menu</h2>
        <p class="sub">${esc(weekLabel(days))}</p>
        ${days.map((d) => {
          const iso = C.iso(d);
          const cell = (slot) => {
            const cur = planGet(iso, slot) && recipe(planGet(iso, slot));
            return `<button type="button" class="${cur ? 'taken' : ''}" data-action="assign" data-rid="${esc(rid)}" data-iso="${iso}" data-slot="${slot}" aria-label="${slot} ${cap(fmtWeekday.format(d))}${cur ? ', remplace ' + esc(cur.title) : ''}">${slot === 'midi' ? I.sun : I.moon}${cur ? esc(cur.emoji) : slot === 'midi' ? 'Midi' : 'Soir'}</button>`;
          };
          return `<div class="assign-row"><div class="d">${cap(fmtWeekday.format(d))}<small>${fmtShort.format(d)}</small></div>${cell('midi')}${cell('soir')}</div>`;
        }).join('')}
        <div class="sheet-actions"><button type="button" class="btn-ghost" data-action="close-sheet">Fermer</button></div>`;
    }, 'Ajouter au menu');
  }

  /* Fiche recette */
  function openRecipe(id) {
    if (!recipe(id)) return;
    openSheet(() => {
      const r = recipe(id);
      if (!r) return '';
      const src = /^https?:\/\//i.test(r.source) ? r.source : '';
      return `<div class="sheet-top"><span class="plate">${esc(r.emoji)}</span>
          <div style="flex:1"><span class="tag ${r.folder}">${r.folder === 'sale' ? 'Salée' : 'Sucrée'}</span><h2>${esc(r.title)}</h2></div></div>
        <div class="rfoot" style="margin:0 0 4px">${starsHTML(r)}
          <button type="button" class="heart" data-action="fav" data-id="${esc(r.id)}" aria-pressed="${r.fav}" aria-label="Favori">${r.fav ? I.heart.replace('fill="none"', 'fill="currentColor"') : I.heart}</button></div>
        <h3>Ingrédients</h3>
        ${r.ingredients.length ? `<ul class="ing">${r.ingredients.map((i) => `<li>${esc(C.ingredientLabel(i))}</li>`).join('')}</ul>` : '<p class="sub">Aucun ingrédient renseigné.</p>'}
        ${r.steps.trim() ? `<h3>Préparation</h3><p class="steps">${esc(r.steps.trim())}</p>` : ''}
        ${src ? `<h3>Source</h3><p style="margin:0;word-break:break-all"><a href="${esc(src)}" target="_blank" rel="noopener noreferrer">${esc(src)}</a></p>` : ''}
        <div class="sheet-actions">
          <button type="button" class="btn-primary" data-action="assign-open" data-id="${esc(r.id)}">Ajouter au menu</button>
          <button type="button" class="btn-ghost" data-action="edit-recipe" data-id="${esc(r.id)}">Modifier</button>
          <button type="button" class="btn-ghost" data-action="share-recipe" data-id="${esc(r.id)}">Partager</button>
        </div>`;
    }, 'Fiche recette');
  }

  /* Formulaire de recette */
  const EMOJIS = ['🍽️', '🍝', '🍗', '🥗', '🍲', '🥘', '🍕', '🌮', '🍳', '🥞', '🍰', '🍎', '🍫', '🍪', '🍓', '🧁'];
  function openForm(id) {
    const r = id ? recipe(id) : null;
    sheetState = { id: id || '', emoji: r ? r.emoji : EMOJIS[0] };
    openSheet(() => `<form id="recipe-form" novalidate>
        <h2>${r ? 'Modifier la recette' : 'Nouvelle recette'}</h2>
        <label for="f-title">Nom</label>
        <input id="f-title" type="text" maxlength="80" value="${esc(r ? r.title : '')}" placeholder="Ex. Crêpes">
        <p class="hint" id="f-err" role="alert" style="color:#B3201B"></p>
        <fieldset><legend>Dossier</legend>
          <div class="seg">
            <label><input type="radio" name="f-folder" value="sale" ${!r || r.folder === 'sale' ? 'checked' : ''}><span>Salée</span></label>
            <label><input type="radio" name="f-folder" value="sucre" ${r && r.folder === 'sucre' ? 'checked' : ''}><span>Sucrée</span></label>
          </div></fieldset>
        <fieldset><legend>Icône</legend>
          <div class="emojis" id="f-emojis">${EMOJIS.map((e) => `<button type="button" data-action="pick-emoji" data-e="${e}" aria-pressed="${e === sheetState.emoji}" aria-label="Icône ${e}">${e}</button>`).join('')}</div></fieldset>
        <label for="f-ings">Ingrédients (un par ligne)</label>
        <textarea id="f-ings" rows="6" placeholder="100 g beurre&#10;3 œufs&#10;2 c. à soupe de sucre">${esc(r ? r.ingredients.map(C.ingredientEditLine).join('\n') : '')}</textarea>
        <p class="hint">Écris la quantité d’abord : l’appli additionne les totaux toute seule.</p>
        <div class="chips" id="ing-preview" aria-live="polite"></div>
        <label for="f-steps">Préparation</label>
        <textarea id="f-steps" rows="5">${esc(r ? r.steps : '')}</textarea>
        <label for="f-source">Lien (facultatif)</label>
        <input id="f-source" type="url" inputmode="url" placeholder="https://" value="${esc(r ? r.source : '')}">
        <div class="sheet-actions">
          <button type="button" class="btn-ghost" data-action="close-sheet">Annuler</button>
          <button type="submit" class="btn-primary">Enregistrer</button>
        </div>
      </form>`, r ? 'Modifier la recette' : 'Nouvelle recette');
    updatePreview();
  }
  function updatePreview() {
    const ta = $('#f-ings');
    const box = $('#ing-preview');
    if (!ta || !box) return;
    box.innerHTML = C.parseIngredients(ta.value).map((i) => `<span><b>${esc(C.qtyText(i.qty, i.unit) || '·')}</b> ${esc(i.name)}</span>`).join('');
  }
  function saveForm() {
    const title = $('#f-title').value.trim();
    if (!title) {
      $('#f-err').textContent = 'Donne un nom à ta recette.';
      $('#f-title').focus();
      return;
    }
    const data = {
      title,
      folder: ($('input[name=f-folder]:checked') || {}).value === 'sucre' ? 'sucre' : 'sale',
      emoji: sheetState.emoji || '🍽️',
      ingredients: C.parseIngredients($('#f-ings').value),
      steps: $('#f-steps').value.trim(),
      source: $('#f-source').value.trim(),
    };
    if (sheetState.id) {
      Object.assign(recipe(sheetState.id), data);
      toast('Recette modifiée');
    } else {
      state.recipes.push({ id: S.uid(), rating: 0, fav: false, ...data });
      toast('Recette enregistrée');
    }
    save();
    closeSheet();
    render();
  }

  /* Dossier, suppression, partage, sauvegarde */
  function openMove(id) {
    const r = recipe(id);
    if (!r) return;
    openSheet(() => `<h2>Changer de dossier</h2><p class="sub">${esc(r.title)}</p>
      ${['sale', 'sucre'].map((f) => `<button type="button" class="list-btn${r.folder === f ? ' current' : ''}" data-action="move-to" data-id="${esc(r.id)}" data-f="${f}">${I.folder}<span>${FOLDER[f]}${r.folder === f ? '<small>Dossier actuel</small>' : ''}</span></button>`).join('')}
      <div class="sheet-actions"><button type="button" class="btn-ghost" data-action="close-sheet">Annuler</button></div>`, 'Changer de dossier');
  }
  function openDelete(id) {
    const r = recipe(id);
    if (!r) return;
    openSheet(() => `<h2>Supprimer cette recette ?</h2>
      <p class="sub">« ${esc(r.title)} » sera supprimée, ainsi que ses repas prévus au menu. Cette action est définitive.</p>
      <div class="sheet-actions"><button type="button" class="btn-ghost" data-action="close-sheet">Garder</button>
      <button type="button" class="btn-danger" data-action="confirm-delete" data-id="${esc(r.id)}">Supprimer la recette</button></div>`, 'Supprimer la recette');
  }
  async function shareRecipe(id) {
    const r = recipe(id);
    if (!r) return;
    const text = C.shareText(r);
    if (navigator.share) {
      try { await navigator.share({ title: r.title, text }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    openSheet(() => `<h2>Partager « ${esc(r.title)} »</h2>
      <p class="sub">La recette est envoyée en texte : ingrédients, préparation et lien.</p>
      <a class="list-btn" href="sms:?&body=${encodeURIComponent(text)}">${I.share}<span>Message (SMS)</span></a>
      <a class="list-btn" href="https://wa.me/?text=${encodeURIComponent(text)}" target="_blank" rel="noopener noreferrer">${I.share}<span>WhatsApp</span></a>
      <button type="button" class="list-btn" data-action="copy-share" data-id="${esc(r.id)}">${I.share}<span>Copier le texte</span></button>
      <div class="sheet-actions"><button type="button" class="btn-ghost" data-action="close-sheet">Fermer</button></div>`, 'Partager');
  }
  function openBackup() {
    openSheet(() => `<h2>Mes données</h2>
      <p class="sub">Tout est gardé sur cet appareil, dans ce navigateur. Fais une sauvegarde pour changer de téléphone ou ne rien perdre.</p>
      <div class="sheet-actions"><button type="button" class="btn-primary" data-action="export">Télécharger une sauvegarde</button></div>
      <label for="import-file">Restaurer une sauvegarde</label>
      <input id="import-file" type="file" accept="application/json,.json">
      <p class="hint">Les recettes et menus actuels seront remplacés.</p>
      <div class="sheet-actions"><button type="button" class="btn-ghost" data-action="close-sheet">Fermer</button></div>`, 'Mes données');
  }

  /* ---------- Actions ---------- */
  const A = {
    'close-sheet': () => closeSheet(),
    'week-prev': () => { ui.weekOffset--; render(); },
    'week-next': () => { ui.weekOffset++; render(); },
    'week-today': () => { ui.weekOffset = 0; render(); },
    'pick-slot': (el) => openPicker(el.dataset.iso, el.dataset.slot),
    'pick': (el) => {
      planSet(sheetState.iso, sheetState.slot, el.dataset.rid);
      save(); closeSheet(); render();
      toast('Repas modifié');
    },
    'clear-slot': (el) => { planSet(el.dataset.iso, el.dataset.slot, null); save(); closeSheet(); render(); },
    'clear-week': () => {
      C.weekDays(ui.weekOffset).forEach((d) => delete state.plan[C.iso(d)]);
      save(); render(); toast('Semaine vidée');
    },
    'picker-folder': (el) => { sheetState.folder = el.dataset.f; paintSheet(false); },
    'toggle-item': (el) => { const k = el.dataset.k; if (state.checked[k]) delete state.checked[k]; else state.checked[k] = true; save(); render(); },
    'uncheck-all': () => {
      const wk = C.iso(C.weekDays(ui.weekOffset)[0]);
      Object.keys(state.checked).forEach((k) => { if (k.startsWith(wk + '|')) delete state.checked[k]; });
      state.extras.forEach((e) => { e.done = false; });
      save(); render();
    },
    'toggle-extra': (el) => { const e = state.extras.find((x) => x.id === el.dataset.id); if (e) { e.done = !e.done; save(); render(); } },
    'del-extra': (el) => { state.extras = state.extras.filter((x) => x.id !== el.dataset.id); save(); render(); },
    'menu': (el) => { ui.menuId = ui.menuId === el.dataset.id ? null : el.dataset.id; render(); },
    'open-recipe': (el) => openRecipe(el.dataset.id),
    'edit-recipe': (el) => openForm(el.dataset.id),
    'new-recipe': () => openForm(''),
    'pick-emoji': (el) => {
      sheetState.emoji = el.dataset.e;
      $$('#f-emojis button').forEach((b) => b.setAttribute('aria-pressed', String(b === el)));
    },
    'del-recipe': (el) => { ui.menuId = null; render(); openDelete(el.dataset.id); },
    'confirm-delete': (el) => {
      const id = el.dataset.id;
      state.recipes = state.recipes.filter((r) => r.id !== id);
      Object.keys(state.plan).forEach((k) => C.SLOTS.forEach((s) => { if (state.plan[k][s] === id) planSet(k, s, null); }));
      save(); closeSheet(); render(); toast('Recette supprimée');
    },
    'move-recipe': (el) => { ui.menuId = null; render(); openMove(el.dataset.id); },
    'move-to': (el) => {
      const r = recipe(el.dataset.id);
      if (r) { r.folder = el.dataset.f; save(); closeSheet(); render(); toast('Déplacée dans ' + FOLDER[r.folder].toLowerCase()); }
    },
    'share-recipe': (el) => { ui.menuId = null; if (sheet) closeSheet(); render(); shareRecipe(el.dataset.id); },
    'copy-share': async (el) => {
      const r = recipe(el.dataset.id);
      try { await navigator.clipboard.writeText(C.shareText(r)); toast('Recette copiée'); } catch (e) { toast('Copie impossible sur cet appareil'); }
    },
    'rate': (el) => {
      const r = recipe(el.dataset.id);
      const n = +el.dataset.n;
      if (!r) return;
      r.rating = r.rating === n ? 0 : n;
      save(); render(); if (sheet) paintSheet(false);
    },
    'fav': (el) => {
      const r = recipe(el.dataset.id);
      if (!r) return;
      r.fav = !r.fav;
      save(); render(); if (sheet) paintSheet(false);
    },
    'toggle-section': (el) => { ui.open[el.dataset.f] = !ui.open[el.dataset.f]; render(); },
    'filter-fav': () => { ui.filter = ui.filter === 'fav' ? 'all' : 'fav'; render(); },
    'sort-rating': () => { ui.sort = ui.sort === 'rating' ? 'name' : 'rating'; render(); },
    'assign-open': (el) => { if (sheet) closeSheet(); openAssign(el.dataset.id); },
    'assign': (el) => {
      planSet(el.dataset.iso, el.dataset.slot, el.dataset.rid);
      save(); closeSheet(); render();
      const d = new Date(el.dataset.iso + 'T12:00:00');
      toast(`Ajouté : ${fmtWeekday.format(d)} ${el.dataset.slot}`);
    },
    'backup': () => openBackup(),
    'export': () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'courstine-sauvegarde.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    },
  };

  let suppressClick = false;
  document.addEventListener('click', (e) => {
    if (suppressClick) { e.preventDefault(); e.stopPropagation(); return; }
    const el = e.target.closest('[data-action]');
    if (ui.menuId && !e.target.closest('.popover') && !(el && el.dataset.action === 'menu')) {
      ui.menuId = null;
      render();
    }
    if (!el) return;
    const fn = A[el.dataset.action];
    if (fn) { e.preventDefault(); fn(el, e); }
  }, true);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (sheet) closeSheet();
      else if (ui.menuId) { ui.menuId = null; render(); }
      return;
    }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role=button][data-action]')) {
      e.preventDefault();
      e.target.click();
    }
  });

  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'q') { ui.q = t.value; render(); }
    else if (t.id === 'picker-q') { sheetState.q = t.value; $('#picker-list').innerHTML = pickerList(); }
    else if (t.id === 'f-ings') updatePreview();
  });

  document.addEventListener('submit', (e) => {
    const f = e.target;
    if (f.id === 'extra-form') {
      e.preventDefault();
      const inp = $('#extra-input');
      const text = inp.value.trim();
      if (text) { state.extras.push({ id: S.uid(), text, done: false }); save(); render(); const n = $('#extra-input'); if (n) n.focus(); }
    } else if (f.id === 'recipe-form') {
      e.preventDefault();
      saveForm();
    }
  });

  document.addEventListener('change', (e) => {
    if (e.target.id !== 'import-file' || !e.target.files[0]) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || !Array.isArray(data.recipes)) throw new Error('format');
        const next = S.normalize(data);
        state.recipes = next.recipes; state.plan = next.plan; state.checked = next.checked; state.extras = next.extras;
        save(); closeSheet(); render(); toast('Sauvegarde restaurée');
      } catch (err) { toast('Fichier de sauvegarde non reconnu'); }
    };
    reader.readAsText(e.target.files[0]);
  });

  /* ---------- Glisser-déposer (menus) ----------
     Souris : on attrape et on glisse. Tactile : appui long (≈0,25 s) puis glisser. */
  let drag = null;
  let raf = 0;
  function startArm() {
    if (!drag || drag.armed) return;
    drag.armed = true;
    const r = recipe(drag.rid);
    const g = document.createElement('div');
    g.className = 'ghost';
    g.innerHTML = `<span style="font-size:20px">${esc(r ? r.emoji : '🍽️')}</span>${esc(r ? r.title : '')}`;
    document.body.appendChild(g);
    drag.ghost = g;
    drag.src.classList.add('drag-src');
    document.body.classList.add('dragging');
    if (navigator.vibrate) navigator.vibrate(15);
    moveGhost();
    raf = requestAnimationFrame(tick);
  }
  function moveGhost() {
    if (!drag || !drag.ghost) return;
    drag.ghost.style.transform = `translate(${drag.x + 14}px, ${drag.y - 24}px)`;
    const t = document.elementFromPoint(drag.x, drag.y);
    const slot = t && t.closest ? t.closest('.slot[data-iso]') : null;
    if (drag.hover !== slot) {
      if (drag.hover) drag.hover.classList.remove('drop-hover');
      if (slot) slot.classList.add('drop-hover');
      drag.hover = slot;
    }
  }
  function tick() {
    if (!drag || !drag.armed) return;
    // Défilement automatique près des bords, de plus en plus vite quand on s'approche du bord.
    // Le bas de la zone se situe juste au-dessus du bandeau de recettes (jamais dessus).
    const trayEl = $('.tray');
    const bottom = trayEl ? trayEl.getBoundingClientRect().top : window.innerHeight;
    if (drag.y < 130) window.scrollBy(0, -Math.min(16, Math.ceil((14 * (130 - drag.y)) / 70)));
    else if (drag.y > bottom - 70 && drag.y < bottom) window.scrollBy(0, Math.min(16, Math.ceil((14 * (drag.y - (bottom - 70))) / 70)));
    moveGhost();
    raf = requestAnimationFrame(tick);
  }
  function endDrag(drop) {
    if (!drag) return;
    clearTimeout(drag.timer);
    cancelAnimationFrame(raf);
    const d = drag;
    drag = null;
    if (d.ghost) d.ghost.remove();
    if (d.hover) d.hover.classList.remove('drop-hover');
    if (d.src) d.src.classList.remove('drag-src');
    document.body.classList.remove('dragging');
    if (!d.armed) return;
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 80);
    if (drop && d.hover) {
      const iso = d.hover.dataset.iso, slot = d.hover.dataset.slot;
      if (d.from) {
        if (!(d.from.iso === iso && d.from.slot === slot)) {
          const prev = planGet(iso, slot);
          planSet(iso, slot, d.rid);
          planSet(d.from.iso, d.from.slot, prev);
          save(); render();
          toast(prev ? 'Repas échangés' : 'Repas déplacé');
        }
      } else {
        planSet(iso, slot, d.rid);
        save(); render();
        toast('Repas ajouté');
      }
    }
  }
  document.addEventListener('pointerdown', (e) => {
    const src = e.target.closest('[data-drag]');
    if (!src || e.target.closest('[data-action="clear-slot"]')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    drag = {
      src, rid: src.dataset.rid, id: e.pointerId, type: e.pointerType,
      from: src.dataset.iso ? { iso: src.dataset.iso, slot: src.dataset.slot } : null,
      sx: e.clientX, sy: e.clientY, x: e.clientX, y: e.clientY, armed: false, hover: null, ghost: null,
    };
    if (e.pointerType !== 'mouse') drag.timer = setTimeout(startArm, 250);
  });
  document.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag.x = e.clientX; drag.y = e.clientY;
    if (!drag.armed) {
      const dist = Math.hypot(drag.x - drag.sx, drag.y - drag.sy);
      if (drag.type === 'mouse') { if (dist > 6) startArm(); }
      else if (dist > 10) { clearTimeout(drag.timer); drag = null; }
      return;
    }
    moveGhost();
  });
  document.addEventListener('pointerup', (e) => { if (drag && e.pointerId === drag.id) endDrag(true); });
  document.addEventListener('pointercancel', (e) => { if (drag && e.pointerId === drag.id) endDrag(false); });
  document.addEventListener('touchmove', (e) => { if (drag && drag.armed) e.preventDefault(); }, { passive: false });
  document.addEventListener('contextmenu', (e) => { if (e.target.closest && e.target.closest('[data-drag]')) e.preventDefault(); });

  /* ---------- Démarrage ---------- */
  window.addEventListener('hashchange', route);
  route();
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
