import { center, markerLayout } from './mandala-layout.mjs';

const centerLabels = {
  'target-marker-001': 'Ochre central circle',
  'target-marker-002': 'Red central circle',
  'target-marker-003': 'White central circle',
  'target-marker-004': 'Blue central circle',
};

const titleCase = value => value[0].toUpperCase() + value.slice(1);

function locationLabel(target, observations, names) {
  const direction = target.candidateRitualDirection;
  if (target.kind === 'gate-assembly') return `${titleCase(direction)} gate`;
  if (target.kind === 'petal-assembly') return `${titleCase(direction)} · ${target.candidateFamily} family`;
  if (target.group === 'central') return centerLabels[target.id];
  if (target.group === 'six-realm-sages') {
    const { screenPosition } = observations.get(target.observationIds[0]);
    return `${titleCase(screenPosition.replaceAll('-', ' '))} annulus`;
  }
  return target.label.replace(/ \(app label\)$/, '') || names.get(target.candidateDeityIds[0]);
}

function artworkGroups(target) {
  const roles = target.candidateRoles;
  if (target.kind === 'gate-assembly') {
    return [
      { label: 'Peaceful gatekeepers', deityIds: roles.peacefulPair },
      { label: 'Wrathful gatekeeper', deityIds: roles.animalHeadedGatewoman },
    ];
  }
  if (target.kind === 'petal-assembly') {
    return [
      { label: 'Peaceful family', deityIds: roles.peacefulFamily },
      { label: 'Heruka and consort', deityIds: roles.possibleAdditionalWrathfulCouple },
    ];
  }
  return [{ deityIds: target.candidateDeityIds }];
}

export function makeMandalaRuntime({ scene, catalog, artworkByDeityId }) {
  const { width } = scene.image;
  const observations = new Map(scene.observations.map(o => [o.id, o]));
  const names = new Map(catalog.deities.map(d => [d.id, d.label]));
  const selectionTargets = scene.selectionTargets.map(target => ({
    id: target.id,
    label: locationLabel(target, observations, names),
    group: target.group,
    kind: target.designLocation ? 'courtyard-location' : target.kind,
    direction: target.candidateRitualDirection,
    deityIds: target.candidateDeityIds,
    artworkGroups: artworkGroups(target),
    markers: markerLayout(target, observations, width),
    paintingMarkers: markerLayout(target, observations, width, true),
  }));
  const locationsByDeity = Object.fromEntries(Object.entries(scene.deityToCandidateTargets)
    .map(([id, locations]) => [id, locations.map(location => location.targetId)]));
  const artwork = Object.fromEntries(Object.entries(artworkByDeityId)
    .map(([id, entries]) => [id, entries.map(({ src, deityIds }) => ({ src, deityIds }))]));

  return {
    scene: { image: { width, center }, selectionTargets, locationsByDeity },
    catalog: { deities: catalog.deities.map(({ id, label }) => ({ id, label })) },
    artworkByDeityId: artwork,
  };
}
