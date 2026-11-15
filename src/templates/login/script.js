const $ = (id) => document.getElementById(id);
const form = $('form');
let mode = 'login';

// Switch between sign in / create account
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    mode = tab.dataset.mode;
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('on', t === tab));
    const signup = mode === 'signup';
    document.querySelectorAll('.signup-only').forEach((el) => (el.hidden = !signup));
    $('title').textContent = signup ? 'Create account' : 'Sign in';
    $('sub').textContent = signup ? 'Start your free account in seconds.' : 'Enter your details to continue.';
    $('submit').textContent = signup ? 'Create account' : 'Sign in';
    $('password').autocomplete = signup ? 'new-password' : 'current-password';
    clearErrors();
  });
});

// Show / hide password
$('toggle').addEventListener('click', () => {
  const show = $('password').type === 'password';
  $('password').type = show ? 'text' : 'password';
  $('toggle').textContent = show ? 'Hide' : 'Show';
});

// Password strength meter
$('password').addEventListener('input', () => {
  const v = $('password').value;
  const score = [v.length >= 8, /[A-Z]/.test(v), /[0-9]/.test(v), /[^A-Za-z0-9]/.test(v)].filter(Boolean).length;
  const colors = ['#dc2626', '#f59e0b', '#eab308', '#22c55e', '#16a34a'];
  $('meterBar').style.width = (v ? Math.max(score, 1) * 25 : 0) + '%';
  $('meterBar').style.background = colors[score];
});

function setError(input, message) {
  const field = input.closest('.field');
  field.classList.toggle('bad', !!message);
  field.querySelector('.err').textContent = message || '';
  return !message;
}
function clearErrors() {
  document.querySelectorAll('.field').forEach((f) => { f.classList.remove('bad'); f.querySelector('.err').textContent = ''; });
  $('result').textContent = '';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();
  const checks = [
    setError($('email'), /^\S+@\S+\.\S+$/.test($('email').value) ? '' : 'Enter a valid email address.'),
    setError($('password'), $('password').value.length >= 8 ? '' : 'Password must be at least 8 characters.'),
  ];
  if (mode === 'signup') checks.push(setError($('name'), $('name').value.trim() ? '' : 'Please enter your name.'));
  if (!checks.every(Boolean)) return;

  $('submit').disabled = true;
  await new Promise((r) => setTimeout(r, 900)); // simulate network
  $('submit').disabled = false;

  const ok = $('email').value.toLowerCase() !== 'wrong@example.com';
  $('result').className = 'result ' + (ok ? 'ok' : 'bad');
  $('result').textContent = ok
    ? (mode === 'signup' ? 'Account created! (demo)' : 'Signed in successfully! (demo)')
    : 'Invalid email or password.';
  console.log(mode, 'attempt for', $('email').value, '→', ok ? 'success' : 'failure');
});

$('forgot').addEventListener('click', (e) => {
  e.preventDefault();
  $('result').className = 'result';
  $('result').textContent = 'Password reset link would be sent here.';
});
