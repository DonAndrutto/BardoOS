export const palaceSides = ['west', 'north', 'east', 'south'];

const edge = (a, neck, shoulder, head, end) => [
  [-a, -a], [-neck, -a], [-neck, -shoulder], [-head, -shoulder],
  [-head, -end], [head, -end], [head, -shoulder], [neck, -shoulder],
  [neck, -a],
];

function contour(side) {
  const turns = [
    (x, y) => [x, y], (x, y) => [-y, x],
    (x, y) => [-x, -y], (x, y) => [y, -x],
  ];
  return 'M' + turns.flatMap(turn => side.map(([x, y]) => turn(x, y).join(' '))).join('L') + 'Z';
}

const inner = edge(580, 68, 704, 132, 792);
export const palaceInteriorSector = 'M0 0L' + [...inner, [580, -580]].map(p => p.join(' ')).join('L') + 'Z';

const bands = [
  { fill: '#e6e6d8', edge: '#697367', points: edge(841, 258, 841, 258, 869) },
  { fill: '#7abed3', edge: '#567b85', points: edge(806, 245, 806, 245, 867) },
  { fill: '#302e28', edge: '#4d4635', points: edge(774, 218, 774, 218, 866) },
  { fill: '#dfc476', edge: '#7f704a', points: edge(704, 204, 704, 204, 851) },
  { fill: '#cf654d', edge: '#815341', points: edge(669, 183, 805, 183, 845) },
  { fill: '#4c9873', edge: '#466d55', points: edge(606, 96, 730, 158, 821) },
  { fill: '#a45a48', edge: '#5a5040', points: inner },
];

export const palaceWallDefs = `<clipPath id="interior-field"><path d="${palaceInteriorSector}"/></clipPath>
    <clipPath id="red-frieze"><path d="${contour(bands[4].points)} ${contour(bands[5].points)}" fill-rule="evenodd" clip-rule="evenodd"/></clipPath>
    <g id="wall-garland" fill="none" stroke-linecap="round">
      <path d="M-43 1C-42 50 41 50 43 1M-35 1C-34 37 34 37 35 1" stroke="#b9955d" stroke-width="3.3"/>
      <path d="M-45 8C-41 68 42 68 45 8" stroke="#e2c085" stroke-width="5.9" stroke-dasharray=".7 9.2"/>
      <path d="M-51 7C-51 19-53 31-58 39M51 7C51 19 53 31 58 39" stroke="#c7a772" stroke-width="4.8" stroke-dasharray="1 8"/>
      <path d="M-26 17C-22 27-10 32-1 32" stroke="#e9ce99" stroke-width="2.2"/>
    </g>
    <g id="wall-corner-garland" fill="none" stroke-linecap="round">
      <path d="M61 2C60 36 33 60 2 61M50 2C49 28 26 49 2 50" stroke="#b49259" stroke-width="3.6"/>
      <path d="M67 3C64 40 40 65 3 67M40 3Q38 30 3 42" stroke="#d9bd83" stroke-width="5.4" stroke-dasharray="1 9.5"/>
    </g>
    <g id="wall-flower" stroke="#ead095" stroke-width="3.2" fill="none" stroke-linecap="round">
      ${Array.from({ length: 8 }, (_, i) => `<path transform="rotate(${i * 45})" d="M0-5C-10-9-8-17-3-21Q0-26 3-21C8-17 10-9 0-5Z"/>`).join('')}
      <circle r="5.8" fill="#dfbb7b"/>
      <path d="M-20-6Q-31-10-35-1Q-36 8-27 8Q-21 8-23 2M20-6Q31-10 35-1Q36 8 27 8Q21 8 23 2M-16-12Q-26-23-34-16M16-12Q26-23 34-16" stroke="#e8bd80"/>
      <path d="M-37-7L-43-2L-37 2M37-7L43-2L37 2" stroke="#e5c487"/>
    </g>
    <g id="wall-gate-flourish" fill="none" stroke="#edca90" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M-27 4C-35-8-22-19-12-16C-4-14-4-4-11-2Q-16 0-18-6M-18 4C-8-2 6-6 12 3C16 10 10 16 3 12C-2 10 1 5 5 6M-9-9Q0-18 10-14Q18-12 16-6M10 22C25 18 31 7 26-4M17 21Q33 19 35 8"/>
    </g>
    <g id="wall-vajra" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path id="wall-vajra-prongs" d="M7-6Q12-8 14-12L17-8C24-16 35-11 43 0C35 11 24 16 17 8L14 12Q12 8 7 6M13 0Q28-2 43 0M17-8Q18-4 23 0Q18 4 17 8"/>
      <use href="#wall-vajra-prongs" transform="scale(-1 1)"/>
      <ellipse rx="8" ry="9.5" fill="#dca56c"/>
      <circle r="2.7" fill="#f0d499" stroke="none"/>
    </g>`;

export function drawPalaceWallBands({ add, use }) {
  for (const [i, band] of bands.entries()) {
    add(`<path d="${contour(band.points)}" fill="${band.fill}" stroke="${band.edge}" stroke-width="3" stroke-linejoin="miter"/>`);
    if (i === 2) {
      // Each corner has one quarter garland. Straight runs stop before the turn.
      for (let side = 0; side < 4; side++) {
        add(`<g transform="rotate(${side * 90})">`);
        use('wall-corner-garland', 'translate(-768 -768)');
        for (const x of [-637, -516, -395, -274, 274, 395, 516, 637]) {
          use('wall-garland', `translate(${x} -770)`);
        }
        add('</g>');
      }
    }
    if (i === 4) {
      // The pale/red and yellow/green jambs meet the red frieze under the roofs.
      for (const [side, direction] of palaceSides.entries()) {
        const [outer, inner] = side % 2 ? ['#dec379', '#559370'] : ['#e3e4d4', '#cf684f'];
        add(`<g transform="rotate(${side * 90})" data-wall-jamb="${direction}" stroke="#625b48" stroke-width="2.8" stroke-linejoin="miter">`);
        for (const sign of [-1, 1]) {
          add(`<g transform="scale(${sign} 1)"><path d="M230-670V-872H257V-670Z" fill="${outer}"/><path d="M207-670V-872H230V-670Z" fill="${inner}"/><path d="M187-670V-872H207V-670Z" fill="#342e28"/></g>`);
        }
        add('</g>');
      }
    }
  }
}

export function drawPalaceWallOrnaments({ add, use }) {
  add('<g clip-path="url(#red-frieze)">');
  for (const [side, direction] of palaceSides.entries()) {
    add(`<g transform="rotate(${side * 90})">`);
    for (const sign of [-1, 1]) {
      use('wall-flower', `translate(${sign * 367} -638)`);
      use('wall-gate-flourish', `translate(${sign * 121} -637) scale(${sign * .85} .85)`);
    }
    add(`<g transform="translate(-637 -637) rotate(45)" data-corner-vajra="${direction}">`);
    use('wall-vajra', 'scale(1)', 'stroke="#9f6748" stroke-width="6"');
    use('wall-vajra', 'scale(1)', 'stroke="#eccd91" stroke-width="3.7"');
    add('</g></g>');
  }
  add('</g>');
}
