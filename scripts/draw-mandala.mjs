// Architectural reconstruction of the supplied Tsadra / Dzongsar reference.
// Geometry is illustrative. Observed deity marks live in app.js, never in this
// background: turning off an assembly must remove its marks as well as its UI.
import { center } from '../mandala/layout.mjs';
import { drawPalaceScrollwork } from './draw-palace-scrollwork.mjs';
import { drawGateCrown, drawGateSurround, palaceGateDefs } from './draw-palace-gates.mjs';
import { drawProtectiveRings, protectiveRingDefs } from './draw-protective-rings.mjs';

export function drawMandala() {
  const [c, cy] = center;
  const ink = '#37352c', gold = '#dec27c';
  const s = [];
  const add = x => s.push(x);
  const circle = (r, fill, stroke = ink, width = 3) => add(`<circle r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`);
  const point = (r, a) => [r * Math.cos(a * Math.PI / 180), r * Math.sin(a * Math.PI / 180)].map(n => n.toFixed(2)).join(' ');
  const use = (id, transform, extra = '') => add(`<use href="#${id}" transform="${transform}" ${extra}/>`);
  const sides = ['west', 'north', 'east', 'south'];
  const rotatePoint = ([x, y], turns) => [[x, y], [-y, x], [-x, -y], [y, -x]][turns];
  // One side, including its gate return, generates the entire closed contour.
  const edge = (a, neck, shoulder, head, end) => [
    [-a, -a], [-neck, -a], [-neck, -shoulder], [-head, -shoulder],
    [-head, -end], [head, -end], [head, -shoulder], [neck, -shoulder],
    [neck, -a],
  ];
  const contour = side => 'M' + sides.flatMap((_, i) => side.map(p => rotatePoint(p, i).join(' '))).join('L') + 'Z';
  const interior = edge(580, 68, 704, 132, 792);
  const interiorSector = 'M0 0L' + [...interior, [580, -580]].map(p => p.join(' ')).join('L') + 'Z';
  const wallBands = [
    { fill: '#e5e7d8', points: edge(833, 257, 843, 257, 867) },
    { fill: '#6fb6cb', points: edge(807, 234, 843, 234, 865) },
    { fill: '#302d26', points: edge(773, 222, 841, 222, 857) },
    { fill: '#dfc56a', points: edge(701, 204, 831, 204, 850) },
    { fill: '#c65b44', points: edge(668, 183, 808, 183, 845) },
    { fill: '#458f68', points: edge(605, 96, 730, 158, 821) },
    { fill: '#a45a48', points: interior },
  ];
  add(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3179 3179" role="img" aria-labelledby="title desc">
  <title id="title">Four-gated palace of the peaceful and wrathful mandala</title>
  <desc id="desc">A drawn study of the supplied painting: coloured curling fire, a vajra enclosure, blue water and wind bands with eight schematic charnel-ground landscapes, lotus enclosure, four-coloured palace, nested lotus seats and central sanctuary. Low reclining deer flank an eight-spoked Dharma wheel beneath a small canopy at each gate. Wide saffron parasols flank the upper and lower gates, while tiered victory banners and orange streamers flank the side gates. The landscapes are not identifications of a lineage-specific named set.</desc>
  <defs>
    ${protectiveRingDefs}
    <pattern id="cloth" width="9" height="9" patternUnits="userSpaceOnUse"><path d="M0 1H9M1 0V9" stroke="#f6e5b3" stroke-width=".8" opacity=".11"/></pattern>
    <clipPath id="interior-field"><path d="${interiorSector}"/></clipPath>
    <clipPath id="garland-frieze"><path d="${contour(wallBands[2].points)}"/></clipPath>
    <g id="vajra-tip" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4-4H9L12-7V7L9 4H4Z" fill="#bb9452" stroke="#edcf85" stroke-width="1.4"/>
      <path d="M12-5C17-13 26-13 32-1Q24-6 19-3L13-1M12 5C17 13 26 13 32 1Q24 6 19 3L13 1" fill="#c9a460" stroke="#f1d18b" stroke-width="1.4"/>
      <path d="M12 0H33" stroke="#f1d18b" stroke-width="1.6"/>
    </g>
    <g id="vajra">
      <path d="M-35 0H35" stroke="#272a25" stroke-width="4.5" stroke-linecap="round"/>
      <use href="#vajra-tip"/><use href="#vajra-tip" transform="scale(-1 1)"/>
      <ellipse rx="5.5" ry="6.5" fill="#d4ac64" stroke="#f1d18b" stroke-width="1.5"/>
      <path d="M-1-3Q3 0-1 3" fill="none" stroke="#87623b" stroke-width="1.2"/>
    </g>
    <g id="wall-garland" fill="none" stroke="#ddc389" stroke-linecap="round">
      <path d="M-41 0C-40 55 40 55 41 0M-34 0C-33 43 33 43 34 0" stroke-width="2.8"/>
      <path d="M-46 0C-45 72 45 72 46 0" stroke-width="4.8" stroke-dasharray="1 8"/>
      <path d="M-47 4l6 5m82 0 6-5M0 55v8" stroke-width="3.4"/>
      <circle cy="60" r="2.7" fill="#e9d19b"/>
    </g>
    <g id="wall-flower" fill="none" stroke="#eac787" stroke-width="2.4">
      ${Array.from({length: 8}, (_, i) => `<path transform="rotate(${i * 45})" d="M0-4C-13-11-11-23 0-22C11-23 13-11 0-4Z"/>`).join('')}
      <circle r="5" fill="#eac787"/>
      <path d="M-12 0C-28-16-48-14-46-5C-45 1-37 0-37-4M-12 0C-28 16-48 14-46 5C-45-1-37 0-37 4M12 0C28-16 48-14 46-5C45 1 37 0 37-4M12 0C28 16 48 14 46 5C45-1 37 0 37 4"/>
    </g>
    <g id="wall-corner" fill="none" stroke="#eac787" stroke-width="2.6">
      <path d="M-23 14C-32 0-26-12-17-10C-8-8-9 6-18 5M-20-7C-22-20-9-24-4-16C0-9-5-2-12-4M-7-17C4-30 21-27 22-17C22-10 12-6 9-12M-21 16C-17 28 2 25 3 15C4 9-5 7-8 11M1 20C12 23 20 15 16 9C12 3 3 6 3 13M17 12L23 4M-14-22L-25-25"/>
    </g>
    ${palaceGateDefs}
  </defs>
  <rect width="3179" height="3179" fill="#263d56"/>
  <g transform="translate(${c} ${cy})" stroke-linejoin="round" stroke-linecap="round">`);

  // Project decorative ribbons onto the circle. This keeps hills and scrolls
  // inside their own annulus without stretching/clipping a rectangular vignette.
  const ribbon = (d, angle, radius) => {
    const tokens=d.match(/[MLCQTZ]|-?(?:\d*\.)?\d+/g);let out='';
    for(let i=0;i<tokens.length;){
      if(/[MLCQTZ]/.test(tokens[i])) {out+=tokens[i++]+' ';continue;}
      const x=Number(tokens[i++]),y=Number(tokens[i++]);
      const a=(angle-90)*Math.PI/180+x/radius,r=radius-y;
      out+=`${(r*Math.cos(a)).toFixed(2)} ${(r*Math.sin(a)).toFixed(2)} `;
    }
    return out;
  };
  const ribbonPath=(d,angle,radius,attrs)=>add(`<path d="${ribbon(d,angle,radius)}" ${attrs}/>`);
  const ringPlace = (id, x, y, angle, radius, transform = '') => use(
    id, `rotate(${angle + x / radius * 180 / Math.PI}) translate(0 ${-radius + y}) ${transform}`,
  );

  drawProtectiveRings({ add, circle, point, use, ribbonPath, ringPlace });

  for (const [i, dir] of sides.entries()) drawGateSurround(dir, i * 90, { add, use });

  add('<g id="palace-walls">');
  for (const [index, { fill, points }] of wallBands.entries()) {
    add(`<path d="${contour(points)}" fill="${fill}" stroke="#413a2c" stroke-width="3"/>`);
    if (index !== 2) continue;
    add('<g clip-path="url(#garland-frieze)">');
    for (let side = 0; side < 4; side++) {
      add(`<g transform="rotate(${side * 90})">`);
      for (const x of [-734, -625, -516, -407, -298, 298, 407, 516, 625, 734]) {
        use('wall-garland', `translate(${x} -773)`);
      }
      add('</g>');
    }
    add('</g>');
  }
  for (const [side, direction] of sides.entries()) {
    add(drawPalaceScrollwork(direction, side * 90, interiorSector));
  }
  add(`<path d="${contour(interior)}M-580-580L580 580M580-580L-580 580" fill="none" stroke="#493e32" stroke-width="2.4"/>`);
  for (let side = 0; side < 4; side++) {
    add(`<g transform="rotate(${side * 90})">`);
    for (const x of [-366, 366]) use('wall-flower', `translate(${x} -640)`);
    for (const sign of [-1, 1]) {
      use('wall-corner', `translate(${sign * 638} -639) scale(${sign * .82} .82)`);
      use('wall-corner', `translate(${sign * 119} -637) scale(${sign * .74} .74)`);
    }
    add('</g>');
  }
  add('</g>');
  for (const [i, dir] of sides.entries()) drawGateCrown(dir, i * 90, { add, use });

  add('<g id="inner-lotuses">');
  circle(519,'#293f33',gold,5);
  for(let i=0;i<64;i++) use('vajra',`rotate(${i*5.625}) translate(0 -508) scale(.48 .52)`);
  circle(498,'#388f6b');
  const petals=(inner,outer,n,color)=>{
    for(let i=0;i<n;i++) add(`<path transform="rotate(${i*360/n})" d="M${point(inner,-90-180/n)} Q${point(outer+35,-90-180/n)} ${point(outer,-90)} Q${point(outer+35,-90+180/n)} ${point(inner,-90+180/n)} A${inner} ${inner} 0 0 0 ${point(inner,-90-180/n)}Z" fill="${typeof color==='function'?color(i):color}" stroke="#343b2c" stroke-width="3"/>`);
  };
  petals(437,497,8,'#4b9c70');circle(442,'#bb6047');circle(428,'#dc813d');
  petals(342,427,8,'#dc813d');circle(341,'#bd5b44');circle(327,'#3f9b72');
  petals(245,327,8,'#429e73');circle(247,'#d18642');circle(227,'#d3c36f');
  // The painting's four large green/blue petals are deliberately preserved;
  // directional family colours belong to the square palace fields outside.
  for(let i=0;i<4;i++) add(`<path transform="rotate(${i*90})" d="M-58-96C-111-124-132-182-95-209C-60-234 60-234 95-209C132-182 111-124 58-96Z" fill="${i%2?'#2d83a2':'#39956b'}" stroke="#343b2c" stroke-width="4"/>`);
  circle(121,'#d38543');circle(103,'#e1dfba','#74512e',4);
  add('</g><circle r="1538" fill="url(#cloth)" pointer-events="none"/></g></svg>');
  return s.join('\n');
}
