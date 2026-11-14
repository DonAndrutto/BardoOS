// Ornaments are drawn in gate-local coordinates with the outward direction up.
// Their proportions follow crops of all four painted gates rotated upright.
const gates = {
  west: { fabric: '#de965f', arch: '#cf897b', archLight: '#ebba9d', canopy: '#bc7163', post: '#d3977e', flanks: 'parasol' },
  north: { arch: '#6eab8d', archLight: '#afcbb5', canopy: '#528872', post: '#8cac92', flanks: 'victory-banner' },
  east: { fabric: '#e98e4d', arch: '#78adbf', archLight: '#d3ddd2', canopy: '#6898aa', post: '#d7dacf', flanks: 'parasol' },
  south: { arch: '#cfbd70', archLight: '#e4d4a2', canopy: '#c0a959', post: '#cfb46d', flanks: 'victory-banner' },
};

export const palaceGateDefs = `<g id="gate-deer" stroke="#78623e" stroke-width="3.1" stroke-linecap="round" stroke-linejoin="round">
      <!-- The rear haunch and folded forelegs sit on the green roof step. -->
      <path d="M-177-11C-161-10-158-26-144-31C-123-44-103-40-83-40C-68-40-58-50-53-64C-47-82-41-94-36-100C-41-107-38-118-29-121C-25-121-20-117-18-114L-8-113Q-5-108-13-105L-24-105C-34-94-33-83-32-73C-31-54-34-45-41-34C-45-24-48-14-49-1L-153-1Q-165-1-165-10Z" fill="#c5aa6f"/>
      <path d="M-167-11Q-177-9-182-15Q-173-12-164-17M-134-24Q-117-15-115-2M-142-6Q-132-5-123-2M-73-36Q-63-28-64-13L-53-9L-48-2H-92" fill="none" stroke="#8c7346"/>
      <path d="M-153-19C-139-31-121-33-109-31M-80-35Q-55-38-47-67Q-39-94-33-104" fill="none" stroke="#e2c688" stroke-width="3.6"/>
      <path d="M-34-115Q-55-121-55-130Q-43-130-33-122M-36-108Q-49-103-62-105Q-53-114-41-115" fill="#c5aa6f" stroke-width="2.1"/>
      <path d="M-36-119Q-42-130-40-140M-41-134L-49-139M-41-129L-53-132M-32-121Q-31-132-26-137" fill="none" stroke-width="2.1"/>
      <circle cx="-26" cy="-114" r="1.9" fill="#5b4b33" stroke="none"/>
    </g>

    <g id="dharma-wheel" stroke-linecap="round" stroke-linejoin="round">
      <circle r="45" fill="#c8a76a" stroke="#795938" stroke-width="4.8"/>
      <circle r="40" fill="#e3c086" stroke="#edcf94" stroke-width="2.4"/>
      <circle r="32" fill="#b89a5e" stroke="#806139" stroke-width="2.6"/>
      ${Array.from({length: 8}, (_, i) => `<g transform="rotate(${i * 45})"><path d="M-2.8-13L-4.1-28Q0-33 4.1-28L2.8-13Z" fill="#e3c087" stroke="#785d39" stroke-width="1.7"/><path d="M0-38V-41" stroke="#8d6b41" stroke-width="2.8"/></g>`).join('')}
      <circle r="13" fill="#d5ac69" stroke="#7a5a37" stroke-width="2.7"/>
      <path d="M-7 0C-4-5 4-5 7 0C4 5-4 5-7 0Z" fill="#efce8c" stroke="#8d693f" stroke-width="1.8"/>
      <path d="M-20-36A41 41 0 0 1 27-30M-30 28A41 41 0 0 0 18 37" fill="none" stroke="#f7d89d" stroke-width="2.3"/>
    </g>

    <g id="gate-finial" stroke="#806442" stroke-width="2.8" stroke-linejoin="round">
      <path d="M-10 1Q-8-8-5-12C-17-18-13-34 0-50C12-35 17-19 5-12Q8-8 10 1Z" fill="#dabc7b"/>
      <path d="M-4-19Q-8-27-2-38M-6-5H6" fill="none" stroke="#f0d79c" stroke-width="2.2"/>
    </g>

    <g id="gate-canopy" stroke="#6d6149" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <use href="#gate-finial" transform="translate(0 -51) scale(.91)"/>
      <path d="M-81-3C-62-12-58-28-53-35Q0-20 53-35C58-28 62-12 81-3Q67 1 58 3Q48 11 36 7Q19 15 6 8Q-5 16-17 8Q-30 13-42 6Q-56 11-66 3Z" fill="var(--canopy)"/>
      ${Array.from({length: 13}, (_, i) => {
        const x = (i - 6) * 8;
        return `<path d="M${x} ${-29 + (1 - Math.abs(i - 6) / 6) * 7}Q${x * 1.08} -10 ${x * 1.26} 1" fill="none" stroke="${i % 2 ? '#f0dec0' : '#575a4f'}" stroke-opacity=".64" stroke-width="2.5"/>`;
      }).join('')}
      <path d="M-57-35C-35-43-19-47 0-59C20-47 34-43 57-35Q0-22-57-35Z" fill="#eee4cb"/>
      <path d="M-56-35Q0-23 56-35L54-27Q0-16-54-27Z" fill="#c1a16a"/>
      <path d="M-78-2Q-66 1-58 1Q-51 8-41 5Q-29 11-19 7Q-5 14 7 8Q21 13 36 7Q50 11 58 4Q71 3 78-2" stroke="#e9dec3" stroke-width="5.4" fill="none"/>
    </g>

    <g id="wheel-and-deer">
      <path d="M-53-7L-28-162Q0-169 28-162L53-7Z" fill="var(--post)" stroke="#81664a" stroke-width="3.5"/>
      <path d="M-28-151L-38-89M29-150L38-89" fill="none" stroke="#ead1a3" stroke-opacity=".64" stroke-width="3"/>
      <use href="#gate-deer"/>
      <use href="#gate-deer" transform="scale(-1 1)"/>
      <path d="M-55-31Q0-22 55-31L52-1H-52Z" fill="#ca7146" stroke="#855438" stroke-width="3.9"/>
      <path d="M-50-12Q0-7 50-12M-35-24V-5M-18-23V-3M0-21V-3M18-23V-3M35-24V-5" fill="none" stroke="#a15437" stroke-width="3"/>
      <path d="M-46-20Q0-13 46-20" fill="none" stroke="#e79354" stroke-width="3"/>
      <use href="#dharma-wheel" transform="translate(0 -68)"/>
      <use href="#gate-canopy" transform="translate(0 -161)"/>
    </g>

    <g id="parasol" stroke="#795b3f" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
      <path d="M-5 1L-4-183H5L7 1Z" fill="#c7a76b"/>
      <path d="M-1-3L0-164" fill="none" stroke="#e9ca91" stroke-width="2.5"/>
      <path d="M-84-120Q-67-130 0-131Q67-130 84-120L79-104Q0-77-79-104Z" fill="#bf744b"/>
      <path d="M-70-109Q0-87 70-109M-61-101Q0-86 61-101" fill="none" stroke="#e6a674" stroke-width="3"/>
      <path d="M-73-154C-107-146-134-158-158-149C-181-140-181-127-165-116C-150-106-131-107-121-113C-106-106-94-111-85-114C-71-104-56-109-49-110C-32-103-16-102 0-105C17-101 31-102 49-110C65-106 79-106 86-114C100-109 114-109 121-113C139-105 154-110 166-119C182-129 176-145 160-151C139-158 111-146 73-154Z" fill="var(--fabric)"/>
      <path d="M-163-137Q0-150 162-137M-150-146C-168-135-160-119-149-116M-121-149C-143-135-137-121-121-113M-89-147C-108-134-104-122-85-114M-54-145C-70-134-67-116-49-110M-20-143C-28-131-28-113-17-107M18-144C25-132 25-115 18-106M54-144C69-130 67-115 49-110M89-148C108-133 105-122 86-114M121-149C143-135 137-122 121-113M151-147C168-136 161-121 151-118" fill="none" stroke="#a7603c" stroke-width="3.3"/>
      <path d="M-153-137Q-156-130-153-124M-124-137Q-130-131-124-123M-93-137Q-97-132-93-124M-56-137Q-60-129-55-121M-15-137L-16-119M16-137L17-119M56-137Q60-129 55-121M93-137Q97-132 93-124M124-137Q130-131 124-123M153-137Q156-130 153-124" fill="none" stroke="#f1ad74" stroke-width="2.6"/>
      <path d="M-68-196Q0-186 68-196C70-176 77-163 82-153Q68-145 54-152Q42-145 26-151Q12-144 0-149Q-13-145-26-151Q-41-146-54-152Q-70-145-82-153C-76-166-70-180-68-196Z" fill="#4e93aa"/>
      ${Array.from({length: 17}, (_, i) => {
        const x = (i - 8) * 7.65;
        return `<path d="M${x} ${-191 + (1 - Math.abs(i-8)/8)*6}Q${x * 1.04} -176 ${x * 1.14} -156" fill="none" stroke="${i % 2 ? '#a5c8c8' : '#316783'}" stroke-width="2.5"/>`;
      }).join('')}
      <path d="M-79-154Q-68-149-54-155Q-41-149-26-153Q-13-148 0-152Q13-148 26-153Q41-149 54-155Q68-149 79-154" fill="none" stroke="#e4ded0" stroke-width="8"/>
      <path d="M-72-202Q-52-211-36-216Q-18-221 0-235Q18-221 36-216Q52-211 72-202Q0-189-72-202Z" fill="#ede4d1"/>
      <path d="M-72-203Q0-189 72-203L69-193Q0-181-69-193Z" fill="#c3a26c"/>
      <use href="#gate-finial" transform="translate(0 -230)"/>
    </g>

    <g id="victory-banner" stroke="#705d44" stroke-width="3.45" stroke-linejoin="round" stroke-linecap="round">
      <path d="M-6 1L-4-216H5L8 1Z" fill="#be9d63"/>
      <path d="M0-3V-205" fill="none" stroke="#ead3a0" stroke-width="2.5"/>
      <path d="M-48-213Q0-204 48-213L48-174Q0-167-48-174Z" fill="#db8953"/>
      <path d="M-48-174Q0-166 48-174Q51-155 56-144Q0-131-56-144Q-50-160-48-174Z" fill="#4d93a9"/>
      <path d="M-49-141Q0-133 49-141L50-108Q0-99-50-108Z" fill="#c96b50"/>
      <path d="M-50-108Q0-100 50-108Q53-87 65-76Q0-59-65-76Q-53-87-50-108Z" fill="#589477"/>
      ${Array.from({length: 11}, (_, i) => {
        const x = (i - 5) * 8.8;
        return `<path d="M${x} ${-171 + (1 - Math.abs(i-5)/5)*3}L${x * 1.17} -146M${x} ${-105 + (1 - Math.abs(i-5)/5)*3}L${x * 1.34} -79" fill="none" stroke="${i % 2 ? '#a7c5b7' : '#315f63'}" stroke-width="2.4"/>`;
      }).join('')}
      <path d="M-56-149Q-47-146-39-148Q-30-141-19-146Q-9-141 0-145Q10-141 19-146Q30-141 39-148Q48-146 56-149L58-140Q50-137 40-140Q31-134 20-139Q10-132 0-138Q-12-132-20-139Q-32-134-40-140Q-50-137-58-140Z" fill="#dedac3"/>
      <path d="M-61-81Q-49-76-40-80Q-30-74-20-77Q-10-72 0-76Q10-72 20-77Q30-74 40-80Q49-76 61-81L66-73Q56-66 40-72Q30-65 20-70Q10-63 0-68Q-10-63-20-70Q-30-65-40-72Q-56-66-66-73Z" fill="#e5dec1"/>
      <path d="M-51-219C-36-229-15-234 0-249C15-234 36-229 51-219Q0-208-51-219Z" fill="#e9decd"/>
      <path d="M-51-219Q0-208 51-219L48-209Q0-198-48-209Z" fill="#c2a170"/>
      <path d="M-42-195Q0-187 42-195" fill="none" stroke="#eeaf77" stroke-width="2.8"/>
      <use href="#gate-finial" transform="translate(0 -243) scale(.93)"/>
    </g>

    <g id="gate-streamer" stroke="#805b41" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round">
      <path d="M-5 2L-3-195H4L7 2Z" fill="#c39b63"/>
      <use href="#gate-finial" transform="translate(0 -186) scale(.78)"/>
      <path d="M10-192C-23-185-23-141-2-126C14-114 31-116 48-106C77-89 94-97 121-108C103-83 81-79 57-88C26-99 6-97-9-107C-46-130-32-177 10-192Z" fill="#d88b60"/>
      <path d="M-18-123C-15-93 9-78 34-74C64-69 81-63 104-68C88-47 52-52 27-59C-4-66-26-93-18-123Z" fill="#d88b60"/>
      <path d="M5-180C-7-158-4-142 14-132Q45-120 62-109M-9-96C5-82 28-72 51-69" fill="none" stroke="#f2ae79" stroke-width="3.2"/>
    </g>`;

