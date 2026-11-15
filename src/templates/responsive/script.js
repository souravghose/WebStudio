// Live viewport readout
const vw = document.getElementById('vw');
const bp = document.getElementById('bp');
function update() {
  const w = window.innerWidth;
  vw.textContent = w;
  bp.textContent = w <= 640 ? 'Mobile' : w <= 900 ? 'Tablet' : 'Desktop';
}
window.addEventListener('resize', update);
update();

// Mobile navigation
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
burger.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  burger.setAttribute('aria-expanded', String(open));
});
nav.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') {
    nav.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  }
});
