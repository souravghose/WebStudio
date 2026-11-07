const products = [
  { id: 1, name: 'Trail Daypack 22L', cat: 'Bags', price: 89, rating: 4.7, reviews: 214, emoji: '🎒', bg: '#fde68a' },
  { id: 2, name: 'Insulated Bottle', cat: 'Outdoor', price: 32, rating: 4.8, reviews: 530, emoji: '🧴', bg: '#bfdbfe' },
  { id: 3, name: 'Merino Crew Tee', cat: 'Apparel', price: 58, rating: 4.5, reviews: 98, emoji: '👕', bg: '#fecaca' },
  { id: 4, name: 'Packable Rain Shell', cat: 'Apparel', price: 120, rating: 4.6, reviews: 167, emoji: '🧥', bg: '#c7d2fe' },
  { id: 5, name: 'Compact Headlamp', cat: 'Outdoor', price: 39, rating: 4.4, reviews: 310, emoji: '🔦', bg: '#fef08a' },
  { id: 6, name: 'Weekender Duffel', cat: 'Bags', price: 109, rating: 4.9, reviews: 76, emoji: '👜', bg: '#bbf7d0' },
  { id: 7, name: 'Camp Mug Set', cat: 'Outdoor', price: 24, rating: 4.3, reviews: 142, emoji: '☕', bg: '#fbcfe8' },
  { id: 8, name: 'Everyday Sneakers', cat: 'Apparel', price: 95, rating: 4.6, reviews: 389, emoji: '👟', bg: '#ddd6fe' },
];
const CODES = { WELCOME10: 0.1, SAVE20: 0.2 };
const money = (n) => '$' + n.toFixed(2);
const $ = (id) => document.getElementById(id);

let category = 'All', sort = 'featured', query = '', discount = 0;
let cart = [];
// Storage can be blocked inside sandboxed previews, so every access is guarded.
try { cart = JSON.parse(localStorage.getItem('nomad-cart') || '[]'); } catch (e) { cart = []; }

function persist() { try { localStorage.setItem('nomad-cart', JSON.stringify(cart)); } catch (e) { /* ignore */ } }

// Categories
const cats = ['All', ...new Set(products.map((p) => p.cat))];
$('cats').innerHTML = cats.map((c) => `<button class="${c === category ? 'on' : ''}" data-cat="${c}">${c}</button>`).join('');
$('cats').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  category = b.dataset.cat;
  [...$('cats').children].forEach((x) => x.classList.toggle('on', x === b));
  renderProducts();
});
$('sort').addEventListener('change', (e) => { sort = e.target.value; renderProducts(); });
$('search').addEventListener('input', (e) => { query = e.target.value.toLowerCase(); renderProducts(); });

function renderProducts() {
  let list = products.filter((p) => (category === 'All' || p.cat === category) && p.name.toLowerCase().includes(query));
  if (sort === 'low') list.sort((a, b) => a.price - b.price);
  if (sort === 'high') list.sort((a, b) => b.price - a.price);
  if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
  $('products').innerHTML = list.length
    ? list.map((p) => `
      <article class="product">
        <div class="img" style="background:${p.bg}">${p.emoji}</div>
        <div class="info">
          <h3>${p.name}</h3>
          <div class="rating">★ ${p.rating} <span>(${p.reviews})</span></div>
          <div class="price">${money(p.price)}</div>
          <button class="add" data-id="${p.id}">Add to cart</button>
        </div>
      </article>`).join('')
    : '<p class="empty">No products match your search.</p>';
}
$('products').addEventListener('click', (e) => {
  const b = e.target.closest('.add'); if (!b) return;
  addToCart(+b.dataset.id);
});

// Cart
function addToCart(id) {
  const line = cart.find((l) => l.id === id);
  line ? line.qty++ : cart.push({ id, qty: 1 });
  renderCart(); openCart();
}
function renderCart() {
  persist();
  const lines = cart.map((l) => ({ ...l, p: products.find((p) => p.id === l.id) })).filter((l) => l.p);
  $('cartCount').textContent = lines.reduce((n, l) => n + l.qty, 0);
  $('cartItems').innerHTML = lines.length
    ? lines.map((l) => `
      <div class="item">
        <div class="thumb" style="background:${l.p.bg}">${l.p.emoji}</div>
        <div><b>${l.p.name}</b><br /><small>${money(l.p.price)}</small>
          <div class="qty"><button data-act="dec" data-id="${l.id}">−</button>${l.qty}<button data-act="inc" data-id="${l.id}">+</button></div></div>
        <button class="rm" data-act="rm" data-id="${l.id}">Remove</button>
      </div>`).join('')
    : '<p class="empty">Your cart is empty.</p>';
  const subtotal = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
  $('subtotal').textContent = money(subtotal);
  $('total').textContent = money(subtotal * (1 - discount));
}
$('cartItems').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-act]'); if (!b) return;
  const id = +b.dataset.id, line = cart.find((l) => l.id === id);
  if (b.dataset.act === 'inc') line.qty++;
  if (b.dataset.act === 'dec') line.qty--;
  if (b.dataset.act === 'rm' || line.qty <= 0) cart = cart.filter((l) => l.id !== id);
  renderCart();
});
$('applyCode').addEventListener('click', () => {
  const code = $('code').value.trim().toUpperCase();
  discount = CODES[code] || 0;
  $('codeMsg').className = 'msg ' + (discount ? 'ok' : 'bad');
  $('codeMsg').textContent = discount ? `Code applied: ${discount * 100}% off` : 'Invalid promo code.';
  renderCart();
});
$('checkout').addEventListener('click', () => {
  if (!cart.length) return;
  alert('This is a demo store — checkout is not connected to a payment provider.');
});

function openCart() { $('drawer').classList.add('open'); $('scrim').classList.add('on'); }
function closeCart() { $('drawer').classList.remove('open'); $('scrim').classList.remove('on'); }
$('cartBtn').addEventListener('click', openCart);
$('closeCart').addEventListener('click', closeCart);
$('scrim').addEventListener('click', closeCart);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCart(); });

renderProducts();
renderCart();
