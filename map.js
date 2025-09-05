mapboxgl.accessToken = 'pk.eyJ1Ijoia2Rna2ltIiwiYSI6ImNtOXNoeTdqdTAwdDgyam9yYzVzMW1oN3MifQ.wF32lqy3OcTwRX6nVnv82g';

// ----- Base lat band (north–south only) -----
const LAT_MIN = 40.65;
const LAT_MAX = 40.92;
const LON0    = -74.12;
const EPS     = 1e-4; 

const mapEl = document.getElementById('map');
const overlaysEl = document.getElementById('map-overlays');

mapEl.classList.remove('is-visible');
overlaysEl.classList.remove('is-visible');

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/kdgkim/cmernksk6007501qo11bpa34m',
  pitch: 0,
  bearing: 0,
  interactive: false,
  fadeDuration: 0
});

map.scrollZoom.disable();
map.boxZoom.disable();
map.dragRotate.disable();
map.dragPan.disable();
map.keyboard.disable();
map.doubleClickZoom.disable();
map.touchZoomRotate.disable();

// Fit by latitude band (initial/home)
function fitLatBand(lon = LON0) {
  const bounds = new mapboxgl.LngLatBounds(
    [lon - EPS, LAT_MIN],  // SW
    [lon + EPS, LAT_MAX]   // NE
  );
  const cam = map.cameraForBounds(bounds, { padding: 0 });
  map.jumpTo(cam);
}
fitLatBand();
window.addEventListener('resize', () => fitLatBand(map.getCenter().lng));

/* ---------------- Overlay image ---------------- */

const west  = -74.045461501003;
const south =  40.702445805924;
const east  = -73.879700837637;
const north =  40.878143492702;

const img = document.createElement('img');
img.src = 'analysis_image/res.png';
Object.assign(img.style, {
  position: 'absolute',
  left: '0px',
  top: '0px',
  transformOrigin: 'top left',
  pointerEvents: 'none'
});
overlaysEl.appendChild(img);

function positionOverlay() {
  const tl = map.project([west, north]);
  const br = map.project([east, south]);
  const sx = (br.x - tl.x) / (img.naturalWidth  || 1);
  const sy = (br.y - tl.y) / (img.naturalHeight || 1);
  img.style.transform = `translate(${tl.x}px, ${tl.y}px) scale(${sx}, ${sy})`;
  img.style.width  = `${img.naturalWidth}px`;
  img.style.height = `${img.naturalHeight}px`;
}

const waitIdle = () => new Promise(res => map.once('idle', res));
const waitImg  = () => new Promise(res => {
  if (img.complete) return res();
  img.onload = res;
  img.onerror = res;   // <- ensure we still show the map if PNG fails
});

map.on('load', async () => {
  await Promise.all([waitIdle(), waitImg()]);
  positionOverlay();
  mapEl.classList.add('is-visible');
  overlaysEl.classList.add('is-visible');

  window.addEventListener('resize', positionOverlay);
  map.on('move', positionOverlay);


  
  /* ---------- Spotlight: switch to 40.7–40.8 band ---------- */

  const HOME_BAND = { min: 40.65, max: 40.92 };
  const SPOT_BAND = { min: 40.68, max: 40.89 };
  const LON_HOME = LON0;
  const LON_SPOT  = -73.98;
  let activeBand = HOME_BAND;

  function camForLatBand(latMin, latMax, lon) {
    const b = new mapboxgl.LngLatBounds([lon - EPS, latMin], [lon + EPS, latMax]);
    return map.cameraForBounds(b, {
      padding: 0,
      bearing: map.getBearing(),
      pitch:   map.getPitch()
    });
  }

  function applyBand(band, animate = true) {
    activeBand = band;
    const lon = (band === SPOT_BAND) ? LON_SPOT : LON_HOME;
    const cam = camForLatBand(band.min, band.max, lon);
    animate ? map.easeTo({ ...cam, duration: 800 }) : map.jumpTo(cam);
  }

  // Keep current band on resize (overrides the earlier generic resize)
  window.addEventListener('resize', () => applyBand(activeBand, false));

  const spotlightSection = document.querySelector('.map-spotlight');
  if (spotlightSection) {
    new IntersectionObserver(([entry]) => {
      applyBand(entry.isIntersecting ? SPOT_BAND : HOME_BAND, true);
    }, { threshold: 0.35 }).observe(spotlightSection);
  }
});


/* ---------- Overlay visibility only in .intro ---------- */
const introSection     = document.querySelector('.intro');
const spotlightSection = document.querySelector('.map-spotlight');
const overlayEl        = document.getElementById('map-overlays');

let introOn = false;
let spotlightOn = false;

function updateOverlay() {
  overlayEl.style.opacity = (introOn && !spotlightOn) ? 1 : 0;
}

new IntersectionObserver(([entry]) => {
  introOn = entry.intersectionRatio >= 0.25;
  updateOverlay();
}, { threshold: [0, 0.25, 0.5, 0.75, 1] }).observe(introSection);

new IntersectionObserver(([entry]) => {
  spotlightOn = entry.isIntersecting;
  updateOverlay();
}, { threshold: 0.01 }).observe(spotlightSection);




(() => {
  const clusterSection = document.querySelector('.cluster');
  if (!clusterSection) return;

  const obs = new IntersectionObserver(([entry]) => {
    const hide = entry.isIntersecting;
    // fade out but keep layout stable
    mapEl.style.opacity = hide ? '0' : '1';
    mapEl.style.pointerEvents = hide ? 'none' : '';
  }, { threshold: 0.35 });

  obs.observe(clusterSection);
})();


(() => {
  const clusterSection = document.querySelector('.cluster');
  if (!clusterSection || !mapEl) return;

  const obs = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      // Fade out and disable pointer events when cluster is active
      mapEl.style.opacity = '0';
      mapEl.style.pointerEvents = 'none';
    } else {
      // Show map again when leaving cluster
      mapEl.style.opacity = '1';
      mapEl.style.pointerEvents = '';
    }
  }, { threshold: 0.35 });

  obs.observe(clusterSection);
})();

