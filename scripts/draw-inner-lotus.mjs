const bands = [
  {
    name: 'outer-green',
    count: 6,
    offset: 30,
    groundRadius: 502,
    ground: '#459069',
    fill: 'url(#lotus-outer-green)',
    ink: '#355c46',
    path: 'M-214-369C-230-380-247-410-246-427C-244-443-228-454-207-461C-139-489-65-504 0-503C65-504 139-489 207-461C228-454 244-443 246-427C247-410 230-380 214-369Q0-398-214-369Z',
    highlight: 'M-226-436C-185-473-84-493-11-493M21-493C94-491 179-475 219-448',
  },
  {
    name: 'orange',
    count: 8,
    offset: 0,
    groundRadius: 423,
    ground: '#d77745',
    fill: 'url(#lotus-orange)',
    ink: '#924c30',
    path: 'M-127-310C-137-326-147-347-149-365C-154-383-150-392-135-401C-105-416-62-423 0-423C62-423 105-416 135-401C150-392 154-383 149-365C147-347 137-326 127-310Q0-337-127-310Z',
    highlight: 'M-139-385C-104-407-56-415-14-415M11-415C58-415 100-411 129-394',
  },
  {
    name: 'inner-green',
    count: 8,
    offset: 0,
    groundRadius: 323,
    ground: '#dc7946',
    fill: 'url(#lotus-inner-green)',
    ink: '#3b5e42',
    path: 'M-91-223C-100-236-110-259-112-279C-115-294-108-304-92-312C-74-322-38-325 0-325C38-325 74-322 92-312C108-304 115-294 112-279C110-259 100-236 91-223Q0-244-91-223Z',
    highlight: 'M-99-291C-91-310-49-317-15-317M15-318C58-316 86-312 99-297',
  },
];

export const innerLotusDefs = `<radialGradient id="lotus-outer-green" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="502">
      <stop offset=".82" stop-color="#45996f"/><stop offset=".93" stop-color="#5bab79"/><stop offset="1" stop-color="#66ae7d"/>
    </radialGradient>
    <radialGradient id="lotus-orange" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="423">
      <stop offset=".78" stop-color="#d6682d"/><stop offset=".90" stop-color="#e77b36"/><stop offset="1" stop-color="#e98743"/>
    </radialGradient>
    <radialGradient id="lotus-inner-green" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="325">
      <stop offset=".71" stop-color="#479867"/><stop offset=".89" stop-color="#57aa76"/><stop offset="1" stop-color="#69b181"/>
    </radialGradient>
    <radialGradient id="lotus-family-green" gradientUnits="userSpaceOnUse" cx="-24" cy="-190" r="145">
      <stop stop-color="#61b181"/><stop offset=".72" stop-color="#43976d"/><stop offset="1" stop-color="#398461"/>
    </radialGradient>
    <radialGradient id="lotus-family-blue" gradientUnits="userSpaceOnUse" cx="-22" cy="-181" r="137">
      <stop stop-color="#358bb6"/><stop offset=".70" stop-color="#2478a6"/><stop offset="1" stop-color="#245d86"/>
    </radialGradient>
    <radialGradient id="lotus-heart" cx="40%" cy="35%" r="71%">
      <stop stop-color="#eae6c4"/><stop offset=".78" stop-color="#e1e1b9"/><stop offset="1" stop-color="#ccce9e"/>
    </radialGradient>
    <g id="lotus-rim-links" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M-21 0C-14-9-7-9-3 0C1 9 12 10 20 0C12-9 1-9-3 0C-7 10-14 9-21 0Z" stroke="#d8bd7c" stroke-width="2.8"/>
      <path d="M-24 0H-20M18 0H24" stroke="#f0d499" stroke-width="2.5"/>
    </g>`;

export function drawInnerLotus({ add, circle, use, point }) {
  add('<g id="inner-lotuses">');

  circle(519, '#333933', '#555942', 3);
  circle(514, 'none', '#8d7b54', 1.8);
  circle(503, 'none', '#736448', 1.8);
  // The small gold links share the same strand around the dark rim.
  const strand = Array.from({length: 384}, (_, i) =>
    point(510 + 2.4 * Math.sin(i * Math.PI / 4), i * 360 / 384));
  add(`<path d="M${strand.join('L')}Z" fill="none" stroke="#b49b65" stroke-width="2.1"/>`);
  for (let i = 0; i < 24; i++) {
    use('lotus-rim-links', `rotate(${i * 15}) translate(0 -510) scale(${i % 3 ? '.76 .67' : '1 .86'})`);
  }

  for (const { name, count, offset, groundRadius, ground, fill, ink, path, highlight } of bands) {
    add(`<g data-inner-lotus-band="${name}">`);
    circle(groundRadius, ground, 'none');
    for (let i = 0; i < count; i++) {
      const angle = offset + i * 360 / count;
      add(`<g transform="rotate(${angle})" data-lotus-petal="">`);
      add(`<path d="${path}" fill="${fill}" stroke="${ink}" stroke-width="3.7"/>`);
      add(`<path d="${highlight}" fill="none" stroke="#f6d99b" stroke-opacity=".28" stroke-width="3.3"/>`);
      add('</g>');
    }
    add('</g>');
    // The orange and inner green petals are framed by thin rose borders.
    if (name === 'outer-green') {
      circle(433, '#c87156', '#8f4937', 3);
      circle(429, 'none', '#e4906c', 2.6);
    } else if (name === 'orange') {
      circle(337, '#c46a53', '#944e39', 3);
      circle(333, 'none', '#e08f72', 2.5);
    }
  }

  circle(248, '#e47f3e', '#8b5135', 3.6);
  circle(243, 'none', '#f2a364', 2.7);
  circle(225, '#dfcb82', '#a18149', 2.8);

  add('<g data-inner-lotus-band="family">');
  for (let i = 0; i < 4; i++) {
    const blue = i % 2;
    add(`<g transform="rotate(${i * 90})" data-lotus-petal="" data-family-color="${blue ? 'blue' : 'green'}">`);
    const path = blue
      ? 'M-62-94C-92-109-115-133-119-164C-123-192-100-212-71-220C-46-227-23-226 0-226C23-226 46-227 71-220C100-212 123-192 119-164C115-133 92-109 62-94Z'
      : 'M-62-96C-90-109-111-130-114-159C-117-187-96-208-67-217C-42-225-24-225 0-225C24-225 42-225 67-217C96-208 117-187 114-159C111-130 90-109 62-96Z';
    add(`<path d="${path}" fill="url(#lotus-family-${blue ? 'blue' : 'green'})" stroke="${blue ? '#2e5868' : '#375f46'}" stroke-width="4"/>`);
    add('<path d="M-103-165C-96-197-65-211-35-216M38-216C63-211 88-202 98-184" fill="none" stroke="#c1d4a6" stroke-opacity=".30" stroke-width="3.3"/>');
    add('</g>');
  }
  add('</g>');
  // The circular lip cuts cleanly across the four broad petal tips.
  circle(225, 'none', '#8b5736', 3.2);
  circle(222, 'none', '#ef9a53', 3);

  circle(126, '#e08346', '#95543a', 4.2);
  circle(120, 'none', '#f0a469', 2.8);
  circle(104, 'url(#lotus-heart)', '#93664b', 4.1);
  add('</g>');
}
