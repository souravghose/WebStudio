document.getElementById('year').textContent = new Date().getFullYear();

// Mobile menu
const menu = document.getElementById('menu');
document.getElementById('burger').addEventListener('click', () => menu.classList.toggle('open'));
menu.addEventListener('click', (e) => { if (e.target.tagName === 'A') menu.classList.remove('open'); });

// Pricing toggle
const billing = document.getElementById('billing');
billing.addEventListener('change', () => {
  document.querySelectorAll('.price span').forEach((el) => {
    el.textContent = billing.checked ? el.dataset.y : el.dataset.m;
  });
});

// Email signup (demo — nothing is sent anywhere)
const note = document.getElementById('signupNote');
document.getElementById('signup').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('signupEmail').value.trim();
  const ok = /^\S+@\S+\.\S+$/.test(email);
  note.className = 'note ' + (ok ? 'ok' : 'err');
  note.textContent = ok ? `Thanks! We'll send a welcome email to ${email}.` : 'Please enter a valid email address.';
});