export function drawGateSurround(direction, angle, { add, use }) {
  const { arch, archLight, fabric, flanks } = gates[direction];
  add(`<g data-gate="${direction}" transform="rotate(${angle})">`);
  // The scalloped wings meet the arch rather than rising as separate leaves.
  for (const sign of [-1, 1]) {
    add(`<path transform="scale(${sign} 1)" d="M263-831C279-851 280-888 286-906C292-928 307-914 321-921C351-927 371-950 362-979C354-1004 336-1017 310-1002C326-1026 310-1058 291-1073C279-1084 265-1075 254-1059C254-1087 229-1110 212-1101C200-1095 194-1084 184-1073C215-1055 238-1023 248-990C265-937 251-878 250-831Z" fill="${arch}" stroke="#6b6c58" stroke-width="3.5"/>`);
    add(`<path transform="scale(${sign} 1)" d="M273-906Q292-941 311-948M312-998Q321-1018 302-1046M257-1064Q250-1081 234-1084" fill="none" stroke="${archLight}" stroke-opacity=".72" stroke-width="4.4"/>`);
    if (flanks === 'parasol') {
      use('parasol', `translate(${sign * 508} -833)`, `style="--fabric:${fabric}" data-ornament="parasol"`);
    } else {
      use('victory-banner', `translate(${sign * 477} -833)`, 'data-ornament="victory-banner"');
      use('gate-streamer', `translate(${sign * 598} -833) scale(${sign} 1)`);
    }
  }
  const archPath = 'M-284-830C-298-881-292-939-274-984C-233-1088-128-1118 0-1119C128-1118 233-1088 274-984C292-939 298-881 284-830';
  add(`<path d="${archPath}" fill="none" stroke="#6b6b55" stroke-width="27"/><path d="${archPath}" fill="none" stroke="${arch}" stroke-width="21"/><path d="${archPath}" fill="none" stroke="${archLight}" stroke-width="5.5"/>`);
  add('</g>');
}

