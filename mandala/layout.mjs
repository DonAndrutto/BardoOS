// Display geometry for the SVG atlas. The painting's measured observations
// stay in the research data and are used when viewing the original.
export const center = [1605, 1567];

const directionAngle = {
  west: 0, northwest: 45, north: 90, northeast: 135,
  east: 180, southeast: 225, south: 270, southwest: 315,
};

const central = {
  'target-marker-001': -69,
  'target-marker-002': -23,
  'target-marker-003': 23,
  'target-marker-004': 69,
};

const eastColors = [
  'rgb(194,216,219)', 'rgb(38,64,93)', 'rgb(172,204,217)',
  'rgb(223,248,236)', 'rgb(234,253,250)', 'rgb(197,233,218)',
];

export function markerLayout(target, observations, size, painting = false) {
  const colorOf = o => `rgb(${(o.approximateMedianRgb || [180, 160, 100]).join(',')})`;
  const circles = target.observationIds.map(id => observations.get(id))
    .filter(o => o.observationalStatus === 'observed-circle');

  if (target.designLocation) {
    const { x, y } = target.designLocation;
    return [{ x: x * size, y: y * size, radius: 26, color: target.displayColor, editorial: true }];
  }
  if (painting) {
    return circles.map(o => ({
      x: o.x * size, y: o.y * size, radius: o.approximateVisibleOutlineRadiusPixels || 18,
      color: colorOf(o),
    }));
  }

  const fromCenter = (x, y, radius, color) => ({
    x: center[0] + x, y: center[1] + y, radius, color,
  });
  const angle = (directionAngle[target.candidateRitualDirection] ?? 0) * Math.PI / 180;
  const rotate = (x, y, radius, color) => fromCenter(
    Math.round(x * Math.cos(angle) - y * Math.sin(angle)),
    Math.round(x * Math.sin(angle) + y * Math.cos(angle)),
    radius, color,
  );

  if (target.kind === 'petal-assembly') {
    const colors = target.candidateRitualDirection === 'east' ? eastColors : circles.map(colorOf);
    return [[0, -138], [0, -158], [0, -178], [0, -198], [-39, -168], [39, -168]]
      .map(([x, y], i) => rotate(x, y, 8, colors[i]));
  }
  if (target.kind === 'gate-assembly') {
    return circles.map((o, i) => rotate(0, -[550, 605][i], 15, colorOf(o)));
  }
  if (target.group === 'central') return [fromCenter(0, central[target.id], 13, colorOf(circles[0]))];

  const radius = { gauris: 270, pisacis: 367 }[target.group];
  if (radius) return [rotate(0, -radius, 15, colorOf(circles[0]))];
  // The six annular seats form a mirror-symmetric array around the axis.
  const sageAngle = {
    'target-marker-025': -60, 'target-marker-009': 0, 'target-marker-010': 60,
    'target-marker-026': 120, 'target-marker-027': 180, 'target-marker-028': 240,
  }[target.id] * Math.PI / 180;
  return [fromCenter(469 * Math.cos(sageAngle), 469 * Math.sin(sageAngle), 15, colorOf(circles[0]))];
}
