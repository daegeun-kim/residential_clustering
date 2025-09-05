// ===== Config =====
const SPOT_WEST  = -74.045461501003;
const SPOT_SOUTH =  40.702445805924;
const SPOT_EAST  = -73.879700837637;
const SPOT_NORTH =  40.878143492702;

// Slides: only key + src (no captions)
const SLIDES = [
  { key: 'BLD_STORY',          src: 'analysis_image/BLD_STORY.png' },
  { key: 'construction_year',  src: 'analysis_image/construction_year.png' },
  { key: 'height_roof',        src: 'analysis_image/height_roof.png' },
  { key: 'station_time_taken', src: 'analysis_image/station_time_taken.png' },
  { key: 'CURMRKTOT',          src: 'analysis_image/CURMRKTOT.png' },
  { key: 'price_per_sqft',     src: 'analysis_image/price_per_sqft.png' },
  { key: 'price_inc',          src: 'analysis_image/price_inc.png' },
  { key: 'BLDG_CLASS',         src: 'analysis_image/BLDG_CLASS.png' },
  { key: 'elevator',           src: 'analysis_image/elevator.png' },
  { key: 'res_area',           src: 'analysis_image/residential_area.png' },
  { key: 'res_share',          src: 'analysis_image/res_share.png' },
];

// ===== DOM =====
const spotSection  = document.querySelector('.map-spotlight');
const overlayBox   = document.getElementById('spotlight-overlay');
const imgEl        = document.getElementById('spot-img');
const prevBtn      = overlayBox.querySelector('.nav-prev');
const nextBtn      = overlayBox.querySelector('.nav-next');

// Optional minimal styling (remove if you already have CSS)
Object.assign(overlayBox.style, {
  position: 'fixed', inset: '0', zIndex: '3',
  pointerEvents: 'auto',
  opacity: '0', transition: 'opacity 300ms ease'
});
imgEl.style.position = 'absolute';
imgEl.style.left = '0';
imgEl.style.top  = '0';
imgEl.style.transformOrigin = 'top left';
imgEl.style.pointerEvents = 'none';



// Text steps in the HTML aside
const textBox = document.getElementById('spotlight-text');
const steps = Array.from(textBox.querySelectorAll('.step'));

let slideIdx = 0;

// ===== Preload =====
const cache = new Map();
function preloadSlides(list = SLIDES) {
  return Promise.all(list.map(({ src }) => new Promise(res => {
    const im = new Image();
    im.onload = () => { cache.set(src, im); res(); };
    im.onerror = () => { console.warn('Failed to load', src); res(); };
    im.src = src;
  })));
}

// ===== Positioning =====
function positionCurrentImage() {
  if (!window.map) return;
  const tl = map.project([SPOT_WEST, SPOT_NORTH]);
  const br = map.project([SPOT_EAST, SPOT_SOUTH]);

  const w = (cache.get(SLIDES[slideIdx].src)?.naturalWidth  || imgEl.naturalWidth  || 1);
  const h = (cache.get(SLIDES[slideIdx].src)?.naturalHeight || imgEl.naturalHeight || 1);

  const sx = (br.x - tl.x) / w;
  const sy = (br.y - tl.y) / h;

  imgEl.style.width  = `${w}px`;
  imgEl.style.height = `${h}px`;
  imgEl.style.transform = `translate(${tl.x}px, ${tl.y}px) scale(${sx}, ${sy})`;
}

// ===== Text activation (HTML-only text) =====
function activateStep(key) {
  for (const el of steps) el.classList.toggle('active', el.dataset.key === key);
}

// ===== Render =====
function renderSlide(i) {
  slideIdx = (i + SLIDES.length) % SLIDES.length;
  const { src, key } = SLIDES[slideIdx];

  const pre = cache.get(src);
  if (pre && pre.complete) {
    imgEl.src = pre.src;
    activateStep(key);
    requestAnimationFrame(positionCurrentImage);
  } else {
    imgEl.onload = () => { activateStep(key); positionCurrentImage(); };
    imgEl.onerror = () => { activateStep(key); };
    imgEl.src = src;
  }
  updateDots();   // <-- update indicator here
}

// ===== Controls =====


// ===== Visibility & responsiveness =====
new IntersectionObserver(([entry]) => {
  overlayBox.style.opacity = entry.isIntersecting ? '1' : '0';
}, { threshold: 0.15 }).observe(spotSection);

if (window.map) {
  map.on('move', positionCurrentImage);
  window.addEventListener('resize', positionCurrentImage);
}

// ===== Init =====
(async function initSpotlight() {
  await preloadSlides();
  renderSlide(0);
  if (window.map && map.loaded()) positionCurrentImage();
})();


