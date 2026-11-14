// The eight 45° sectors start above the palace and proceed clockwise.
// Profiles and feature positions come from the unwrapped reference painting.
const landscapes = [
  {
    hills: 'M-428-4Q-408-56-369-43C-336-43-335-64-311-72C-273-87-255-64-232-40Q-181-13-118-3M-116-3C-79-17-59-45-29-60C1-86 34-78 59-59C88-36 124-14 164-5M185-3Q221-22 246-42C279-75 305-77 328-56C361-30 370-12 427-6',
    ridge: 'M-377-35Q-341-49-321-62M-284-67Q-258-45-226-38M-66-31Q-39-44-20-66M70-49Q95-34 113-31M257-45Q278-53 287-69M339-47Q362-38 378-34',
    pool: [-160, -10, .96], tree: [176, -5, 1.03], orbs: [[-157,-47,'#6f9b70'], [8,-53,'#285e8b']],
  },
  {
    hills: 'M-428-5C-422-34-411-63-386-70C-350-81-328-53-313-35Q-284-14-246-4M-244-4C-203-16-181-41-151-59C-120-83-90-81-62-60C-36-38-12-24 24-10L71-4M116-4Q179-16 211-45C238-73 260-78 289-63C312-48 320-26 350-21Q383-10 425-5',
    ridge: 'M-371-59Q-351-53-329-32M-202-25Q-174-31-155-54M-82-56Q-62-51-53-35M220-45Q241-49 258-64M300-49Q319-41 346-37',
    pool: [-270, -10, .83], tree: [68, -5, 1], flame: [354, -24, -.9], cloud: [-47,-63,.82],
    orbs: [[-275,-50,'#be6548'], [-81,-29,'#9bbf88']],
  },
  {
    hills: 'M-430-9C-433-34-419-60-390-69C-369-70-350-58-325-42Q-278-8-242-4M-246-4C-203-16-178-34-142-38C-107-41-100-57-74-66C-28-88 20-69 43-52Q77-27 108-17L145-4M176-4Q217-24 259-37C288-51 301-63 322-70C349-81 373-65 389-48Q410-28 427-30L432-4',
    ridge: 'M-394-62Q-368-58-349-48M-118-39Q-100-38-89-52M-14-66Q20-62 41-44M249-31Q271-28 297-49M350-65Q367-53 393-45',
    pool: [-218, -9, .86], tree: [147, -3, 1.10], flame: [-317, -39, 1.04], cloud: [15,-62,1.01],
    orbs: [[-210,-42,'#deebe1'], [333,-46,'#51977a']],
  },
  {
    hills: 'M-425-5Q-378-12-340-36C-311-57-295-71-269-77C-237-86-211-70-193-47C-178-27-153-14-112-3M-107-3C-64-13-45-36-13-60C13-82 45-86 73-62C100-39 135-20 169-12L230-3M252-3Q281-22 306-41C335-63 371-79 399-65C415-56 425-32 432-12L421-4',
    ridge: 'M-342-29Q-323-41-303-45M-235-62Q-221-36-189-30M-52-28Q-27-34-14-54M67-50Q90-42 104-31M288-31Q308-48 322-49',
    pool: [-117, -9, 1], tree: [248, -7, .94], cloud: [-324, -52, -.8], orbs: [[-106,-55,'#cf5343']],
  },
  {
    hills: 'M-425-8C-433-35-424-60-407-72C-384-75-360-64-331-43C-299-22-257-9-230-4M-286-4C-233-24-218-40-185-42C-160-45-150-66-121-74C-92-83-63-69-44-51C-27-35 4-14 36-5M33-5C65-17 87-31 113-49C137-68 158-82 182-75C209-68 222-48 252-30Q298-14 315-4M298-4C320-23 331-49 350-63C379-87 402-65 413-52L429-33L425-6',
    ridge: 'M-416-57Q-381-72-349-51M-214-28Q-182-33-169-55M-112-67Q-85-59-71-48M86-32Q116-32 132-57M199-64Q222-50 242-44M320-25Q340-37 351-51M378-68Q396-63 405-48',
    pool: [-6, -10, 1.13], tree: [-312, -16, .98], flame: [-99,-52,1.05], cloud: [328,-59,-.92],
    orbs: [[2,-77,'#e0ebe0']],
  },
  {
    hills: 'M-427-5C-432-32-421-63-397-73C-367-83-341-54-322-38Q-289-14-247-3M-251-3Q-204-22-178-44C-150-69-132-82-109-77C-82-73-63-51-43-39Q-2-15 32-8L97-3M98-3Q159-12 189-35C211-53 225-71 253-75C288-81 310-59 319-35Q332-16 364-5',
    ridge: 'M-399-65Q-383-65-367-50M-196-31Q-174-33-157-59M-92-67Q-71-50-58-47M182-28Q203-36 218-48M285-60Q295-43 302-30',
    pool: [-251, -10, .86], tree: [58, -4, .97], flame: [-72,-55,1.17], cloud: [298,-56,1],
    orbs: [[-260,-66,'#7db085'], [-121,-39,'#d9c479']],
  },
  {
    hills: 'M-429-6C-434-30-425-54-403-60C-377-59-350-44-320-33Q-266-13-218-5M-187-5Q-129-16-95-34C-70-46-51-47-33-62C-10-83 15-78 35-64C53-49 67-33 103-24L163-6M164-4Q205-28 250-41C279-50 293-75 323-74C345-76 359-61 372-41Q390-18 424-9',
    ridge: 'M-387-52Q-359-38-333-37M-115-27Q-79-35-59-49M13-66Q38-63 50-49M240-34Q271-39 291-54M333-63Q344-52 349-42',
    pool: [134,-9,1.24], tree: [-212,-6,1.04], flame: [-353,-40,1.29], cloud: [331,-51,1.14],
    orbs: [[-4,-46,'#c75944'], [132,-71,'#dce7da']],
  },
  {
    hills: 'M-424-6C-430-34-420-64-397-74C-375-78-358-60-337-43Q-304-18-245-5M-215-4Q-172-12-134-33C-106-47-78-42-59-60C-40-77-12-85 13-68C39-51 55-35 92-23Q126-13 159-4M172-4Q221-24 246-44C269-59 277-79 300-78C330-76 340-52 359-40Q391-22 424-13L425-4',
    ridge: 'M-408-65Q-390-59-371-52M-116-29Q-88-30-73-49M-8-67Q16-61 38-47M231-33Q253-37 271-56M325-62Q336-50 348-45',
    pool: [142,-12,1.13], tree: [-207,-4,.93], flame: [-319,-38,1.12], cloud: [353,-53,1.07],
    orbs: [[132,-68,'#d9c37d']],
  },
];

