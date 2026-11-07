document.getElementById('year').textContent = new Date().getFullYear();

// Animated counters (start when the stats section scrolls into view)
const counters = document.querySelectorAll('[data-count]');
const animate = (el) => {
  const target = Number(el.dataset.count);
  const start = performance.now();
  const tick = (now) => {
    const p = Math.min((now - start) / 1200, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) { animate(entry.target); io.unobserve(entry.target); }
  });
}, { threshold: 0.4 });
counters.forEach((c) => io.observe(c));

// Testimonial slider
const testimonials = [
  { q: '“Summit helped us cut operating costs by 22% in the first year.”', a: 'Priya Nair — COO, BrightPath' },
  { q: '“A genuinely collaborative team that delivers on its promises.”', a: 'Tom Becker — CEO, Norland Foods' },
  { q: '“Their financial model changed how we plan every quarter.”', a: 'Aisha Khan — CFO, Verity Health' },
];
const quote = document.getElementById('quote');
const author = document.getElementById('author');
const dots = document.getElementById('dots');
let current = 0, timer;
testimonials.forEach((_, i) => {
  const b = document.createElement('button');
  b.setAttribute('aria-label', 'Testimonial ' + (i + 1));
  b.onclick = () => { show(i); restart(); };
  dots.appendChild(b);
});
function show(i) {
  current = i;
  quote.textContent = testimonials[i].q;
  author.textContent = testimonials[i].a;
  [...dots.children].forEach((d, idx) => d.classList.toggle('on', idx === i));
}
function restart() { clearInterval(timer); timer = setInterval(() => show((current + 1) % testimonials.length), 5000); }
show(0); restart();

// Active nav link on scroll
const links = [...document.querySelectorAll('#nav a:not(.cta)')];
const sections = links.map((l) => document.querySelector(l.getAttribute('href')));
window.addEventListener('scroll', () => {
  const y = window.scrollY + 120;
  sections.forEach((s, i) => links[i].classList.toggle('active', s && s.offsetTop <= y && s.offsetTop + s.offsetHeight > y));
});

// Contact form
const status = document.getElementById('cStatus');
document.getElementById('contactForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('cName');
  const email = document.getElementById('cEmail');
  const msg = document.getElementById('cMsg');
  const checks = [[name, name.value.trim()], [email, /^\S+@\S+\.\S+$/.test(email.value)], [msg, msg.value.trim()]];
  checks.forEach(([el, ok]) => el.classList.toggle('err', !ok));
  const valid = checks.every(([, ok]) => ok);
  status.className = 'status ' + (valid ? 'ok' : 'bad');
  status.textContent = valid ? 'Request received (demo) — we will be in touch shortly.' : 'Please complete the highlighted fields.';
});