export function drawGateCrown(direction, angle, { add, use }) {
  const { canopy, post } = gates[direction];
  add(`<g data-gate-crown="${direction}" transform="rotate(${angle})">`);
  const roof = [
    [-849, 258, 31, '#dfc473', '#82704b'],
    [-880, 232, 36, '#3f90b0', '#475e61'],
    [-916, 201, 36, '#d16b51', '#815540'],
    [-952, 172, 36, '#4e9c7a', '#4d6b56'],
  ];
  for (const [base, half, height, fill, edge] of roof) {
    const top = base - height;
    add(`<path d="M${-half} ${base}V${top}H${half}V${base}Z" fill="${fill}" stroke="${edge}" stroke-width="3.6"/><path d="M${-half + 4} ${top + 6}H${half - 4}" fill="none" stroke="#e2c390" stroke-opacity=".46" stroke-width="2.5"/>`);
  }
  use('wheel-and-deer', 'translate(0 -989)', `style="--canopy:${canopy};--post:${post}" data-ornament="wheel-and-deer"`);
  // A low, orange-rimmed trefoil sits across the painted black gate opening.
  add('<path d="M-117-847C-121-875-107-892-81-900C-59-907-56-926-37-936C-17-947 17-947 37-936C56-926 59-907 81-900C107-892 121-875 117-847Z" fill="#2d2927" stroke="#da8451" stroke-width="13" stroke-linejoin="round"/>');
  add('<path d="M-10-925C-27-926-31-902-49-899M10-925C27-926 31-902 49-899M0-929V-874" fill="none" stroke="#c7ac74" stroke-width="4.3" stroke-linecap="round" stroke-dasharray="2 7"/>');
  add('</g>');
}
