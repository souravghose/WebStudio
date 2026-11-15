// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Theme toggle
const root = document.documentElement;
document.getElementById('themeToggle').addEventListener('click', () => {
  const next = root.dataset.theme === 'light' ? 'dark' : 'light';
  root.dataset.theme = next;
  console.log('Theme switched to', next);
});

// Project filtering
const chips = document.querySelectorAll('.chip');
const cards = document.querySelectorAll('.card');
chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    chips.forEach((c) => c.classList.toggle('active', c === chip));
    const filter = chip.dataset.filter;
    cards.forEach((card) => card.classList.toggle('hide', filter !== 'all' && card.dataset.cat !== filter));
  });
});

// Contact form validation
const form = document.getElementById('contactForm');
const status = document.getElementById('formStatus');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  let valid = true;
  form.querySelectorAll('input, textarea').forEach((field) => {
    const ok = field.value.trim() && (field.type !== 'email' || /^\S+@\S+\.\S+$/.test(field.value));
    field.classList.toggle('invalid', !ok);
    if (!ok) valid = false;
  });
  status.classList.toggle('error', !valid);
  status.textContent = valid ? 'Thanks! Your message is ready to send (demo only).' : 'Please fill in all fields correctly.';
  if (valid) form.reset();
});