export const protectiveRingDefs = `<clipPath id="charnel-clip"><circle r="1399"/></clipPath>
    <clipPath id="fire-clip"><circle r="1538"/></clipPath>
    <radialGradient id="fire-tint" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1538">
      <stop offset=".93" stop-color="#5d3828" stop-opacity=".08"/>
      <stop offset=".963" stop-color="#eab67f" stop-opacity=".04"/>
      <stop offset=".985" stop-color="#f2d6ac" stop-opacity=".40"/>
      <stop offset=".995" stop-color="#f8dfb7" stop-opacity=".67"/>
      <stop offset="1" stop-color="#f3ddb3" stop-opacity=".8"/>
    </radialGradient>
    <radialGradient id="water-ground" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1400">
      <stop offset=".92" stop-color="#478ead"/>
      <stop offset=".97" stop-color="#4b9bbf"/>
      <stop offset=".993" stop-color="#367ca4"/>
      <stop offset="1" stop-color="#285577"/>
    </radialGradient>
    <radialGradient id="landscape-sky" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1400">
      <stop offset=".926" stop-color="#e0dfba"/>
      <stop offset=".948" stop-color="#e0dfba"/>
      <stop offset=".978" stop-color="#8fc3c9"/>
      <stop offset="1" stop-color="#478eae"/>
    </radialGradient>
    <radialGradient id="landscape-hills" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1399">
      <stop offset=".92" stop-color="#84a87c"/>
      <stop offset=".955" stop-color="#afc59b"/>
      <stop offset=".983" stop-color="#cfdbb7"/>
    </radialGradient>
    <g id="fence-vajra" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path id="fence-jaws" d="M10-12C17-11 20-16 25-19L29-11C37-20 50-21 59-15C65-11 67-4 75 0C67 4 65 11 59 15C50 21 37 20 29 11L25 19C20 16 17 11 10 12M26 0C43-2 61 1 75 0M23-15C25-9 25 9 23 15"/>
      <use href="#fence-jaws" transform="scale(-1 1)"/>
      <path d="M-13-11Q0-16 13-11Q19 0 13 11Q0 16-13 11Q-19 0-13-11Z"/>
    </g>
    <g id="fence-link" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M-20 0C-12-21 12-21 20 0C12 21-12 21-20 0ZM-20 0C-27-15-39-12-47 0C-39 12-27 15-20 0ZM20 0C27-15 39-12 47 0C39 12 27 15 20 0Z"/>
    </g>
    <g id="ground-tree" stroke="#365848" stroke-width="2.8" stroke-linejoin="round">
      <path d="M-10 0L-5-31H4L12 0Q0-5-10 0Z" fill="#ac8e52"/>
      <path d="M-34-12Q-40-22-27-28Q-34-39-20-44Q-21-53-9-57Q-2-76 10-62Q22-57 19-47Q34-45 28-34Q43-26 33-15Q28-8 17-11Q7-4-1-11Q-14-4-20-13Q-28-6-34-12Z" fill="#58856a"/>
      ${[[-22,-21],[-2,-19],[22,-22],[-14,-35],[7,-35],[18,-46],[-6,-48],[3,-60]].map(([x,y]) => `<path d="M${x-8} ${y+3}Q${x-7} ${y-8} ${x} ${y-7}Q${x+8} ${y-7} ${x+8} ${y+3}Q${x} ${y+9} ${x-8} ${y+3}Z" fill="#7da889" stroke-width="2.1"/>`).join('')}
    </g>
    <g id="ground-pool" stroke="#376b86" stroke-width="2.5">
      <path d="M-82-17Q-58-36 0-34Q53-35 82-19Q59-12 34 2Q0 9-32 6Q-65 3-82-17Z" fill="#4e9cbc"/>
      <path d="M-77-16Q-27-29 27-26Q55-25 77-16M-63-7Q-12-21 61-8M-37 0Q-5-8 30-3" fill="none" stroke="#9dc9d3"/>
      <path d="M-66-13Q-15-25 59-16M-48-4Q-3-15 42-7" fill="none"/>
    </g>
    <g id="ground-flame" stroke="#885137" stroke-width="2.7" stroke-linejoin="round">
      <path d="M-50 3Q-58-12-39-12Q-28-18-17-11C-30-28-8-37 11-35Q27-34 38-49Q42-30 25-22C45-25 47-13 67-24Q57-5 27-5Q26 2 8 1Q-18 15-50 3Z" fill="#df8b52"/>
      <path d="M-44 1Q-32-10-14-4Q-3-4 2-15Q8-9 23-12M10-26Q24-29 28-34" fill="none" stroke="#f2b375" stroke-width="3"/>
    </g>
    <g id="ground-cloud" fill="#bbc79c" stroke="#4c6854" stroke-width="2.7">
      <path d="M-63-5C-61-17-40-24-29-18Q-16-33 4-23Q23-28 32-15C65-20 71 3 52 9Q38 13 28 8Q12 18-3 10C-29 11-37 8-47 5Z"/>
      <path d="M-29-10Q-12-15-1-5Q11 1 28-4M35-8Q49-10 57-3" fill="none"/>
    </g>`;

