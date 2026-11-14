import { bindFigureNavigation, figureTextHref } from '../js/iconography.js';
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const bundle = window.MANDALA_DATA;
  if (!bundle || !window.MandalaPreview) {
    $('map-error').hidden = false;
    $('map-error').textContent = 'The mandala data could not load. Reload the page to try again.';
    return;
  }
  const { scene, catalog } = bundle;
  const { width: SIZE, center } = scene.image;
  const svg = $('map'), world = $('world'), stage = $('stage');
  const targets = scene.selectionTargets;
  const byId = new Map(targets.map(t => [t.id, t]));
  const deities = new Map(catalog.deities.map(d => [d.id, d]));
  const groupNames = { central: 'Central figures', 'directional-families': 'Four families', gauris: 'Eight Gaurīs', pisacis: 'Eight Piśācīs', 'six-realm-sages': 'Six realm sages', gatekeepers: 'Four inner gates', ishvaris: 'Twenty-eight Īśvarīs' };
  const groupOrder = ['central', 'directional-families', 'gauris', 'pisacis', 'six-realm-sages', 'gatekeepers', 'ishvaris'];
  const targetNodes = new Map(), mapMarkers = new Map();
  const state = { selected: null, selectedMarker: null, artworkOnly: null, visible: targets, markers: true, painting: false, layers: { peaceful: true, wrathful: true }, camera: { x: 0, y: 0, scale: 1 }, opener: null };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cap = value => value ? value[0].toUpperCase() + value.slice(1) : '';
  const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const assemblyOf = id => id.startsWith('zhiwa.') ? 'peaceful' : 'wrathful';
  const deityVisible = id => state.layers[assemblyOf(id)];
  const visibleDeityIds = ids => ids.filter(deityVisible);
  const announce = message => { $('live-status').textContent = message; };
  const icons = {
    next: '<path d="m9 5 7 7-7 7"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    center: '<circle cx="12" cy="12" r="6"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/>',
  };
  const icon = name => `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
  const svgNode = (name, attrs) => {
    const node = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    return node;
  };

  function activateMarker(target, index, event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.stopPropagation();
    selectTarget(target.id, { focusPanel: true, marker: index });
  }

  function previewAtFocus(target, index, node) {
    dismissedPreviewTarget = null;
    const box = node.getBoundingClientRect();
    showTooltip(target, index, { clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 });
  }

  let renderedPixelScale;
  function makeMarkers() {
    renderedPixelScale = undefined;
    $('markers').replaceChildren();
    for (const target of targets) {
      const label = target.label;
      const group = svgNode('g', { class: 'map-target', 'data-target': target.id, 'aria-label': label });
      const markers = (state.painting ? target.paintingMarkers : target.markers).map((point, index) => {
        const { x, y, radius, color, editorial } = point;
        const circle = svgNode('g', { class: 'map-marker', 'data-marker': index, style: `--marker-color:${color}`, 'aria-label': `${label}, circle ${index + 1}` });
        const halo = svgNode('circle', { cx: x, cy: y, r: radius, class: 'marker-halo', 'aria-hidden': 'true' });
        const shape = svgNode('circle', { cx: x, cy: y, r: radius, class: `marker-shape${editorial ? ' editorial-marker' : ''}` });
        circle.append(halo, shape);
        circle.addEventListener('keydown', event => activateMarker(target, index, event));
        circle.addEventListener('focus', () => previewAtFocus(target, index, circle));
        circle.addEventListener('blur', hideTooltip);
        group.append(circle);
        return { ...point, circle, halo, shape };
      });
      const spacing = markers.length > 1 ? Math.min(...markers.flatMap((a, i) =>
        markers.slice(i + 1).map(b => Math.hypot(a.x - b.x, a.y - b.y)))) : 0;
      mapMarkers.set(target.id, { markers, spacing });
      targetNodes.set(target.id, group);
      $('markers').append(group);
      group.addEventListener('keydown', event => { if (event.target === group) activateMarker(target, null, event); });
      group.addEventListener('focus', () => previewAtFocus(target, null, group));
      group.addEventListener('blur', hideTooltip);
    }
  }

  let previewTarget = null, previewMarker = null, previewHideTimer = null, dismissedPreviewTarget = null;
  const previewKey = (target, index) => `${target.id}:${index ?? ''}`;
  const markerNode = (target, index) => index === null ? targetNodes.get(target.id) : mapMarkers.get(target.id).markers[index].circle;
  function showTooltip(target, index, event) {
    if (event.pointerType === 'touch' || pointers.size || (!state.markers && state.selected !== target.id) || !state.visible.includes(target)) return;
    if (dismissedPreviewTarget === previewKey(target, index)) return;
    clearTimeout(previewHideTimer);
    const tooltip = $('map-tooltip');
    if (previewTarget !== target || previewMarker !== index) {
      hideTooltip();
      const { items, total } = window.MandalaPreview.artworksFor(target, bundle, state.layers);
      previewTarget = target;
      previewMarker = index;
      const node = markerNode(target, index);
      node.classList.add('hovered');
      if (!items.length) return;
      node.setAttribute('aria-describedby', 'map-tooltip');
      tooltip.innerHTML = `<p class="preview-title">${esc(target.label)}</p>${index === null ? '' : `<p class="preview-status">Circle ${index + 1}</p>`}<div class="preview-artworks ${items.length === 1 ? 'single' : ''}">${items.map(item => `<figure><img src="${esc(item.src)}" alt="${esc(item.label)}" decoding="async"><figcaption>${esc(item.label)}</figcaption></figure>`).join('')}</div><p class="preview-note">${total > items.length ? `${total - items.length} more depictions. ` : ''}Select the circle for details.</p>`;
      for (const image of tooltip.querySelectorAll('img')) image.addEventListener('error', () => image.replaceWith(Object.assign(document.createElement('span'), { className: 'art-missing', textContent: 'Artwork unavailable' })));
    }
    if (!markerNode(target, index).hasAttribute('aria-describedby')) return;
    tooltip.hidden = false;
    const width = tooltip.offsetWidth, height = tooltip.offsetHeight, gap = 18;
    const bounds = targetNodes.get(target.id).getBoundingClientRect();
    const right = Math.max(event.clientX, bounds.right) + gap;
    const left = right + width > window.innerWidth - 12 ? Math.min(event.clientX, bounds.left) - width - gap : right;
    tooltip.style.left = Math.max(12, Math.min(window.innerWidth - width - 12, left)) + 'px';
    tooltip.style.top = Math.max(12, Math.min(window.innerHeight - height - 12, event.clientY - 35)) + 'px';
  }
  function hideTooltip() {
    clearTimeout(previewHideTimer);
    if (previewTarget) {
      const node = markerNode(previewTarget, previewMarker);
      node.classList.remove('hovered');
      node.removeAttribute('aria-describedby');
    }
    previewTarget = null;
    previewMarker = null;
    $('map-tooltip').hidden = true;
  }
  function deferHideTooltip() { clearTimeout(previewHideTimer); previewHideTimer = setTimeout(hideTooltip, 140); }
  $('map-tooltip').addEventListener('pointerenter', () => clearTimeout(previewHideTimer));
  $('map-tooltip').addEventListener('pointerleave', hideTooltip);
  svg.addEventListener('pointerleave', deferHideTooltip);

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
    hideTooltip();
    const pixelsPerUnit = screenScale() * scale;
    if (pixelsPerUnit === renderedPixelScale) return;
    renderedPixelScale = pixelsPerUnit;
    for (const { markers } of mapMarkers.values()) {
      for (const { radius, halo, shape } of markers) {
        const visibleRadius = Math.max(radius, (markers.length > 1 ? 1.7 : 2.7) / pixelsPerUnit);
        shape.setAttribute('r', visibleRadius);
        halo.setAttribute('r', visibleRadius + 3 / pixelsPerUnit);
      }
    }
    $('marker-blur').setAttribute('stdDeviation', 3 / pixelsPerUnit);
    updateSelectionAppearance();
  }
  function zoom(factor, point = { x: SIZE / 2, y: SIZE / 2 }) {
    const old = state.camera, scale = Math.max(1, Math.min(18, old.scale * factor)), ratio = scale / old.scale;
    state.camera = { scale, x: point.x - (point.x - old.x) * ratio, y: point.y - (point.y - old.y) * ratio };
    renderCamera();
  }
  function fit() { state.camera = { x: 0, y: 0, scale: 1 }; renderCamera(); announce('Whole mandala fitted to the view.'); }
  function focusTarget(target) {
    const { markers } = mapMarkers.get(target.id);
    const xs = markers.map(p => p.x), ys = markers.map(p => p.y);
    const x = (Math.min(...xs) + Math.max(...xs)) / 2;
    const y = (Math.min(...ys) + Math.max(...ys)) / 2;
    const scale = target.kind === 'courtyard-location' ? 2.5 : target.kind === 'petal-assembly' ? 8 : target.kind === 'gate-assembly' ? 5 : target.group === 'central' ? 10 : 5;
    state.camera = { scale, x: SIZE / 2 - x * scale, y: SIZE / 2 - y * scale };
    renderCamera();
  }
  function focusInterior() { state.camera = { scale: 2.35, x: SIZE / 2 - center[0] * 2.35, y: SIZE / 2 - center[1] * 2.35 }; renderCamera(); }

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
    dismissedPreviewTarget = null;
    hideTooltip();
    const f = filters();
    state.visible = targets.filter(t => {
      const ids = visibleDeityIds(t.deityIds);
      const text = [t.label, groupNames[t.group], t.direction, ...ids.map(id => deities.get(id).label), ...ids].join(' ');
      return ids.length && (f.group === 'all' || f.group === t.group) && (f.direction === 'all' || f.direction === t.direction) && (!f.query || normalize(text).includes(f.query));
    });
    const artworkOnly = f.query && f.group === 'all' && f.direction === 'all'
      ? catalog.deities.filter(d => deityVisible(d.id) && !scene.locationsByDeity[d.id]?.length &&
          normalize(d.label + ' ' + d.id).includes(f.query))
      : [];
    const visibleIds = new Set(state.visible.map(t => t.id));
    for (const [id, node] of targetNodes) node.toggleAttribute('hidden', !visibleIds.has(id));
    updateSelectionAppearance();
    // A filtered-out selection is closed rather than leaving a hidden location active.
    if ((state.selected && !visibleIds.has(state.selected)) || (state.artworkOnly && !artworkOnly.some(d => d.id === state.artworkOnly))) {
      clearSelection({ push: false, restoreFocus: false });
      history.replaceState(null, '', location.pathname + location.search);
    }
    let html = '';
    for (const group of groupOrder) {
      const members = state.visible.filter(t => t.group === group);
      if (!members.length) continue;
      html += `<div class="list-heading">${esc(groupNames[group])}</div>`;
      for (const t of members) html += `<button class="target-item" data-select="${esc(t.id)}" aria-current="${state.selected === t.id}"><span><strong>${esc(t.label)}</strong></span>${icon('next')}</button>`;
    }
    if (artworkOnly.length) {
      html += '<div class="list-heading">Artwork</div>';
      for (const d of artworkOnly) html += `<button class="target-item" data-deity="${esc(d.id)}" aria-current="${state.artworkOnly === d.id}"><span><strong>${esc(d.label)}</strong></span></button>`;
    }
    $('target-list').innerHTML = html || `<p class="empty">${!state.layers.peaceful && !state.layers.wrathful ? 'The deity layers are hidden. Switch an assembly on to explore its locations.' : 'No matching locations.<br>Try another name or reset the filters.'}</p>`;
    $('result-count').textContent = `${state.visible.length} ${state.visible.length === 1 ? 'location' : 'locations'}${artworkOnly.length ? ` · ${artworkOnly.length} artworks` : ''}`;
  }

  function artCards(ids) {
    ids = visibleDeityIds(ids);
    return `<div class="art-grid">${ids.map(id => {
      const deity = deities.get(id), artwork = bundle.artworkByDeityId[id]?.[0];
      return `<button class="art-card ${ids.length === 1 ? 'single' : ''}" data-art="${esc(id)}" aria-label="View artwork: ${esc(deity.label)}">${artwork ? `<img src="${esc(artwork.src)}" alt="${esc(deity.label)}" loading="lazy">` : '<div class="art-missing">Artwork unavailable</div>'}<span class="art-label">${esc(deity.label)}</span><span class="art-type">${id.startsWith('zhiwa.') ? 'Peaceful' : 'Wrathful'} assembly · View artwork</span></button>`;
    }).join('')}</div>`;
  }
  function showWelcome() {
    $('detail-content').innerHTML = `<div class="detail-inner"><p class="eyebrow">Karma Lingpa Zhitro</p><h2 class="welcome-title">Explore the mandala</h2><p class="intro-lead">The peaceful and wrathful assemblies within the four-gated palace.</p><p class="subtle">Hover over a circle to preview its figures. Select it to view the artwork. Use the layers to study either assembly or the palace alone.</p><div class="welcome-rule"></div><p class="eyebrow">Explore by location</p><button class="start-link" data-select="gate-east-assembly">The eastern gate ${icon('next')}</button><button class="start-link" data-select="ishvari-31">The outer courtyard ${icon('next')}</button><button class="start-link" data-select="petal-east-family">The Vajra family ${icon('next')}</button><button class="start-link" data-select="target-marker-005">Gaurī and the inner ring ${icon('next')}</button><div class="coverage"><div><strong>100</strong><span>deities</span></div><div><strong>28</strong><span>Īśvarīs of the courtyard</span></div></div></div>`;
    $('map-state').textContent = 'Explore the mandala';
  }
  function renderPanel(target) {
    const groups = target.artworkGroups.map(group => ({
      label: group.label,
      ids: visibleDeityIds(group.deityIds),
    })).filter(group => group.ids.length);
    const heading = [groupNames[target.group], target.direction && cap(target.direction)].filter(Boolean).join(' · ');
    $('detail-content').innerHTML = `<div class="detail-inner">
      <div class="detail-top"><p class="eyebrow">${esc(heading)}</p><button class="icon-button" data-close aria-label="Close location details">${icon('close')}</button></div>
      <h2 class="detail-title" tabindex="-1">${esc(target.label)}</h2>
      <button class="panel-action" data-focus="${esc(target.id)}">Center on this location ${icon('center')}</button>
      ${groups.map(({ label, ids }) => `${label ? `<h3 class="art-group-title">${esc(label)}</h3>` : ''}${artCards(ids)}`).join('')}
    </div>`;
    $('detail-panel').scrollTop = 0;
    $('map-state').textContent = target.label;
    attachImageFallbacks();
  }
  function attachImageFallbacks() {
    for (const image of $('detail-content').querySelectorAll('img')) image.addEventListener('error', () => { image.replaceWith(Object.assign(document.createElement('span'), { className: 'art-missing', textContent: 'Artwork unavailable' })); });
  }
  // Switch to individual hits when the closest centers are distinguishable
  // in screen pixels. The same zoom can expose different detail on a phone.
  function individualMarkers(id, pixelsPerUnit) {
    return mapMarkers.get(id).spacing * pixelsPerUnit >= 16;
  }
  function updateSelectionAppearance() {
    const pixelsPerUnit = screenScale() * state.camera.scale;
    for (const [id, node] of targetNodes) {
      const selected = state.selected === id;
      const individual = individualMarkers(id, pixelsPerUnit);
      const exposed = !node.hasAttribute('hidden') && (state.markers || selected);
      const selectedIndex = selected && individual ? state.selectedMarker : null;
      node.classList.toggle('selected', selected);
      node.classList.toggle('group-selected', selected && selectedIndex === null);
      node.setAttribute('role', individual ? 'group' : 'button');
      if (individual) node.removeAttribute('aria-pressed');
      else node.setAttribute('aria-pressed', String(selected));
      node.setAttribute('aria-hidden', String(!exposed));
      node.setAttribute('tabindex', exposed && !individual ? '0' : '-1');
      for (const [index, { circle }] of mapMarkers.get(id).markers.entries()) {
        circle.classList.toggle('selected', index === selectedIndex);
        circle.setAttribute('tabindex', exposed && individual ? '0' : '-1');
        circle.setAttribute('aria-hidden', String(!(exposed && individual)));
        if (individual) {
          circle.setAttribute('role', 'button');
          circle.setAttribute('aria-pressed', String(index === selectedIndex));
        } else {
          circle.removeAttribute('role');
          circle.removeAttribute('aria-pressed');
        }
      }
    }
  }
  function updateSelectionAppearanceAndList() {
    updateSelectionAppearance();
    for (const node of $('target-list').querySelectorAll('[data-select],[data-deity]')) node.setAttribute('aria-current', String(node.dataset.select === state.selected || node.dataset.deity === state.artworkOnly));
  }
  function closeBrowse() { $('browse').classList.remove('open'); $('browse-toggle').setAttribute('aria-expanded', 'false'); }
  function setHash(hash) { if (location.hash !== hash) history.pushState(null, '', hash || location.pathname + location.search); }
  function selectTarget(id, { focusPanel = false, push = true, scrollPanel = true, marker = null } = {}) {
    const target = byId.get(id); if (!target) return;
    state.opener = document.activeElement;
    if (!target.deityIds.some(deityVisible)) {
      state.layers[assemblyOf(target.deityIds[0])] = true;
      renderLayerState();
    }
    if (!state.visible.some(t => t.id === id)) resetFilters();
    state.selected = id; state.selectedMarker = marker; state.artworkOnly = null;
    if (!state.markers) setMarkers(true);
    setExpanded(false); renderPanel(target); updateSelectionAppearanceAndList();
    if (marker === null) focusTarget(target);
    closeBrowse();
    if (push) setHash(`#${encodeURIComponent(id)}`);
    const label = marker === null ? target.label : `${target.label}, circle ${marker + 1}`;
    announce(`${label}. Artwork available.`);
    if (focusPanel) $('detail-content').querySelector('h2').focus({ preventScroll: true });
    if (scrollPanel && window.innerWidth <= 700) $('detail-panel').scrollIntoView({ behavior: 'instant', block: 'start' });
  }
  function showArtworkDetails(id, { push = true } = {}) {
    const deity = deities.get(id); if (!deity || scene.locationsByDeity[id]?.length) return;
    state.opener = document.activeElement; state.selected = null; state.selectedMarker = null; state.artworkOnly = id;
    $('detail-content').innerHTML = `<div class="detail-inner">
      <div class="detail-top"><p class="eyebrow">Artwork</p><button class="icon-button" data-close aria-label="Close artwork details">${icon('close')}</button></div>
      <h2 class="detail-title" tabindex="-1">${esc(deity.label)}</h2>
      ${artCards([id])}
    </div>`;
    attachImageFallbacks(); updateSelectionAppearanceAndList(); closeBrowse(); $('detail-panel').scrollTop = 0;
    $('map-state').textContent = deity.label;
    if (push) setHash(`#deity=${encodeURIComponent(id)}`);
    announce(deity.label);
    if (window.innerWidth <= 700) $('detail-panel').scrollIntoView({ behavior: 'instant' });
  }
  function clearSelection({ push = true, restoreFocus = true } = {}) {
    const opener = state.opener; state.selected = null; state.selectedMarker = null; state.artworkOnly = null;
    showWelcome(); updateSelectionAppearanceAndList();
    if (push) setHash('');
    if (restoreFocus) {
      const hiddenBrowseOpener = opener?.closest?.('#browse') && !$('browse').classList.contains('open') && window.innerWidth <= 1160;
      const destination = hiddenBrowseOpener ? $('browse-toggle') : opener?.isConnected && opener.getClientRects().length ? opener : svg;
      destination.focus({ preventScroll: true });
    }
  }
  function setMarkers(value) {
    hideTooltip();
    state.markers = value; stage.classList.toggle('markers-off', !value);
    $('markers-toggle').setAttribute('aria-pressed', String(value)); $('markers-toggle').textContent = value ? 'Markers on' : 'Markers off';
    updateSelectionAppearance();
  }
  let artItems = [], artIndex = 0, artReturnToMap = false;
  function selectDeity(id) {
    const locations = scene.locationsByDeity[id] || [];
    const targetId = locations.includes(state.selected) ? state.selected : locations[0];
    const opener = state.opener;
    if (targetId) selectTarget(targetId, { push: false, scrollPanel: false });
    else showArtworkDetails(id, { push: false });
    state.opener = opener;
  }
  function renderArtwork(id) {
    const art = bundle.artworkByDeityId[id]?.[0]; if (!art) return;
    selectDeity(id);
    hideTooltip();
    const shown = art.deityIds.filter(deityVisible);
    $('art-title').textContent = shown.map(k => deities.get(k).label).join(' · ');
    $('art-image').src = art.src; $('art-image').alt = art.deityIds.map(k => deities.get(k).label).join(' and ');
    $('art-links').innerHTML = shown.map(k => `<div><span>${esc(deities.get(k).label)}</span><div class="figure-links">${scene.locationsByDeity[k]?.length ? `<a href="#deity=${encodeURIComponent(k)}" data-show-location="${esc(k)}">Show in mandala</a>` : ''}<a href="${figureTextHref(k, '../')}">Show in text</a></div></div>`).join('');
    $('art-position').textContent = `${artIndex + 1} / ${artItems.length}`;
    $('art-previous').disabled = artItems.length < 2;
    $('art-next').disabled = artItems.length < 2;
    // A small overview keeps the location visible alongside expanded artwork
    // even on phones, where the dialog covers the full-size map.
    const target = byId.get(state.selected);
    const points = target ? target.markers : [];
    $('art-location').hidden = !target;
    $('art-location').innerHTML = target ? `<svg viewBox="0 0 ${SIZE} ${SIZE}" role="img" aria-label="Mandala location"><image href="assets/diagram.svg" width="${SIZE}" height="${SIZE}"/>${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="90" fill="${esc(p.color)}" stroke="#fff" stroke-width="20"/>`).join('')}</svg><span>${esc(target.label)}</span>` : '';
  }
  function openArtwork(id, { push = true } = {}) {
    if (!bundle.artworkByDeityId[id]?.[0]) return;
    const layer = assemblyOf(id);
    if (!state.layers[layer]) { state.layers[layer] = true; renderLayerState(); applyFilters(); }
    // Browse the enabled assemblies in catalog order, once per shared image.
    const seen = new Set();
    artItems = catalog.deities.filter(d => deityVisible(d.id)).map(d => d.id).filter(k => {
      const src = bundle.artworkByDeityId[k]?.[0]?.src;
      if (!src || seen.has(src)) return false;
      seen.add(src); return true;
    });
    artIndex = artItems.findIndex(k => bundle.artworkByDeityId[k][0].src === bundle.artworkByDeityId[id][0].src);
    renderArtwork(id);
    if (push) setHash(`#deity=${encodeURIComponent(id)}`);
    if (!$('art-dialog').open) $('art-dialog').showModal();
  }
  function moveArtwork(delta) {
    if (!artItems.length) return;
    const focused = document.activeElement;
    artIndex = (artIndex + delta + artItems.length) % artItems.length;
    const id = artItems[artIndex];
    renderArtwork(id);
    if (!focused.isConnected) $(delta < 0 ? 'art-previous' : 'art-next').focus();
    history.replaceState(null, '', `#deity=${encodeURIComponent(id)}`);
  }
  bindFigureNavigation({ surface: $('art-dialog'), previous: $('art-previous'), next: $('art-next'),
    active: () => $('art-dialog').open, move: moveArtwork });
  $('art-links').addEventListener('click', event => {
    const link = event.target.closest('[data-show-location]');
    if (!link) return;
    event.preventDefault();
    selectDeity(link.dataset.showLocation);
    artReturnToMap = true;
    history.replaceState(null, '', `#deity=${encodeURIComponent(link.dataset.showLocation)}`);
    $('art-dialog').close();
    document.querySelector('.map-section').scrollIntoView({ block: 'start' });
    targetNodes.get(state.selected)?.focus({ preventScroll: true });
  });
  $('art-dialog').addEventListener('close', () => {
    if (artReturnToMap) {
      artReturnToMap = false;
      (targetNodes.get(state.selected) || svg).focus({ preventScroll: true });
      return;
    }
    // Panel rendering replaces the opener. Restore focus to its new card.
    const id = artItems[artIndex];
    const card = [...$('detail-content').querySelectorAll('[data-art]')].find(el => el.dataset.art === id);
    (card || targetNodes.get(state.selected) || svg).focus({ preventScroll: true });
  });

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
  function nearestTarget(event, minimumHitRadius = 24) {
    const root = rootPoint(event.clientX, event.clientY), c = state.camera;
    const point = { x: (root.x - c.x) / c.scale, y: (root.y - c.y) / c.scale };
    let closest = null, distance = Infinity;
    const pixelsPerUnit = c.scale * screenScale();
    for (const target of state.visible) {
      if (!state.markers && target.id !== state.selected) continue;
      const { markers } = mapMarkers.get(target.id);
      const individual = individualMarkers(target.id, pixelsPerUnit);
      for (const [index, mark] of markers.entries()) {
        const d = Math.hypot(point.x - mark.x, point.y - mark.y) * pixelsPerUnit;
        const hitRadius = Math.max(minimumHitRadius, mark.radius * pixelsPerUnit + 6);
        if (d <= hitRadius && d < distance) {
          distance = d;
          closest = { target, index: individual ? index : null };
        }
      }
    }
    return closest;
  }
  svg.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || pointers.size || event.buttons) return;
    const hit = nearestTarget(event, 10);
    if (!hit || previewKey(hit.target, hit.index) !== dismissedPreviewTarget) dismissedPreviewTarget = null;
    if (hit) showTooltip(hit.target, hit.index, event);
    else deferHideTooltip();
  });
  svg.addEventListener('click', event => {
    if (Date.now() - lastGesture < 300) return;
    const hit = nearestTarget(event);
    if (hit) selectTarget(hit.target.id, { marker: hit.index });
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
  $('browse-close').addEventListener('click', () => { closeBrowse(); $('browse-toggle').focus(); });
  $('browse-toggle').addEventListener('click', () => { const open = $('browse').classList.toggle('open'); $('browse-toggle').setAttribute('aria-expanded', String(open)); if (open) $('search').focus(); });
  document.addEventListener('click', event => {
    const button = event.target.closest('button'); if (!button) return;
    if (button.dataset.select) selectTarget(button.dataset.select, { focusPanel: true });
    else if (button.dataset.deity) showArtworkDetails(button.dataset.deity);
    else if (button.dataset.art) openArtwork(button.dataset.art);
    else if (button.dataset.focus) { focusTarget(byId.get(button.dataset.focus)); if (window.innerWidth <= 700) document.querySelector('.map-section').scrollIntoView({ behavior: 'instant', block: 'start' }); }
    else if (button.hasAttribute('data-close')) clearSelection();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && previewTarget) { event.preventDefault(); dismissedPreviewTarget = previewKey(previewTarget, previewMarker); hideTooltip(); return; }
    if (event.key === 'Escape' && !$('art-dialog').open && !$('about-dialog').open) { closeBrowse(); if (state.selected || state.artworkOnly) { event.preventDefault(); clearSelection(); } }
  });
  $('about-button').addEventListener('click', () => $('about-dialog').showModal());
  $('about-close').addEventListener('click', () => $('about-dialog').close());
  $('art-close').addEventListener('click', () => $('art-dialog').close());
  for (const dialog of [$('art-dialog'), $('about-dialog')]) dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  function restoreHash() {
    let hash; try { hash = decodeURIComponent(location.hash.slice(1)); } catch { hash = ''; }
    if ($('art-dialog').open) $('art-dialog').close();
    if (byId.has(hash)) selectTarget(hash, { push: false });
    else if (hash.startsWith('deity=') && deities.has(hash.slice(6))) openArtwork(hash.slice(6), { push: false });
    else clearSelection({ push: false, restoreFocus: false });
  }
  window.addEventListener('hashchange', restoreHash);
  $('painting').addEventListener('error', () => { $('map-error').hidden = false; $('map-error').textContent = 'The original painting could not load. You can still explore the drawn mandala.'; });
  $('view-toggle').addEventListener('click', () => {
    const painting = $('painting'); const showPainting = !state.painting;
    hideTooltip();
    state.painting = showPainting;
    state.selectedMarker = null;
    painting.style.display = showPainting ? '' : 'none'; $('diagram').style.display = showPainting ? 'none' : '';
    $('view-toggle').textContent = showPainting ? 'Drawn mandala' : 'Original painting';
    $('view-toggle').setAttribute('aria-pressed', String(showPainting));
    makeMarkers();
    renderLayerState();
    applyFilters();
    renderCamera();
  });
  makeMarkers(); renderLayerState(); showWelcome(); applyFilters(); renderCamera(); restoreHash();
  new ResizeObserver(renderCamera).observe(stage);
})();
