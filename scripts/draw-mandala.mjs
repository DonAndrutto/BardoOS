// Architectural reconstruction of the supplied Tsadra / Dzongsar reference.
// Geometry is illustrative. Observed deity marks live in app.js, never in this
// background: turning off an assembly must remove its marks as well as its UI.
import { center } from './mandala-layout.mjs';
import { drawInnerLotus, innerLotusDefs } from './draw-inner-lotus.mjs';
import { drawPalaceScrollwork } from './draw-palace-scrollwork.mjs';
import { drawPalaceWallBands, drawPalaceWallOrnaments, palaceInteriorSector, palaceSides, palaceWallDefs } from './draw-palace-walls.mjs';
import { drawGateCrown, drawGateSurround, palaceGateDefs } from './draw-palace-gates.mjs';
import { drawProtectiveRings, protectiveRingDefs } from './draw-protective-rings.mjs';

export function drawMandala() {
  const [c, cy] = center;
  const ink = '#37352c';
  const s = [];
  const add = x => s.push(x);
  const circle = (r, fill, stroke = ink, width = 3) => add(`<circle r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`);
  const point = (r, a) => [r * Math.cos(a * Math.PI / 180), r * Math.sin(a * Math.PI / 180)].map(n => n.toFixed(2)).join(' ');
  const use = (id, transform, extra = '') => add(`<use href="#${id}" transform="${transform}" ${extra}/>`);
  add(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3179 3179" role="img" aria-labelledby="title desc">
  <title id="title">Four-gated palace of the peaceful and wrathful mandala</title>
  <desc id="desc">A drawn study of the supplied painting: coloured fire, a vajra enclosure, blue water and wind bands, charnel grounds, lotus enclosures and the four-gated palace with gold vajras at its corners. Low reclining deer flank an eight-spoked Dharma wheel beneath a small canopy at each gate. Wide saffron parasols flank the upper and lower gates, while tiered victory banners and orange streamers flank the side gates.</desc>
  <defs>
    ${protectiveRingDefs}
    <pattern id="cloth" width="9" height="9" patternUnits="userSpaceOnUse"><path d="M0 1H9M1 0V9" stroke="#f6e5b3" stroke-width=".8" opacity=".11"/></pattern>
    ${innerLotusDefs}
    ${palaceWallDefs}
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

  for (const [i, dir] of palaceSides.entries()) drawGateSurround(dir, i * 90, { add, use });

  add('<g id="palace-walls">');
  drawPalaceWallBands({ add, use });
  for (const [side, direction] of palaceSides.entries()) {
    add(drawPalaceScrollwork(direction, side * 90, palaceInteriorSector));
  }
  drawPalaceWallOrnaments({ add, use });
  add('</g>');
  for (const [i, dir] of palaceSides.entries()) drawGateCrown(dir, i * 90, { add, use });

  drawInnerLotus({ add, circle, use });
  add('<circle r="1538" fill="url(#cloth)" pointer-events="none"/></g></svg>');
  return s.join('\n');
}