function drawFire({ add, circle, point, ribbonPath }) {
  const outer = 1538, inner = 1433;
  const panelColors = [
    ['#d8785c', '#873e32'], ['#88ad85', '#41664e'],
    ['#e19357', '#8f4b30'], ['#6dacbf', '#355e76'],
  ];
  add('<g id="fire-ring">');
  for (let i = 0; i < 16; i++) {
    const from = i * 22.5 - 90;
    const start = from - 2.55, end = start + 22.5;
    // Painted seams and the upper flame strokes lean consistently clockwise.
    const panel = `M${point(inner, start)}A${inner} ${inner} 0 0 1 ${point(inner, end)}L${point(outer, end + 2.7)}A${outer} ${outer} 0 0 0 ${point(outer, start + 2.7)}Z`;
    const [fill, ink] = panelColors[i % panelColors.length];
    add(`<path d="${panel}" fill="${fill}" stroke="${ink}" stroke-width="3.2" data-fire-panel="${i + 1}"/>`);
  }
  circle(outer, 'url(#fire-tint)', 'none');
  add('<g clip-path="url(#fire-clip)">');
  for (let i = 0; i < 16; i++) {
    const angle = (i + .5) * 22.5;
    const [, ink] = panelColors[i % panelColors.length];
    const line = `fill="none" stroke="${ink}"`;
    ribbonPath('M-272 2C-310-20-295-46-271-59Q-252-68-254-77', angle, inner, `${line} stroke-width="4.6"`);
    ribbonPath('M-43 2C-80-10-85-40-57-60Q-38-72-34-80', angle, inner, `${line} stroke-width="4.3"`);
    ribbonPath('M-260 0C-294-6-300-30-264-42C-232-53-173-49-134-36C-101-25-94-8-114 2M-244-13C-241-21-209-29-183-22C-165-16-166-8-182-6', angle, inner, `${line} stroke-width="4.8"`);
    ribbonPath('M-30 1C-60-17-38-42 12-49C72-57 139-45 163-28C186-13 168 2 146 3M71-14C78-25 117-26 132-18Q143-12 136-7', angle, inner, `${line} stroke-width="4.8"`);
    ribbonPath('M-265-32Q-210-51-143-31M-28-31Q52-56 142-34', angle, inner, 'fill="none" stroke="#f4cf9c" stroke-opacity=".55" stroke-width="2.6"');
    // Ten swept tongues, each with a dark teardrop and a small light center.
    for (let j = 0; j < 10; j++) {
      const x = -263 + j * 55;
      const loop = j % 3;
      ribbonPath(`M${x+36} -108C${x+26} -96 ${x+9} -88 ${x+3} -82C${x+14} -77 ${x+7} -65 ${x-4} ${-63-loop}C${x-16} -62 ${x-19} -71 ${x-10} -79C${x-1} -87 ${x+18} -99 ${x+25} -108Z`, angle, inner, `fill="${ink}" data-fire-tongue=""`);
      ribbonPath(`M${x-7} -69Q${x-14} -73 ${x-2} -79Q${x+5} -74 ${x-7} -69Z`, angle, inner, 'fill="#f4dcb1" fill-opacity=".92"');
    }
  }
  add('</g>');
  circle(outer, 'none', '#e2cfaa', 3);
  add('</g>');
}

