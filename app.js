/* ── Volume data (newest → oldest) ──────────────────────────────────────────
   Cover images are Figma MCP assets — replace with permanent URLs when ready.
   ─────────────────────────────────────────────────────────────────────────── */
const VOLUMES = [
  { title: 'Volume Eleven', year: '2026', comingSoon: true,  img: null },
  { title: 'Volume Ten',    year: '2025', comingSoon: false, img: 'https://www.figma.com/api/mcp/asset/56a257cc-78ac-402c-a900-95593a0f3392' },
  { title: 'Volume Nine',   year: '2024', comingSoon: false, img: 'https://www.figma.com/api/mcp/asset/178c62c1-9960-4f2a-97c7-1a55639f575d' },
  { title: 'Volume Eight',  year: '2023', comingSoon: false, img: 'https://www.figma.com/api/mcp/asset/5a370395-f360-472f-bebf-0257cb951f8f' },
  { title: 'Volume Seven',  year: '2022', comingSoon: false, img: 'https://www.figma.com/api/mcp/asset/de792246-164c-46b9-bdb9-6c1365a0f621' },
  { title: 'Volume Six',    year: '2021', comingSoon: false, img: 'https://www.figma.com/api/mcp/asset/d60d8c55-ee50-44ec-b593-a436b5201a10' },
  { title: 'Volume Five',   year: '2020', comingSoon: false, img: 'https://www.figma.com/api/mcp/asset/37ea479f-646c-472e-9bd4-56e7f0e66718' },
  { title: 'Volume Four',   year: '2019', comingSoon: false, img: 'https://www.figma.com/api/mcp/asset/223bf6e7-fc68-4804-9ba4-6f5dddfe9282' },
  { title: 'Volume Three',  year: '2018', comingSoon: false, img: 'https://www.figma.com/api/mcp/asset/95c3b1f8-9672-46cb-ba50-31a040fccf35' },
  { title: 'Volume Two',    year: '2017', comingSoon: false, img: 'https://www.figma.com/api/mcp/asset/d3c6f959-96b5-43c9-ba2a-5dbd2b519d52' },
  { title: 'Volume One',    year: '2016', comingSoon: false, img: 'https://www.figma.com/api/mcp/asset/4854627f-519d-430a-8b43-74345451f489' },
];

const N = VOLUMES.length;

/* ── Carousel state ──────────────────────────────────────────────────────── */
let active = 1;       // Default: Volume Ten centered (matches Figma Archives-1)
let isAnimating = false;

/*
  5 physical card elements. Each card tracks its current logical position
  in `pos[]`. Positions in order: far-left, left, center, right, far-right.

  On navigate(+1 / next):
    - The card at far-left is invisible → silently update its content,
      teleport it to far-right (off-screen), then shift all other cards
      one step left. CSS transitions animate the move.
  On navigate(-1 / prev): mirror of the above.
*/
const POS_ORDER = ['far-left', 'left', 'center', 'right', 'far-right'];
const cards = [0,1,2,3,4].map(i => document.getElementById('card' + i));

// pos[i] = current position string for cards[i]
let pos = [...POS_ORDER];

/* ── Fill one card slot with volume data ─────────────────────────────────── */
function fillCard(card, vol) {
  const cover   = card.querySelector('.vol-card__cover');
  const titleEl = card.querySelector('.vol-card__title');
  const yearEl  = card.querySelector('.vol-card__year');

  if (vol.comingSoon) {
    cover.innerHTML = '<div class="coming-soon"><p>Coming</p><p>Soon...</p></div>';
    cover.style.backgroundImage = '';
    cover.style.backgroundColor = '#43396d';
  } else {
    cover.innerHTML = '';
    cover.style.backgroundColor = '#43396d';
    cover.style.backgroundImage = vol.img ? `url('${vol.img}')` : '';
  }

  titleEl.textContent = vol.title;
  yearEl.textContent  = vol.year;
}

/* ── Initialise all 5 cards without triggering transitions ───────────────── */
function init() {
  // Disable transitions for the first paint
  cards.forEach(c => { c.style.transition = 'none'; });

  const offsets = [-2, -1, 0, 1, 2];
  cards.forEach((card, i) => {
    const volIdx = (active + offsets[i] + N) % N;
    fillCard(card, VOLUMES[volIdx]);
    card.dataset.pos = pos[i];
  });

  // Re-enable transitions after the browser has painted
  requestAnimationFrame(() => requestAnimationFrame(() => {
    cards.forEach(c => { c.style.transition = ''; });
  }));
}

