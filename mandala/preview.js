/* Artwork shown on hover: keep paired depictions together and respect layers. */
(() => {
  const collection = id => id.startsWith('zhiwa.') ? 'peaceful' : 'wrathful';
  function artworksFor(target, bundle, layers, limit = 4) {
    const labels = new Map(bundle.catalog.deities.map(d => [d.id, d.label]));
    const byImage = new Map();
    for (const id of target.candidateDeityIds) {
      if (!layers[collection(id)]) continue;
      const art = bundle.artworkByDeityId[id]?.[0];
      if (!art || byImage.has(art.src)) continue;
      const ids = art.deityIds.filter(key => layers[collection(key)]);
      byImage.set(art.src, { src: art.src, ids, label: ids.map(key => labels.get(key)).join(' and '), collection: collection(id) });
    }
    const all = [...byImage.values()];
    // A shared location should preview both enabled assemblies when present.
    const items = ['peaceful', 'wrathful'].map(name => all.find(item => item.collection === name)).filter(Boolean);
    for (const item of all) if (!items.includes(item)) items.push(item);
    return { items: items.slice(0, limit), total: all.length };
  }
  window.MandalaPreview = { artworksFor };
})();
