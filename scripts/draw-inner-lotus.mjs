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
    <clipPath id="inner-lotus-edge"><circle r="498"/></clipPath>
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
    </g>`;

export function drawInnerLotus({ add, circle, use }) {
  add('<g id="inner-lotuses">');
  circle(519, '#293f33', '#dec27c', 5);
  for (let i = 0; i < 64; i++) {
    use('vajra', `rotate(${i * 5.625}) translate(0 -508) scale(.48 .52)`);
  }

  add('<g clip-path="url(#inner-lotus-edge)">');
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
  circle(498, 'none', '#37352c');
  add('</g>');
}