/* ── Navigate: delta = +1 (older/right) or -1 (newer/left) ──────────────── */
function navigate(delta) {
  if (isAnimating) return;
  isAnimating = true;

  const isNext     = delta > 0;
  const exitingPos = isNext ? 'far-left' : 'far-right';   // card leaving the stage
  const enteringPos = isNext ? 'far-right' : 'far-left';  // card entering the stage

  // 1. Find the DOM card currently at the exiting (invisible) position
  const exitIdx  = pos.indexOf(exitingPos);
  const exitCard = cards[exitIdx];

  // 2. Compute the new active and the volume that should enter
  const newActive      = (active + delta + N) % N;
  const enteringOffset = isNext ? 2 : -2;
  const enteringVolIdx = (newActive + enteringOffset + N) % N;

  // 3. Update the exiting card's content while it's invisible — no flicker
  fillCard(exitCard, VOLUMES[enteringVolIdx]);

  // 4. Teleport it to the entering side instantly (no animation)
  exitCard.style.transition = 'none';
  exitCard.dataset.pos = enteringPos;
  pos[exitIdx] = enteringPos;

  // 5. Force a reflow so the browser registers the position before re-enabling transitions
  void exitCard.offsetWidth;
  exitCard.style.transition = '';

  // 6. Update active index
  active = newActive;

  // 7. Shift every other card one step in the direction of travel
  //    delta=+1 → each card moves one step toward 'far-left' (lower index)
  //    delta=-1 → each card moves one step toward 'far-right' (higher index)
  cards.forEach((card, i) => {
    if (i === exitIdx) return;  // already handled above
    const curPosIdx = POS_ORDER.indexOf(pos[i]);
    const newPosIdx = curPosIdx - delta;  // shift left for +1, right for -1
    pos[i] = POS_ORDER[newPosIdx];
    card.dataset.pos = pos[i];
  });

  // 8. Unlock after the CSS transition completes (0.48s + small buffer)
  setTimeout(() => { isAnimating = false; }, 520);
}

/* ── Wire up controls ────────────────────────────────────────────────────── */
document.getElementById('btnPrev').addEventListener('click', () => navigate(-1));
document.getElementById('btnNext').addEventListener('click', () => navigate(+1));

// Make :active work on iOS Safari (requires a touchstart listener on the element)
[document.getElementById('btnPrev'), document.getElementById('btnNext')].forEach(btn => {
  btn.addEventListener('touchstart', () => btn.classList.add('pressed'),    { passive: true });
  btn.addEventListener('touchend',   () => btn.classList.remove('pressed'), { passive: true });
  btn.addEventListener('touchcancel',() => btn.classList.remove('pressed'), { passive: true });
});

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft')  navigate(-1);
  if (e.key === 'ArrowRight') navigate(+1);
});

/* ── Editors ─────────────────────────────────────────────────────────────── */
const EDITORS = [
  { name: 'Cecelia Negash (she/her)',              role: 'Undergraduate Education' },
  { name: 'Chuck Frickin-Bats (they/them)',         role: 'Graduate Community Health & Social Justice' },
  { name: 'Kaya Schubiger-Lewis (she/her)',         role: 'Undergraduate Health Studies & Arts' },
  { name: 'Layla Youssef (she/her)',                role: 'Graduate Museology' },
  { name: 'Morgan Fu-Mueller (he/they)',            role: 'Undergraduate Psychology' },
  { name: 'Newton (Newt) Austria-Ball (they/them)', role: 'Undergraduate Biology & Creative Writing' },
  { name: 'Rehema Hassani (she/her)',               role: 'Undergraduate Health Education & Promotion & Global Health' },
  { name: 'Sabine Drake (she/her)',                 role: 'Undergraduate Health Studies & Chemistry' },
  { name: 'Andrea Stone PhD.',                      role: 'Advisor' },
  { name: 'Erik Echols',                            role: 'Just some guy, Advisor' },
];

function buildEditors() {
  const grid = document.getElementById('editorsGrid');
  EDITORS.forEach(ed => {
    const li = document.createElement('li');
    li.className = 'editor-card';
    li.innerHTML = `
      <div class="editor-card__avatar" aria-hidden="true">
        <svg viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="34" r="20" fill="#f8f3ec" opacity="0.6"/>
          <ellipse cx="50" cy="82" rx="32" ry="20" fill="#f8f3ec" opacity="0.6"/>
        </svg>
      </div>
      <p class="editor-card__name">${ed.name}</p>
      <p class="editor-card__role">${ed.role}</p>
    `;
    grid.appendChild(li);
  });
}

/* ── Nav shadow on scroll ────────────────────────────────────────────────── */
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 0);
}, { passive: true });

/* ── Boot ─────────────────────────────────────────────────────────────────── */
init();
buildEditors();
