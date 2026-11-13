/* Standalone, buildless preview. The research records remain the source of truth. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const bundle = window.MANDALA_DATA;
  if (!bundle || !window.MandalaEvidence) {
    $('map-error').hidden = false;
    $('map-error').textContent = 'The local data bundle did not load. Keep this folder together, or run prepare-data.py to restore it.';
    return;
  }
  const { scene, catalog } = bundle;
  const SIZE = scene.image.width;
  const svg = $('map'), world = $('world'), stage = $('stage');
  const targets = scene.selectionTargets;
  const byId = new Map(targets.map(t => [t.id, t]));
  const observations = new Map(scene.observations.map(o => [o.id, o]));
  const deities = new Map(catalog.deities.map(d => [d.id, d]));
  const groupNames = { central: 'Central figures', 'directional-families': 'Four families', gauris: 'Eight Gaurīs', pisacis: 'Eight Piśācīs', 'six-realm-sages': 'Six realm sages', gatekeepers: 'Four inner gates', ishvaris: 'Twenty-eight Īśvarīs' };
  const groupOrder = ['central', 'directional-families', 'gauris', 'pisacis', 'six-realm-sages', 'gatekeepers', 'ishvaris'];
  const targetNodes = new Map();
  const state = { selected: null, unlocated: null, visible: targets, markers: true, painting: false, layers: { peaceful: true, wrathful: true }, camera: { x: 0, y: 0, scale: 1 }, opener: null };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cap = value => value ? value[0].toUpperCase() + value.slice(1) : '';
  const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const deityVisible = id => state.layers[id.startsWith('zhiwa.') ? 'peaceful' : 'wrathful'];
  const visibleDeityIds = ids => ids.filter(deityVisible);
  const announce = message => { $('live-status').textContent = message; };
  const shortLabel = target => {
    if (target.kind === 'gate-assembly') return `${cap(target.candidateRitualDirection)} gate`;
    if (target.kind === 'petal-assembly') return `${cap(target.candidateRitualDirection)} · ${target.candidateFamily} family`;
    if (target.group === 'central') return ({ 'target-marker-001': 'Ochre central circle', 'target-marker-002': 'Red central circle', 'target-marker-003': 'White central circle', 'target-marker-004': 'Blue central circle' })[target.id];
    if (target.group === 'six-realm-sages') return `${cap(observations.get(target.observationIds[0]).screenPosition.replaceAll('-', ' '))} annulus`;
    return target.label;
  };
  const targetStatus = target => target.kind === 'schematic-location' ? 'Working placement' : 'Working map';
  const markerSymbol = target => target.kind === 'single-observation' ? '◌' : '❖';
  const sourceAnchor = source => !source.url ? `<span>${esc(source.label)}</span>` : `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)} ↗</a>`;
  const svgNode = (name, attrs) => {
    const node = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    return node;
  };

  function makeMarkers() {
    for (const target of targets) {
      const group = svgNode('g', { class: `map-target ${target.evidenceStatus === 'provisional' ? 'provisional' : 'unresolved'} ${target.kind === 'single-observation' ? '' : 'group'}`, tabindex: '0', role: 'button', 'data-target': target.id, 'aria-label': `${shortLabel(target)}. ${targetStatus(target)}.` });
      const title = svgNode('title', {}); title.textContent = `${shortLabel(target)} — ${targetStatus(target)}`; group.append(title);
      // Ambiguous strip features are represented only by their parent petal outline.
      if (target.designLocation) { const o = target.designLocation; group.append(svgNode('circle', {cx:o.x*SIZE,cy:o.y*SIZE,r:26,class:'marker-shape editorial-marker',style:`--marker-color:${target.displayColor}`})); }
      const points = target.observationIds.map(id => observations.get(id)).filter(o => o.observationalStatus === 'observed-circle');
      for (const o of points) group.append(svgNode('circle', { cx: o.x * SIZE, cy: o.y * SIZE, r: 22, class: 'marker-shape', 'data-observation': o.id, style: `--marker-color:rgb(${(o.approximateMedianRgb || [180,160,100]).join(',')})` }));
      if (!target.designLocation && target.kind !== 'single-observation') {
        const [x1, y1, x2, y2] = target.focusBoundsNormalized;
        group.prepend(svgNode('rect', { x: x1 * SIZE, y: y1 * SIZE, width: (x2 - x1) * SIZE, height: (y2 - y1) * SIZE, rx: 18, class: 'group-outline' }));
      }
      group.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); selectTarget(target.id, { focusPanel: true }); }
      });
      group.addEventListener('pointerenter', event => showTooltip(target, event));
      group.addEventListener('pointermove', event => showTooltip(target, event));
      group.addEventListener('pointerleave', hideTooltip);
      $('markers').append(group);
      targetNodes.set(target.id, group);
    }
  }

  function showTooltip(target, event) {
    if (event.pointerType === 'touch' || pointers.size || (!state.markers && state.selected !== target.id)) return;
    const box = stage.getBoundingClientRect();
    const tooltip = $('map-tooltip');
    tooltip.innerHTML = `${esc(shortLabel(target))}<small>${esc(targetStatus(target))}</small>`;
    tooltip.style.left = Math.max(5, Math.min(box.width - 240, event.clientX - box.left + 14)) + 'px';
    tooltip.style.top = Math.max(5, Math.min(box.height - 65, event.clientY - box.top + 14)) + 'px';
    tooltip.hidden = false;
  }
  function hideTooltip() { $('map-tooltip').hidden = true; }

  function rootPoint(clientX, clientY) {
    return new DOMPoint(clientX, clientY).matrixTransform(svg.getScreenCTM().inverse());
  }
  function screenScale() { return Math.hypot(svg.getScreenCTM().a, svg.getScreenCTM().b); }
  function clampCamera(camera) {
    camera.scale = Math.min(18, Math.max(1, camera.scale));
    // Keep a portion of the painting visible, even after a very long drag.
    const margin = SIZE * .22;
    camera.x = Math.min(SIZE - margin, Math.max(-SIZE * camera.scale + margin, camera.x));
    camera.y = Math.min(SIZE - margin, Math.max(-SIZE * camera.scale + margin, camera.y));
    return camera;
  }
  function renderCamera() {
    state.camera = clampCamera(state.camera);
    const { x, y, scale } = state.camera;
    world.setAttribute('transform', `translate(${x} ${y}) scale(${scale})`);
    $('zoom-level').textContent = `${scale.toFixed(1)}×`;
    $('zoom-out').disabled = scale <= 1;
    $('zoom-in').disabled = scale >= 18;
    const minimumRadius = 3 / (screenScale() * scale);
    for (const node of document.querySelectorAll('.marker-shape')) {
      const o = observations.get(node.dataset.observation);
      node.setAttribute('r', Math.max(o?.approximateVisibleOutlineRadiusPixels || (node.classList.contains('editorial-marker') ? 26 : 18), minimumRadius));
    }
    hideTooltip();
  }
  function zoom(factor, point = { x: SIZE / 2, y: SIZE / 2 }) {
    const old = state.camera, scale = Math.max(1, Math.min(18, old.scale * factor)), ratio = scale / old.scale;
    state.camera = { scale, x: point.x - (point.x - old.x) * ratio, y: point.y - (point.y - old.y) * ratio };
    renderCamera();
  }
  function fit() { state.camera = { x: 0, y: 0, scale: 1 }; renderCamera(); announce('Whole mandala fitted to the view.'); }
  function focusTarget(target) {
    const [x1, y1, x2, y2] = target.focusBoundsNormalized;
    const scale = target.designLocation ? 2.5 : target.kind === 'petal-assembly' ? 8 : target.kind === 'gate-assembly' ? 5 : target.group === 'central' ? 10 : 5;
    state.camera = { scale, x: SIZE / 2 - (x1 + x2) / 2 * SIZE * scale, y: SIZE / 2 - (y1 + y2) / 2 * SIZE * scale };
    renderCamera();
  }
  function focusInterior() { state.camera = { scale: 2.35, x: SIZE / 2 - SIZE * .505 * 2.35, y: SIZE / 2 - SIZE * .493 * 2.35 }; renderCamera(); }

  function filters() { return { query: normalize($('search').value.trim()), group: $('group-filter').value, direction: $('direction-filter').value }; }
  function resetFilters() {
    $('search').value = ''; $('group-filter').value = 'all'; $('direction-filter').value = 'all'; applyFilters();
  }
  function renderLayerState() {
    for (const name of ['peaceful', 'wrathful']) $( `layer-${name}` ).checked = state.layers[name];
    const names = Object.keys(state.layers).filter(name => state.layers[name]);
    const label = names.length === 2 ? 'Both assemblies' : names.length === 1 ? `${cap(names[0])} assembly` : 'Palace only';
    $('palace-only').textContent = names.length ? 'Palace only' : 'Show both';
    $('layer-note').textContent = state.painting ? `${label} · the reference painting retains all its painted marks.` : `${label} · ${names.length ? 'select a location to see its deities.' : 'fire, vajra fence, charnel grounds, lotus and palace.'}`;
    stage.classList.toggle('painting-view', state.painting);
  }
  function setLayers(layers) {
    Object.assign(state.layers, layers);
    hideTooltip(); renderLayerState(); applyFilters();
    if (state.selected) renderPanel(byId.get(state.selected));
    announce($('layer-note').textContent);
  }
  function applyFilters() {
    const f = filters();
    state.visible = targets.filter(t => {
      const ids = visibleDeityIds(t.candidateDeityIds);
      const text = [shortLabel(t), t.label, groupNames[t.group], t.candidateRitualDirection, ...ids.map(id => deities.get(id).label), ...ids].join(' ');
      return ids.length && (f.group === 'all' || f.group === t.group) && (f.direction === 'all' || (f.direction === 'unknown' ? !t.candidateRitualDirection : f.direction === t.candidateRitualDirection)) && (!f.query || normalize(text).includes(f.query));
    });
    const unlocated = catalog.deities.filter(d => deityVisible(d.id) && !scene.deityToCandidateTargets[d.id].length && (f.group === 'unlocated' || (f.group === 'all' && f.query)) && (f.direction === 'all' || f.direction === 'unknown') && (!f.query || normalize(d.label + ' ' + d.id + ' Ishvari Isvari unlocated').includes(f.query)));
    const visibleIds = new Set(state.visible.map(t => t.id));
    for (const [id, node] of targetNodes) {
      const exposed = visibleIds.has(id) && (state.markers || id === state.selected);
      node.toggleAttribute('hidden', !visibleIds.has(id));
      node.setAttribute('tabindex', exposed ? '0' : '-1');
      node.setAttribute('aria-hidden', String(!exposed));
    }
    // A filtered-out selection is closed rather than leaving a hidden location active.
    if ((state.selected && !visibleIds.has(state.selected)) || (state.unlocated && !unlocated.some(d => d.id === state.unlocated))) {
      clearSelection({ push: false, restoreFocus: false });
      history.replaceState(null, '', location.pathname + location.search);
    }
    let html = '';
    for (const group of groupOrder) {
      const members = state.visible.filter(t => t.group === group);
      if (!members.length) continue;
      html += `<div class="list-heading">${esc(groupNames[group])}</div>`;
      for (const t of members) html += `<button class="target-item" data-select="${esc(t.id)}" aria-current="${state.selected === t.id}"><span class="target-icon" aria-hidden="true">${markerSymbol(t)}</span><span><strong>${esc(shortLabel(t))}</strong><small>${esc(targetStatus(t))}</small></span><span class="arrow" aria-hidden="true">›</span></button>`;
    }
    if (unlocated.length) {
      html += '<div class="list-heading">Unlocated Īśvarīs</div>';
      for (const d of unlocated) html += `<button class="target-item" data-deity="${esc(d.id)}" aria-current="${state.unlocated === d.id}"><span class="target-icon" aria-hidden="true">–</span><span><strong>${esc(d.label)}</strong><small>Mandala position unassigned</small></span></button>`;
    }
    $('target-list').innerHTML = html || `<p class="empty">${!state.layers.peaceful && !state.layers.wrathful ? 'The deity layers are hidden. Switch an assembly on to explore its locations.' : 'No matching locations.<br>Try another name or reset the filters.'}</p>`;
    $('result-count').textContent = `${state.visible.length} ${state.visible.length === 1 ? 'location' : 'locations'}${unlocated.length ? ` · ${unlocated.length} unlocated` : ''}`;
  }

  function artCards(ids) {
    ids = visibleDeityIds(ids);
    return `<div class="art-grid">${ids.map(id => {
      const deity = deities.get(id), artwork = bundle.artworkByDeityId[id]?.[0];
      return `<button class="art-card ${ids.length === 1 ? 'single' : ''}" data-art="${esc(id)}" aria-label="View artwork: ${esc(deity.label)}">${artwork ? `<img src="${esc(artwork.src)}" alt="${esc(deity.label)}" loading="lazy">` : '<div class="art-missing">Artwork unavailable</div>'}<span class="art-label">${esc(deity.label)}</span><span class="art-type">${id.startsWith('zhiwa.') ? 'Peaceful' : 'Wrathful'} assembly · view artwork ↗</span></button>`;
    }).join('')}</div>`;
  }
  function showWelcome() {
    $('detail-content').innerHTML = `<div class="detail-inner"><p class="eyebrow">An invitation to explore</p><div class="welcome-ornament" aria-hidden="true">✧</div><h2 class="welcome-title">Enter the<br>mandala.</h2><p class="intro-lead">A visual study of the peaceful and wrathful assemblies of Karma Lingpa’s Zhitro.</p><p class="subtle">Explore the palace, meet its deities, and discover the twenty-eight presences of the outer courtyard.</p><div class="welcome-rule"></div><p class="eyebrow">Begin with</p><button class="start-link" data-select="gate-east-assembly">The eastern gate <span>↗</span></button><button class="start-link" data-select="ishvari-31">The outer courtyard <span>↗</span></button><button class="start-link" data-select="petal-east-family">The Vajra family <span>↗</span></button><button class="start-link" data-select="target-marker-005">Gaurī and the inner ring <span>↗</span></button><div class="coverage"><div><strong>100</strong><span>deities to explore</span></div><div><strong>28</strong><span>Īśvarīs of the courtyard</span></div></div><p class="research-note">Working arrangement · source notes are available within each location.</p></div>`;
    $('map-state').textContent = 'Explore the mandala';
  }
  function renderPanel(target) {
    const panel = target.designLocation ? {
      title: target.label, statusLabel:'Working placement',
      summary: `${cap(target.candidateRitualDirection)} ${target.role === 'outer-gate' ? 'outer gatekeeper' : 'courtyard yoginī'} · One of the twenty-eight Īśvarīs in the wrathful assembly.`,
      groups:[{label:'',ids:target.candidateDeityIds}],unmappedCandidates:[],observations:[],alternatives:[],
      notes:['The direction follows the Karma Lingpa text. This exact position is a schematic design choice, not an identified painted circle.','Pema Lingpa’s seven-per-direction roster is recorded separately.'],
      sources:bundle.mapping.sources.filter(s=>target.sourceIds.includes(s.id)).map(s=>({label:s.label||s.id,url:s.url}))
    } : window.MandalaEvidence.buildPanel(target, bundle);
    panel.groups = panel.groups.map(group => ({ ...group, ids: visibleDeityIds(group.ids) })).filter(group => group.ids.length);
    const title = target.kind === 'single-observation' && ['central', 'six-realm-sages'].includes(target.group) ? shortLabel(target) : panel.title;
    $('detail-content').innerHTML = `<div class="detail-inner"><div class="detail-top"><p class="eyebrow">${esc(groupNames[target.group])}${target.candidateRitualDirection ? ` / ${esc(target.candidateRitualDirection)}` : ''}</p><button class="icon-button" data-close aria-label="Close location details">×</button></div><div class="status-badge">${esc(targetStatus(target))}</div><h2 class="detail-title" tabindex="-1">${esc(title)}</h2><p class="detail-summary">${esc(target.designLocation ? panel.summary : "Explore the figures associated with this part of the mandala.")}</p><button class="panel-action" data-focus="${esc(target.id)}">Center on this location <span aria-hidden="true">⌖</span></button>${panel.groups.map(group => `<p class="candidate-heading">${esc(group.label.replace(/Possible /g, "").replace("Candidate identities across alternatives", "Associated figures").replace("Possible identity", "Associated figure"))}</p>${artCards(group.ids)}`).join('')}<details class="research-details"><summary>Placement &amp; source notes</summary>${panel.unmappedCandidates.length ? `<h3>Also considered</h3><p class="evidence-note">${panel.unmappedCandidates.map(esc).join('<br>')}<br>No matching app artwork.</p>` : ''}<p class="subtle">${esc(panel.summary)}</p>${panel.notes.map(note => `<p class="evidence-note">${esc(note)}</p>`).join('')}${panel.alternatives.length ? `<h3>Possible interpretations</h3>${panel.alternatives.map(a => `<div class="alternative"><strong>${esc(a.label)}</strong><p>${esc(a.description)}</p></div>`).join('')}` : ''}<details><summary>Observed marks · ${panel.observations.length} ${panel.observations.length === 1 ? 'record' : 'records'}</summary>${panel.observations.map(o => `<div class="observation"><strong>${esc(o.id)}</strong> · ${esc(o.position)}<br>${esc(o.color)}</div>`).join('')}</details><details><summary>Supporting sources · ${panel.sources.length}</summary><ul class="source-links">${panel.sources.map(s => `<li>${sourceAnchor(s)}</li>`).join('')}</ul><p class="subtle">These texts support the comparison. They are not an identified key to this painting.</p></details></details></div>`;
    $('detail-panel').scrollTop = 0;
    $('map-state').textContent = shortLabel(target);
    attachImageFallbacks();
  }
  function attachImageFallbacks() {
    for (const image of $('detail-content').querySelectorAll('img')) image.addEventListener('error', () => { image.replaceWith(Object.assign(document.createElement('span'), { className: 'art-missing', textContent: 'Artwork could not load. Keep the assets folder with the preview.' })); });
  }
  function updateSelectionAppearance() {
    for (const [id, node] of targetNodes) {
      node.classList.toggle('selected', id === state.selected); node.setAttribute('aria-pressed', String(id === state.selected));
      const exposed = !node.hasAttribute('hidden') && (state.markers || id === state.selected);
      node.setAttribute('aria-hidden', String(!exposed)); node.setAttribute('tabindex', exposed ? '0' : '-1');
    }
    for (const node of $('target-list').querySelectorAll('[data-select],[data-deity]')) node.setAttribute('aria-current', String(node.dataset.select === state.selected || node.dataset.deity === state.unlocated));
  }
  function closeBrowse() { $('browse').classList.remove('open'); $('browse-toggle').setAttribute('aria-expanded', 'false'); }
  function setHash(hash) { if (location.hash !== hash) history.pushState(null, '', hash || location.pathname + location.search); }
  function selectTarget(id, { focusPanel = false, push = true } = {}) {
    const target = byId.get(id); if (!target) return;
    state.opener = document.activeElement;
    if (!target.candidateDeityIds.some(deityVisible)) {
      state.layers[target.candidateCollections[0]] = true;
      renderLayerState();
    }
    if (!state.visible.some(t => t.id === id)) resetFilters();
    state.selected = id; state.unlocated = null;
    if (!state.markers) setMarkers(true);
    setExpanded(false); renderPanel(target); updateSelectionAppearance(); focusTarget(target); closeBrowse();
    if (push) setHash(`#${encodeURIComponent(id)}`);
    announce(`${shortLabel(target)}. ${targetStatus(target)}. Details and artwork available.`);
    if (focusPanel) $('detail-content').querySelector('h2').focus({ preventScroll: true });
    if (window.innerWidth <= 700) $('detail-panel').scrollIntoView({ behavior: 'instant', block: 'start' });
  }
  function showUnlocated(id, { push = true } = {}) {
    const deity = deities.get(id); if (!deity || scene.deityToCandidateTargets[id].length) return;
    state.opener = document.activeElement; state.selected = null; state.unlocated = id;
    $('detail-content').innerHTML = `<div class="detail-inner"><div class="detail-top"><p class="eyebrow">Unlocated Īśvarī</p><button class="icon-button" data-close aria-label="Close location details">×</button></div><div class="status-badge">Mandala position unassigned</div><h2 class="detail-title" tabindex="-1">${esc(deity.label)}</h2><p class="detail-summary">This identity is present in BardoOS, but no candidate location has been mapped in the surveyed areas. Its artwork is available here.</p>${artCards([id])}<p class="research-note">No circle is highlighted for this deity. The 28 Īśvarīs await a separate location study.</p></div>`;
    attachImageFallbacks(); updateSelectionAppearance(); closeBrowse(); $('detail-panel').scrollTop = 0;
    $('map-state').textContent = 'No mapped position';
    if (push) setHash(`#deity=${encodeURIComponent(id)}`);
    announce(`${deity.label}. Position unassigned.`);
    if (window.innerWidth <= 700) $('detail-panel').scrollIntoView({ behavior: 'instant' });
  }
  function clearSelection({ push = true, restoreFocus = true } = {}) {
    const opener = state.opener; state.selected = null; state.unlocated = null;
    showWelcome(); updateSelectionAppearance();
    if (push) setHash('');
    if (restoreFocus) {
      const hiddenBrowseOpener = opener?.closest?.('#browse') && !$('browse').classList.contains('open') && window.innerWidth <= 1160;
      const destination = hiddenBrowseOpener ? $('browse-toggle') : opener?.isConnected && opener.getClientRects().length ? opener : svg;
      destination.focus({ preventScroll: true });
    }
  }
  function setMarkers(value) {
    state.markers = value; stage.classList.toggle('markers-off', !value);
    $('markers-toggle').setAttribute('aria-pressed', String(value)); $('markers-toggle').textContent = value ? 'Markers on' : 'Markers off';
    updateSelectionAppearance();
  }
  function openArtwork(id) {
    const deity = deities.get(id), art = bundle.artworkByDeityId[id]?.[0]; if (!art) return;
    $('art-title').textContent = deity.label;
    $('art-image').src = art.src; $('art-image').alt = art.deityIds.map(k => deities.get(k).label).join(' and ');
    $('art-caption').textContent = `${art.deityIds.length > 1 ? 'Shared depiction: ' + art.deityIds.map(k => deities.get(k).label).join(' and ') + '. ' : ''}Existing BardoOS artwork. Its appearance does not verify the candidate mandala location.`;
    $('art-dialog').showModal();
  }

  // Pointer events cover mouse drag, single-finger pan and two-finger pinch.
  const pointers = new Map(); let dragStart = null, pinchStart = null, lastGesture = 0;
  function beginPinch() {
    const [a, b] = [...pointers.values()];
    pinchStart = { distance: Math.hypot(a.x - b.x, a.y - b.y), midpoint: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, camera: { ...state.camera } };
  }
  svg.addEventListener('pointerdown', event => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    hideTooltip(); const point = rootPoint(event.clientX, event.clientY); pointers.set(event.pointerId, point);
    svg.setPointerCapture(event.pointerId);
    if (pointers.size === 1) dragStart = { point, camera: { ...state.camera }, clientX: event.clientX, clientY: event.clientY, moved: false };
    if (pointers.size === 2) { beginPinch(); lastGesture = Date.now(); }
  });
  svg.addEventListener('pointermove', event => {
    if (!pointers.has(event.pointerId)) return;
    const point = rootPoint(event.clientX, event.clientY); pointers.set(event.pointerId, point);
    if (pointers.size >= 2 && pinchStart) {
      const [a, b] = [...pointers.values()], midpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const scale = Math.max(1, Math.min(18, pinchStart.camera.scale * Math.hypot(a.x - b.x, a.y - b.y) / Math.max(1, pinchStart.distance)));
      const ratio = scale / pinchStart.camera.scale;
      state.camera = { scale, x: midpoint.x - (pinchStart.midpoint.x - pinchStart.camera.x) * ratio, y: midpoint.y - (pinchStart.midpoint.y - pinchStart.camera.y) * ratio };
      lastGesture = Date.now(); renderCamera();
    } else if (dragStart) {
      if (Math.hypot(event.clientX - dragStart.clientX, event.clientY - dragStart.clientY) > 4) dragStart.moved = true;
      if (dragStart.moved) { state.camera = { ...dragStart.camera, x: dragStart.camera.x + point.x - dragStart.point.x, y: dragStart.camera.y + point.y - dragStart.point.y }; lastGesture = Date.now(); svg.classList.add('dragging'); renderCamera(); }
    }
  });
  function endPointer(event) {
    pointers.delete(event.pointerId);
    if (pinchStart) lastGesture = Date.now();
    pinchStart = null;
    if (pointers.size === 1) { const point = [...pointers.values()][0]; const screen = new DOMPoint(point.x, point.y).matrixTransform(svg.getScreenCTM()); dragStart = { point, camera: { ...state.camera }, clientX: screen.x, clientY: screen.y, moved: true }; }
    else if (!pointers.size) { dragStart = null; svg.classList.remove('dragging'); }
  }
  svg.addEventListener('pointerup', endPointer); svg.addEventListener('pointercancel', endPointer);
  svg.addEventListener('click', event => {
    if (Date.now() - lastGesture < 300) return;
    // Hit testing chooses the nearest observed circle, avoiding overlapping invisible hit boxes.
    const root = rootPoint(event.clientX, event.clientY), c = state.camera;
    const point = { x: (root.x - c.x) / c.scale, y: (root.y - c.y) / c.scale };
    let closest = null, distance = Infinity;
    for (const t of state.visible) {
      if (!state.markers && t.id !== state.selected) continue;
      const points = t.designLocation ? [t.designLocation] : t.observationIds.map(id => observations.get(id)).filter(o => o.observationalStatus === 'observed-circle');
      for (const o of points) {
        const d = Math.hypot(point.x - o.x * SIZE, point.y - o.y * SIZE) * c.scale * screenScale();
        const hitRadius = Math.max(24, (o.approximateVisibleOutlineRadiusPixels || (t.designLocation ? 26 : 22)) * c.scale * screenScale() + 6);
        if (d <= hitRadius && d < distance) { distance = d; closest = t; }
      }
    }
    if (closest) selectTarget(closest.id);
    else {
      const group = event.target.closest('.map-target.group');
      if (group && !group.hasAttribute('hidden') && (state.markers || group.dataset.target === state.selected)) selectTarget(group.dataset.target);
    }
  });
  svg.addEventListener('wheel', event => { event.preventDefault(); zoom(Math.exp(-Math.max(-200, Math.min(200, event.deltaY)) * .0025), rootPoint(event.clientX, event.clientY)); }, { passive: false });
  svg.addEventListener('keydown', event => {
    if (event.key === '+' || event.key === '=') { event.preventDefault(); zoom(1.35); }
    else if (event.key === '-') { event.preventDefault(); zoom(1 / 1.35); }
    else if (event.key === 'Home' || event.key === '0') { event.preventDefault(); fit(); }
    else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault(); const delta = 60 / screenScale();
      state.camera.x += event.key === 'ArrowLeft' ? delta : event.key === 'ArrowRight' ? -delta : 0;
      state.camera.y += event.key === 'ArrowUp' ? delta : event.key === 'ArrowDown' ? -delta : 0; renderCamera();
    }
  });
  $('zoom-in').addEventListener('click', () => zoom(1.4)); $('zoom-out').addEventListener('click', () => zoom(1 / 1.4));
  $('fit-button').addEventListener('click', fit); $('interior-button').addEventListener('click', focusInterior);
  $('markers-toggle').addEventListener('click', () => setMarkers(!state.markers));
  $('clear-filters').addEventListener('click', resetFilters);
  $('search').addEventListener('input', applyFilters);
  for (const id of ['group-filter', 'direction-filter']) $(id).addEventListener('change', applyFilters);
  for (const name of ['peaceful', 'wrathful']) $(`layer-${name}`).addEventListener('change', event => setLayers({ [name]: event.target.checked }));
  $('palace-only').addEventListener('click', () => { const show = !state.layers.peaceful && !state.layers.wrathful; setLayers({ peaceful: show, wrathful: show }); });
  function setExpanded(expanded) {
    document.body.classList.toggle('map-expanded', expanded);
    $('expand-map').setAttribute('aria-pressed', String(expanded));
    $('expand-map').textContent = expanded ? 'Restore panels' : 'Expand view';
  }
  $('expand-map').addEventListener('click', () => setExpanded(!document.body.classList.contains('map-expanded')));
  $('browse-toggle').addEventListener('click', () => { const open = $('browse').classList.toggle('open'); $('browse-toggle').setAttribute('aria-expanded', String(open)); if (open) $('search').focus(); });
  document.addEventListener('click', event => {
    const button = event.target.closest('button'); if (!button) return;
    if (button.dataset.select) selectTarget(button.dataset.select, { focusPanel: true });
    else if (button.dataset.deity) showUnlocated(button.dataset.deity);
    else if (button.dataset.art) openArtwork(button.dataset.art);
    else if (button.dataset.focus) { focusTarget(byId.get(button.dataset.focus)); if (window.innerWidth <= 700) document.querySelector('.map-section').scrollIntoView({ behavior: 'instant', block: 'start' }); }
    else if (button.hasAttribute('data-close')) clearSelection();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !$('art-dialog').open && !$('about-dialog').open) { closeBrowse(); if (state.selected || state.unlocated) { event.preventDefault(); clearSelection(); } }
  });
  $('about-button').addEventListener('click', () => $('about-dialog').showModal());
  $('about-close').addEventListener('click', () => $('about-dialog').close());
  $('art-close').addEventListener('click', () => $('art-dialog').close());
  for (const dialog of [$('art-dialog'), $('about-dialog')]) dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  function restoreHash() {
    let hash; try { hash = decodeURIComponent(location.hash.slice(1)); } catch { hash = ''; }
    if (byId.has(hash)) selectTarget(hash, { push: false });
    else if (hash.startsWith('deity=') && deities.has(hash.slice(6))) showUnlocated(hash.slice(6), { push: false });
    else clearSelection({ push: false, restoreFocus: false });
  }
  window.addEventListener('popstate', restoreHash);
  $('painting').addEventListener('error', () => { $('map-error').hidden = false; $('map-error').textContent = 'The mandala image could not load. Restore assets/mandala.jpeg; the location list and evidence panels remain available.'; });
  $('view-toggle').addEventListener('click', () => {
    const painting = $('painting'); const showPainting = !state.painting;
    state.painting = showPainting;
    painting.style.display = showPainting ? '' : 'none'; $('diagram').style.display = showPainting ? 'none' : '';
    $('view-toggle').textContent = showPainting ? 'Drawn mandala' : 'Original painting';
    $('view-toggle').setAttribute('aria-pressed', String(showPainting));
    renderLayerState();
  });
  makeMarkers(); renderLayerState(); showWelcome(); applyFilters(); renderCamera(); restoreHash();
  new ResizeObserver(renderCamera).observe(stage);
})();
