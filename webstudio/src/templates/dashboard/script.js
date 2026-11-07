// --- Demo data (replace with real API calls) ---
const customers = ['Ava Chen', 'Liam Walker', 'Noah Patel', 'Emma Davis', 'Olivia Brown', 'Mason Lee', 'Sophia Khan', 'Lucas Silva', 'Mia Rossi', 'Ethan Park'];
const statuses = ['paid', 'paid', 'paid', 'pending', 'refunded'];
const seed = (n) => { let s = n; return () => (s = (s * 9301 + 49297) % 233280) / 233280; };

const orders = Array.from({ length: 24 }, (_, i) => {
  const r = seed(i + 7);
  return {
    id: '#' + (3100 + i),
    customer: customers[Math.floor(r() * customers.length)],
    amount: Math.round(40 + r() * 460),
    status: statuses[Math.floor(r() * statuses.length)],
  };
});

const sources = [['Organic search', 46], ['Direct', 27], ['Social', 17], ['Referral', 10]];

// --- KPIs with count-up animation ---
function countUp(el, target, fmt) {
  const t0 = performance.now();
  const step = (t) => {
    const p = Math.min((t - t0) / 900, 1);
    el.textContent = fmt(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const money = (v) => '$' + Math.round(v).toLocaleString();

function renderKpis(days) {
  const factor = days / 7;
  countUp(document.getElementById('kRevenue'), 18420 * factor, money);
  countUp(document.getElementById('kOrders'), Math.round(286 * factor), (v) => Math.round(v).toLocaleString());
  countUp(document.getElementById('kCustomers'), Math.round(173 * factor), (v) => Math.round(v).toLocaleString());
  countUp(document.getElementById('kRefund'), 2.4, (v) => v.toFixed(1) + '%');
}

// --- Line chart on <canvas> ---
function drawChart(days) {
  const canvas = document.getElementById('chart');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = 240;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const r = seed(days);
  const data = Array.from({ length: days }, (_, i) => 400 + Math.sin(i / 2) * 120 + r() * 260 + i * 8);
  const max = Math.max(...data) * 1.1, pad = 28;
  const x = (i) => pad + (i / (days - 1)) * (w - pad * 2);
  const y = (v) => h - pad - (v / max) * (h - pad * 2);

  ctx.strokeStyle = '#263052'; ctx.lineWidth = 1; ctx.fillStyle = '#8c97bd'; ctx.font = '11px sans-serif';
  for (let g = 0; g <= 4; g++) {
    const gy = pad + (g / 4) * (h - pad * 2);
    ctx.beginPath(); ctx.moveTo(pad, gy); ctx.lineTo(w - pad, gy); ctx.stroke();
    ctx.fillText('$' + Math.round(max * (1 - g / 4)), 0, gy + 4);
  }
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#6c7bff66'); grad.addColorStop(1, '#6c7bff00');
  ctx.beginPath(); ctx.moveTo(x(0), y(data[0]));
  data.forEach((v, i) => ctx.lineTo(x(i), y(v)));
  ctx.strokeStyle = '#6c7bff'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.lineTo(x(days - 1), h - pad); ctx.lineTo(x(0), h - pad); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
}

// --- Traffic sources ---
document.getElementById('sources').innerHTML = sources
  .map(([name, pct]) => `<div class="src"><div><span>${name}</span><span>${pct}%</span></div><div class="bar"><i style="width:0" data-w="${pct}"></i></div></div>`)
  .join('');
setTimeout(() => document.querySelectorAll('.bar i').forEach((b) => (b.style.width = b.dataset.w + '%')), 50);

// --- Orders table: search + sort ---
let sortKey = 'id', sortDir = 1, query = '';
function renderRows() {
  const rows = orders
    .filter((o) => (o.id + o.customer + o.status).toLowerCase().includes(query))
    .sort((a, b) => (a[sortKey] > b[sortKey] ? 1 : -1) * sortDir)
    .slice(0, 10);
  document.getElementById('rows').innerHTML = rows
    .map((o) => `<tr><td>${o.id}</td><td>${o.customer}</td><td>$${o.amount}</td><td><span class="tag ${o.status}">${o.status}</span></td></tr>`)
    .join('') || '<tr><td colspan="4">No matching orders.</td></tr>';
}
document.querySelectorAll('th').forEach((th) => th.addEventListener('click', () => {
  sortDir = sortKey === th.dataset.key ? -sortDir : 1; sortKey = th.dataset.key; renderRows();
}));
document.getElementById('search').addEventListener('input', (e) => { query = e.target.value.toLowerCase(); renderRows(); });

// --- Controls ---
const range = document.getElementById('range');
const refresh = () => { renderKpis(+range.value); drawChart(+range.value); };
range.addEventListener('change', refresh);
document.getElementById('menuBtn').addEventListener('click', () => document.getElementById('side').classList.toggle('open'));
window.addEventListener('resize', () => drawChart(+range.value));

renderRows();
refresh();
