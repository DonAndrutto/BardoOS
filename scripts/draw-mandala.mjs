// Architectural reconstruction of the supplied Tsadra / Dzongsar reference.
// Geometry is illustrative. Observed deity marks live in app.js, never in this
// background: turning off an assembly must remove its marks as well as its UI.
import { center } from '../mandala/layout.mjs';
import { drawPalaceScrollwork } from './draw-palace-scrollwork.mjs';

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
  <desc id="desc">A drawn study of the supplied painting: coloured curling fire, a vajra enclosure, blue water and wind bands with eight schematic charnel-ground landscapes, lotus enclosure, four-coloured palace, nested lotus seats and central sanctuary. All four gates repeat the same inward-facing deer and eight-spoked Dharma wheel. Matching parasols flank the upper and lower gates; matching victory banners flank the side gates, following the painting. The landscapes are not identifications of a lineage-specific named set.</desc>
  <defs>
    <clipPath id="charnel-clip"><circle r="1413"/></clipPath>
    <pattern id="cloth" width="9" height="9" patternUnits="userSpaceOnUse"><path d="M0 1H9M1 0V9" stroke="#f6e5b3" stroke-width=".8" opacity=".11"/></pattern>
    <clipPath id="interior-field"><path d="${interiorSector}"/></clipPath>
    <clipPath id="garland-frieze"><path d="${contour(wallBands[2].points)}"/></clipPath>
    <radialGradient id="fire-tint" gradientUnits="userSpaceOnUse" r="1538"><stop offset=".946" stop-color="#633629" stop-opacity=".25"/><stop offset=".976" stop-color="#f1cb99" stop-opacity=".07"/><stop offset="1" stop-color="#fcdfae" stop-opacity=".68"/></radialGradient>
    <radialGradient id="water" gradientUnits="userSpaceOnUse" r="1415"><stop offset=".9" stop-color="#347a9c"/><stop offset=".941" stop-color="#6eb9cd"/><stop offset=".977" stop-color="#498eaf"/><stop offset="1" stop-color="#285d81"/></radialGradient>
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
    <linearGradient id="deer-gold" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#d9c37c"/><stop offset="1" stop-color="#bca15b"/></linearGradient>
    <linearGradient id="saffron-fold" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#e59a60"/><stop offset=".55" stop-color="#d5834e"/><stop offset="1" stop-color="#b9663d"/></linearGradient>
    <g id="deer" fill="url(#deer-gold)" stroke="#6b5939" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
      <!-- A reclining body, folded legs and raised neck; one master at every gate. -->
      <path d="M-157 6Q-165-2-176-1Q-170 9-157 13" fill="#bca15b"/>
      <path d="M-162 25C-169 15-162-5-148-10C-129-18-108-13-92-7C-84-13-83-27-79-44L-77-65C-82-73-76-84-67-84L-57-78L-44-75Q-40-71-48-68L-62-66C-66-47-61-31-63-16C-62 4-72 20-91 28L-136 32Z"/>
      <path d="M-151 25C-164 8-144-8-130-1C-116 5-118 19-129 24L-145 29H-104L-96 34H-159Q-169 31-161 27Z" fill="#c8ad67"/>
      <path d="M-82 4Q-72 15-79 28L-65 29L-60 34H-108Q-116 30-107 27L-96 23L-92 12" fill="#d6bd76"/>
      <path d="M-66-53Q-70-26-72-12Q-77-2-82 2M-141-6Q-117-10-101-1" fill="none" stroke="#ead796" stroke-width="2.6"/>
      <path d="M-72-78Q-90-96-92-83Q-89-73-75-74M-65-80Q-64-92-60-90Q-54-86-62-79" fill="#c9b36d"/>
      <path d="M-83-83L-76-77" fill="none" stroke="#897047"/>
      <path d="M-72-84L-76-102L-82-111M-77-101L-88-104M-74-93L-85-96M-70-85L-66-101L-60-107M-67-98L-61-96" fill="none" stroke-width="1.8"/>
      <path d="M-64-76Q-58-80-54-75" fill="none"/><ellipse cx="-57" cy="-75" rx="1.6" ry="1.9" fill="#342e25" stroke="none"/>
      <path d="M-49-68L-43-71M-64 32H-59M-104 32H-98" fill="none" stroke="#5b4730"/>
    </g>
    <g id="wheel-and-deer">
      <path d="M-38 35L-35-83L-25-104H25L35-83L38 35Z" fill="#bb7353" stroke="#6b5136" stroke-width="3"/>
      <path d="M-26-80H26M-24-72H24M-21-64H21" stroke="#dfb87a" stroke-width="2"/>
      <use href="#deer"/><use href="#deer" transform="scale(-1 1)"/>
      <path d="M-46 30H46L41 44H-41Z" fill="#c45c3a" stroke="#71502e" stroke-width="2"/>
      <path d="M-32 33V41M-16 33V41M0 33V41M16 33V41M32 33V41" stroke="#e9a667" stroke-width="3"/>
      <g transform="translate(0 -20)" fill="${gold}" stroke="#79643d" stroke-width="2.3">
        <circle r="46" fill="#c3a45f"/><circle r="42" fill="#ead594"/><circle r="36" fill="#b89a59"/><circle r="32" fill="#d9c37d"/>
        ${Array.from({length:8},(_,i)=>`<g transform="rotate(${i*45})"><path d="M-3-9L-2-31H2L3-9Z" fill="#f1dda0"/><path d="M0-36V-42" stroke="#f1dda0" stroke-width="2"/></g>`).join('')}
        <circle r="11" fill="#ead699"/><circle r="6" fill="#bb9856"/><circle r="2.8" fill="#eddb9c" stroke="none"/>
      </g>
    </g>
    <g id="parasol" stroke="#775637" stroke-width="2.6" stroke-linejoin="round">
      <path d="M-5 0L-4-151H4L5 0" fill="#c9ab62"/><path d="M-1-5V-143" stroke="#f4dda0" stroke-width="2"/>
      <!-- Saffron fabric spreads out beneath the narrow crown, as in the painting. -->
      <path d="M-76-156C-102-171-122-165-143-169C-168-171-176-150-160-133C-140-112-109-122-93-116Q0-81 93-116C109-122 140-112 160-133C176-150 168-171 143-169C122-165 102-171 76-156Z" fill="url(#saffron-fold)"/>
      <path d="M-145-168C-159-148-150-127-136-124M-114-166C-134-148-121-123-106-120M-79-161C-99-143-89-117-74-113M-40-155C-59-139-48-111-35-107M0-151C-10-137-11-115 0-105M40-155C25-140 29-116 35-107M79-161C63-139 63-123 74-113M114-166C95-146 95-128 106-120M145-168C128-149 126-132 136-124" fill="none"/>
      <path d="M-148-158Q-158-141-143-132M-118-156Q-125-140-112-130M-84-151Q-91-132-78-123M-47-146Q-53-125-40-119M44-146Q37-131 43-119M83-151Q75-137 81-123M118-156Q109-144 115-130" fill="none" stroke="#efb77b" stroke-width="2"/>
      <path d="M-75-113Q0-83 75-113L67-99Q0-76-67-99Z" fill="#c9804d"/>
      <path d="M-66-101Q0-78 66-101M-57-95Q0-76 57-95" fill="none" stroke="#e6bd7c" stroke-width="2"/>
      <path d="M-71-197Q0-182 71-197L79-164Q0-146-79-164Z" fill="#4a90a9"/>
      ${Array.from({length:17},(_,i)=>{const x=-64+i*8;return `<path d="M${x}-191L${x*1.09}-161" fill="none" stroke="${i%2?'#c1d5c9':'#2d6d8b'}" stroke-width="2"/>`;}).join('')}
      <path d="M-78-168Q-68-157-59-164Q-49-151-39-160Q-29-147-19-157Q-9-144 0-154Q9-144 19-157Q29-147 39-160Q49-151 59-164Q68-157 78-168L81-157Q69-150 59-155Q48-143 38-151Q28-139 18-148Q8-137 0-146Q-8-137-18-148Q-28-139-38-151Q-48-143-59-155Q-69-150-81-157Z" fill="#eadfc0" stroke-width="1.6"/>
      <path d="M0-227Q-26-211-60-207L-75-197Q0-178 75-197L60-207Q26-211 0-227Z" fill="#e4dfbf"/>
      <path d="M-59-205Q0-188 59-205M-72-197Q0-178 72-197" fill="none" stroke="#c4a361"/>
      <ellipse cy="-225" rx="13" ry="4" fill="#c0a35d"/>
      <path d="M0-265C-10-254-13-239-5-233L0-229L5-233C13-239 10-254 0-265Z" fill="#dbc17d"/>
      <path d="M0-257Q-6-245-2-237" stroke="#f2de9e" fill="none" stroke-width="2"/>
    </g>
    <g id="victory-banner" stroke="#75583a" stroke-width="2.4" stroke-linejoin="round">
      <path d="M-4 0V-173H4V0" fill="#cbb06b"/><path d="M-1-5V-171" stroke="#eddaa1" stroke-width="2"/>
      <path d="M-42-176Q0-185 42-176L44-146Q0-134-44-146Z" fill="#d7834e"/>
      <path d="M-44-148Q0-137 44-148L49-123Q0-109-49-123Z" fill="#498ca4"/>
      ${Array.from({length:11},(_,i)=>`<path d="M${-38+i*7.6}-142L${-42+i*8.4}-120" stroke="${i%2?'#b4c6b6':'#286b88'}" stroke-width="1.8"/>`).join('')}
      <path d="M-45-124Q0-109 45-124L52-111Q40-109 31-111Q19-103 10-109Q0-100-10-109Q-19-103-31-111Q-40-109-52-111Z" fill="#e5ddbd"/>
      <path d="M-45-110Q0-99 45-110L51-86Q0-73-51-86Z" fill="#bb5743"/>
      <path d="M-51-86Q0-73 51-86L59-59Q0-40-59-59Z" fill="#589b77"/>
      ${Array.from({length:13},(_,i)=>`<path d="M${-46+i*7.67}-80L${-52+i*8.67}-55" stroke="${i%2?'#c6d7b8':'#35775d'}" stroke-width="1.8"/>`).join('')}
      <path d="M-57-61Q0-43 57-61L65-47Q50-41 38-47Q25-37 13-44Q0-34-13-44Q-25-37-38-47Q-50-41-65-47Z" fill="#e7dfc0"/>
      <path d="M0-204L-47-184Q0-170 47-184Z" fill="#e2dfc3"/>
      <path d="M-47-184L-47-177Q0-164 47-177L47-184Q0-172-47-184Z" fill="#d9bc76"/>
      <ellipse cy="-205" rx="9" ry="3" fill="#bf9f59"/>
      <path d="M0-235Q-17-216 0-208Q17-216 0-235Z" fill="#ddc582"/>
    </g>
    <g id="ground-tree" stroke="#395846" stroke-width="2.2" stroke-linejoin="round">
      <path d="M-6 0L-3-35H3L7 0Z" fill="#b18c52"/><path d="M0-11L-17-35M1-20L17-43" stroke="#896f43" fill="none"/>
      <path d="M-27-25Q-35-36-24-44Q-30-54-18-62Q-19-73-7-79Q0-94 8-79Q20-74 18-62Q31-54 24-44Q35-33 27-25Q16-17 0-22Q-15-17-27-25Z" fill="#528865"/>
      ${[[-15,-31],[2,-30],[17,-31],[-17,-46],[-1,-46],[16,-47],[-9,-61],[8,-62],[0,-76]].map(([x,y])=>`<path d="M${x-5} ${y+5}Q${x-9} ${y-2} ${x} ${y-7}Q${x+9} ${y-1} ${x+5} ${y+5}Z" fill="#7da174" stroke-width="1.4"/>`).join('')}
    </g>
    <g id="ground-pool" stroke="#35617a" stroke-width="2" fill="#4d9ec0">
      <path d="M-72-9Q0-29 72-9Q42 2 33 15Q0 21-33 15Q-42 2-72-9Z"/>
      <path d="M-63-8Q0-23 63-8M-47 0Q0-10 47 0M-32 8Q0 3 32 8" fill="none" stroke="#9ecfd5"/>
    </g>
    <g id="ground-accent" stroke="#92573c" stroke-width="2" fill="#db7b46">
      <path d="M-29 10C-48 4-35-10-21-6Q-16-30-3-20Q-1-5 12-9Q29-22 39-15Q15-10 20 1Q10 12-7 7Q-15 19-29 10Z"/>
      <path d="M-25 5Q-14-8-5-3Q6 6 18-2" stroke="#edb473" fill="none"/>
    </g>
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
  const ringPlace=(id,x,y,angle,radius,extra='')=>use(id,`rotate(${angle+x/radius*180/Math.PI}) translate(0 ${-radius+y})`,extra);

  // Feathered tongues and nested curls form the fire band. Each panel meets
  // the same inner and outer boundaries, with a slanted seam in between.
  add('<g id="fire-ring">');
  const firePalette = [
    ['#df9661', '#7a4837'], ['#6eacbf', '#294f6d'],
    ['#d57c65', '#793e38'], ['#89ad85', '#42664f'],
  ];
  for (let i = 0; i < 16; i++) {
    const angle = i * 22.5;
    const [fill, stroke] = firePalette[i % firePalette.length];
    const from = angle - 101.25, to = from + 22.5;
    const panel = `M${point(1456, from)}A1456 1456 0 0 1 ${point(1456, to)}L${point(1538, to + 1.7)}A1538 1538 0 0 0 ${point(1538, from + 1.7)}Z`;
    add(`<path d="${panel}" fill="${fill}" stroke="${stroke}" stroke-width="2.6" data-fire-panel="${i + 1}"/><path d="${panel}" fill="url(#fire-tint)"/>`);
    for (const x of [-190, 0, 190]) {
      ribbonPath(`M${x-83} 0 C${x-116}-24 ${x-61}-48 ${x-23}-48 C${x+30}-52 ${x+105}-29 ${x+79}-7 C${x+59} 9 ${x+14}-2 ${x+20}-20 C${x+24}-31 ${x+51}-29 ${x+56}-19`, angle, 1456, `fill="none" stroke="${stroke}" stroke-width="3"`);
      ribbonPath(`M${x-67}-5 C${x-70}-28 ${x-24}-42 ${x+12}-36`, angle, 1456, 'fill="none" stroke="#f4d2a2" stroke-width="2" opacity=".65"');
    }
    for (let j = 0; j < 11; j++) {
      const x = -232 + j * 49;
      ribbonPath(`M${x+14}-80 C${x+14}-67 ${x-16}-53 ${x-4}-47 C${x+11}-41 ${x+16}-59 ${x+7}-64`, angle, 1456, `fill="none" stroke="${stroke}" stroke-width="2.6"`);
    }
  }
  circle(1538, 'none', '#e3c6a2', 4);
  add('</g><g id="vajra-fence">');
  circle(1455, '#2e2a25', '#9f814d', 3);
  circle(1414, 'none', '#bca16a', 3);
  // Point samples share exactly one start/end point at each turn.
  for (const [r, phase] of [[1447, 0], [1420, Math.PI]]) {
    const wave = Array.from({length: 96 * 8}, (_, i) =>
      point(r + 3.7 * Math.sin(i * Math.PI / 4 + phase), i * 360 / (96 * 8)));
    add(`<path d="M${wave.join('L')}Z" fill="none" stroke="#c7a76b" stroke-width="2.4"/>`);
  }
  for (let i = 0; i < 16; i++) use('vajra', `rotate(${i * 22.5}) translate(0 -1434) scale(1.55 1.15)`, 'data-ring-vajra=""');
  add('</g><g id="charnel-grounds" clip-path="url(#charnel-clip)">');
  circle(1413, 'url(#water)');
  add('<g id="water-wind">');
  for (let i = 0; i < 32; i++) {
    const angle = i * 11.25;
    ribbonPath('M-146 2C-85-24 29-28 146-2C51-16-30-7-87 21Z', angle, 1365, 'fill="#78b8cd" opacity=".62"');
    ribbonPath('M-147 10C-75-10 39-25 145 2M-134 25C-77 13 8 0 88 10', angle, 1365, 'fill="none" stroke="#305e80" stroke-width="2.5" opacity=".9"');
  }
  add('</g>');
  // Eight low landscape sectors: the reference's green hills, striped pools,
  // clustered trees, coloured orbs and orange flame-like accents. The painting
  // supplies their visual vocabulary, but no named-ground key is asserted.
  const groundOrbs=['#375f91','#c56147','#e0cc71','#d8e3d7','#6d9b66','#c25543','#d9d99d','#5d97ac'];
  for(let i=0;i<8;i++){
    const a=i*45,flip=i%2?-1:1;
    add(`<g data-ground="${i+1}">`);
    ribbonPath('M-510 0L-510-98Q-365-134-220-103T65-111T340-106L510-99V0Z'.replace(/V0/,'L510 0'),a,1295,'fill="#b3d0bc" fill-opacity=".38" stroke="none"');
    for(const [y,col] of [[-88,'#4a8eae'],[-68,'#97ccdb'],[-47,'#3d7b9b']]) ribbonPath(`M-510 ${y}Q-395 ${y-22}-279 ${y+3}T-35 ${y-2}T205 ${y+1}T510 ${y-8}`,a,1295,`fill="none" stroke="${col}" stroke-width="3"`);
    const hills=flip===1?'M-510 0Q-464-14-439-40C-410-70-389-95-364-78C-340-70-324-39-302-30Q-276-17-250-14C-211-21-188-116-146-105C-111-106-87-38-41-21C-4-3 31-25 47-49C68-74 87-92 107-71C126-48 138-21 169-17C205-10 221-33 247-66C271-106 289-102 309-75C333-45 355-38 392-27Q449-16 510 0Z':'M-510 0Q-468-10-438-31C-413-50-394-93-369-79C-347-68-329-30-302-23C-269-11-239-37-216-69C-195-101-173-112-153-87C-128-58-108-33-73-21C-34-6-3-27 18-58C47-99 70-115 98-82C123-50 142-27 179-19C216-14 235-35 259-63C288-92 305-79 328-49Q351-23 382-19Q446-5 510 0Z';
    ribbonPath(hills,a,1295,'fill="#92b88d" stroke="#3e5946" stroke-width="3.2"');
    const ridges=flip===1?'M-364-78Q-357-55-326-51M-146-105Q-151-73-117-65Q-93-60-89-45M107-71Q101-43 130-35M289-96Q282-59 320-52':'M-369-79Q-369-51-336-43M-177-103Q-184-71-150-62M70-103Q66-77 94-64Q119-52 118-40M283-78Q279-48 312-38';
    ribbonPath(ridges,a,1295,'fill="none" stroke="#dce0b7" stroke-width="8"');
    ribbonPath(ridges,a,1295,'fill="none" stroke="#56775b" stroke-width="1.8"');
    ringPlace('ground-tree',flip*350,-9,a,1295);
    ringPlace('ground-pool',flip*172,-29,a,1295);
    ringPlace('ground-accent',flip*-281,-65,a,1295);
    const orbAngle=(a-90)+(-flip*145/1295*180/Math.PI),[ox,oy]=point(1365,orbAngle).split(' ');
    add(`<circle cx="${ox}" cy="${oy}" r="11" fill="${groundOrbs[i]}" stroke="#677d5b" stroke-width="2"/>`);
    // Tall orange banks separate the grounds, as in the original blue ring.
    ribbonPath('M-505 0C-553-21-543-69-523-97Q-526-52-498-39Q-477-19-485 0Z',a,1295,'fill="#d47b4c" stroke="#4c5741" stroke-width="3"');
    add('</g>');
  }
  circle(1296,'none','#314e41',4);add('</g><g id="outer-lotus">');circle(1291,'#d17b47');
  for(let i=0;i<64;i++){
    const a=i*5.625,color=i%2?'#4b9870':'#398aa8';
    ribbonPath('M-59 0C-63-24-48-53 0-61C48-53 63-24 59 0Z',a,1230,`fill="${color}" stroke="${ink}" stroke-width="3"`);
    ribbonPath('M-36 0Q-43-35 0-40Q43-35 36 0',a,1230,'fill="#df7d4c" stroke="#484c35" stroke-width="2.5"');
  }
  circle(1230,'#93b99a','#31473d',4);add('</g>');

  // Gate arches, paired parasols and repeated banners radiate from one design.
  for(const [i,dir] of sides.entries()){
    add(`<g data-gate="${dir}" transform="rotate(${i*90})">`);
    add(`<path d="M-245-795V-1007C-245-1200 245-1200 245-1007V-795" fill="none" stroke="#594b36" stroke-width="20"/><path d="M-245-795V-1007C-245-1200 245-1200 245-1007V-795" fill="none" stroke="${['#ce8870','#87ac7d','#b8d4c9','#ddc77d'][i]}" stroke-width="13"/>`);
    for(const sign of [-1,1]){
      add(`<path d="M${sign*255}-876C${sign*340}-927 ${sign*280}-981 ${sign*302}-1034C${sign*260}-1018 ${sign*266}-970 ${sign*239}-952" fill="${['#ce8870','#87ac7d','#b8d4c9','#ddc77d'][i]}" stroke="#594b36" stroke-width="4"/>`);
      // The painting alternates ornaments between gate axes: parasols at
      // top/bottom, banners at the sides. Rotating both through all four gates
      // would superimpose the neighbouring banner on each parasol.
      if(i%2===0){
        use('parasol',`translate(${sign*500} -829)`, 'data-ornament="parasol"');
        use('victory-banner',`translate(${sign*830} -455) rotate(${sign*90}) scale(.86)`, 'data-ornament="victory-banner"');
        add(`<g transform="translate(${sign*830} -570) scale(${sign} 1)" fill="#d58b59" stroke="#72553d" stroke-width="3"><path d="M0 0H108C135 0 131-22 115-44C98-67 108-90 119-109C90-99 78-73 91-51C104-29 96-20 81-23C58-28 65-55 68-78C73-111 56-131 65-151C41-136 35-108 39-85C43-57 38-32 19-29H0Z"/><path d="M81-23C68-11 49-14 33-15M65-137C48-105 65-73 52-46M115-98C96-73 117-44 115-29" fill="none" stroke="#ebc087" stroke-width="3"/></g>`);
      }
    }
    add('</g>');
  }

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
  for(const [i,dir] of sides.entries()){
    add(`<g transform="rotate(${i*90})" data-gate-crown="${dir}">`);
    for(const [y,w,col] of [[-844,244,'#d9bc62'],[-874,211,'#3e8eab'],[-904,182,'#c85b40'],[-934,155,'#38845d']]) add(`<path d="M${-w} ${y}H${w}V${y-30}H${-w}Z" fill="${col}" stroke="#45402f" stroke-width="3"/>`);
    add('<path d="M-100-839Q-133-875-72-888Q-39-958 0-937Q39-958 72-888Q133-875 100-839Z" fill="#26352e" stroke="#de9550" stroke-width="9"/>');
    use('vajra','translate(0 -881) rotate(90) scale(1.2)');
    use('wheel-and-deer','translate(0 -992)', 'data-ornament="wheel-and-deer"');
    // A small tiered finial behind the wheel echoes the original gate crown.
    add('<path d="M-30-1065H30L19-1093H-19ZM-15-1094H15L8-1124H-8Z" fill="#c28b52" stroke="#69502f" stroke-width="3"/><path d="M0-1155Q-18-1134 0-1125Q18-1134 0-1155Z" fill="#e7c67a" stroke="#69502f" stroke-width="3"/>');
    add('</g>');
  }

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