function drawVajraFence({ add, circle, point, use }) {
  const middle = 1416;
  add('<g id="vajra-fence">');
  circle(1434, '#292728', '#584a3a', 3.5);
  circle(1400, 'none', '#3d3029', 2.5);
  // One repeating strand crosses both kinds of fitting on the same tangent.
  // A darker under-stroke gives the gold strand definition on the black band.
  const samples = 144 * 6;
  const strand = Array.from({ length: samples }, (_, i) =>
    point(middle + 2.7 * Math.sin(i * Math.PI / 3), i / samples * 360 - 90));
  const path = `M${strand.join('L')}Z`;
  add(`<defs><path id="fence-strand" d="${path}"/></defs><g fill="none"><use href="#fence-strand" stroke="#8e774d" stroke-width="6.2"/><use href="#fence-strand" stroke="#dfc382" stroke-width="2.8"/></g>`);
  for (let i = 0; i < 16; i++) {
    const linked = i % 2 !== 0;
    const symbol = linked ? 'fence-link' : 'fence-vajra';
    const transform = `rotate(${i * 22.5}) translate(0 -${middle})`;
    add(`<g transform="${transform}" data-ring-position="${i * 22.5}">`);
    add(`<rect x="${linked ? -39 : -66}" y="-16" width="${linked ? 78 : 132}" height="32" rx="10" fill="#292728"/>`);
    use(symbol, 'scale(1 .93)', 'stroke="#6f583a" stroke-width="7"');
    use(symbol, 'scale(1 .93)', `stroke="#ecd39a" stroke-width="4.1" data-${linked ? 'ring-link' : 'ring-vajra'}=""`);
    add('</g>');
  }
  add('</g>');
}

// At the window ends, two rows of long blue crests interleave across the
// gap between crescent-shaped borders. Their tapered tips follow the flow
// of the painting's intervening water and wind ribbons.
function drawWaterAndWind({ add, circle, ribbonPath }) {
  circle(1399, 'url(#water-ground)', 'none');
  add('<g id="water-wind">');
  for (let i = 0; i < 8; i++) {
    const angle = 22.5 + i * 45;
    const waves = [
      ['#579ebe', 'M-136-107C-91-104-75-77-26-63C16-51 67-57 138-88C111-56 67-32 10-40C-48-48-98-79-136-88Z'],
      ['#69aec9', 'M-136-74C-85-71-59-40-9-29C35-19 85-27 137-62C95-18 50-10 0-13C-50-18-89-48-136-49Z'],
      ['#4c99ba', 'M-132-41C-87-38-61-16-16-8C31 0 85-11 139-38C103-10 48 3-2 6C-57 9-94-17-133-18Z'],
      ['#83c1d5', 'M-136-97C-102-99-62-96-25-88C22-79 71-79 135-101C100-83 67-70 25-73C-34-76-82-92-136-88Z'],
    ];
    add(`<g data-water-gap="${i + 1}">`);
    for (const [fill, path] of waves) {
      ribbonPath(path, angle, 1293, `fill="${fill}" stroke="#3a7898" stroke-width="2.2"`);
    }
    ribbonPath('M-113-58C-69-51-35-22 19-23Q63-22 110-43M-84-89C-46-89-9-73 30-70Q67-69 115-87', angle, 1293, 'fill="none" stroke="#9bc8cf" stroke-opacity=".75" stroke-width="2.4"');
    add('</g>');
  }
  add('</g>');
}

function drawLandscapes({ add, ribbonPath, ringPlace, point }) {
  const radius = 1293;
  const edge = 'M-427 1C-469-22-474-70-434-103C-310-103-153-104 0-104C153-104 310-103 434-103C474-70 469-22 427 1Z';
  const border = 'M-426 1C-468-18-476-61-433-101L-411-106C-452-69-450-26-408-3Z';
  const rightBorder = 'M426 1C468-18 476-61 433-101L411-106C452-69 450-26 408-3Z';
  for (const [i, scene] of landscapes.entries()) {
    const angle = i * 45;
    add(`<g data-ground="${i + 1}">`);
    ribbonPath(edge, angle, radius, 'fill="url(#landscape-sky)"');
    if (scene.cloud) {
      const [x, y, scale] = scene.cloud;
      ringPlace('ground-cloud', x, y, angle, radius, `scale(${scale} ${Math.abs(scale)})`);
    }
    const [poolX, poolY, poolScale] = scene.pool;
    ringPlace('ground-pool', poolX, poolY, angle, radius, `scale(${poolScale} 1)`);
    if (scene.flame) {
      const [x, y, scale] = scene.flame;
      ringPlace('ground-flame', x, y, angle, radius, `scale(${scale} ${Math.abs(scale)})`);
    }
    // Hills are open contours. Close each one along the shared baseline for
    // the fill only so there are no dark diagonal joins across the water.
    for (const outline of scene.hills.slice(1).split('M')) {
      const coordinates = outline.match(/-?\d+/g);
      const left = coordinates[0], right = coordinates.at(-2);
      ribbonPath(`M${outline}L${right} 3L${left} 3Z`, angle, radius, 'fill="url(#landscape-hills)"');
      ribbonPath(`M${outline}`, angle, radius, 'fill="none" stroke="#466255" stroke-width="3.8"');
    }
    ribbonPath(scene.ridge, angle, radius, 'fill="none" stroke="#577261" stroke-width="3.2"');
    const [treeX, treeY, treeScale] = scene.tree;
    ringPlace('ground-tree', treeX, treeY, angle, radius, `scale(${treeScale})`);
    for (const [x, y, color] of scene.orbs) {
      const [cx, cy] = point(radius - y, angle - 90 + x / radius * 180 / Math.PI).split(' ');
      add(`<ellipse cx="${cx}" cy="${cy}" rx="14" ry="12" transform="rotate(${angle + x / radius * 180 / Math.PI} ${cx} ${cy})" fill="${color}" stroke="#4f6d5d" stroke-width="2.7"/>`);
    }
    for (const side of [border, rightBorder]) {
      ribbonPath(side, angle, radius, 'fill="#d88048" stroke="#794f3c" stroke-width="4.3"');
    }
    ribbonPath('M-429-9C-460-39-452-72-434-91M429-9C460-39 452-72 434-91', angle, radius, 'fill="none" stroke="#efae72" stroke-width="3.5"');
    add('</g>');
  }
}

export function drawProtectiveRings(drawing) {
  const { add, circle, ribbonPath } = drawing;
  drawFire(drawing);
  drawVajraFence(drawing);
  add('<g id="charnel-grounds" clip-path="url(#charnel-clip)">');
  drawWaterAndWind(drawing);
  drawLandscapes(drawing);
  add('</g><g id="outer-lotus">');
  circle(1294, '#d48654', '#4d5749', 3);
  // Four low rounded petal crowns sit below each painted landscape.
  for (let i = 0; i < 32; i++) {
    const angle = (i + .5) * 11.25;
    const blue = i % 2 === 1;
    ribbonPath('M-119 2C-119-23-111-43-83-53C-45-67 45-67 83-53C111-43 119-23 119 2Z', angle, 1230, `fill="${blue ? '#398fae' : '#479671'}" stroke="#3a6359" stroke-width="4.2" data-lotus-crown=""`);
    ribbonPath('M-90 1C-91-12-82-26-63-31C-26-39 26-39 63-31C82-26 91-12 90 1Z', angle, 1230, `fill="${blue ? '#e88e50' : '#cf684e'}" stroke="#5b5e4a" stroke-width="3.8"`);
    ribbonPath('M-106-18Q-100-34-78-44C-38-57 40-57 77-44', angle, 1230, `fill="none" stroke="${blue ? '#6eb1c4' : '#7eb797'}" stroke-width="3.3" opacity=".8"`);
  }
  circle(1230, '#93b99a', '#31473d', 4);
  add('</g>');
}
