const path = require('path');
const jsonServer = require('json-server');

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));

let cart = [];
let lastCheckoutEmail = '';

const validUsers = new Map([
  ['test01@test.com', 'Test1234'],
  ['test02@test.com', 'Test1234'],
  ['usuario@gmail.com', 'Password123'],
  ['cliente@audiomusica.com', 'Password123']
]);

const catalog = [
  { id: '101', name: 'laptop', category: 'Electrónica', price: 1200, vendor: 'Tech Store' },
  { id: '102', name: 'bicicleta', category: 'Deportes', price: 450, vendor: 'Bike House' },
  { id: '103', name: 'celular', category: 'Electrónica', price: 900, vendor: 'Mobile Hub' },
  { id: '201', name: 'camiseta', category: 'Ropa', price: 35, vendor: 'Fashion Club' },
  { id: '301', name: 'lampara', category: 'Hogar', price: 60, vendor: 'Home Center' },
  { id: '1', name: 'Guitarra', category: 'Instrumentos', price: 300, vendor: 'AudioMusica' },
  { id: '2', name: 'Bajo', category: 'Instrumentos', price: 350, vendor: 'AudioMusica' }
];

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function findCatalogProduct(value) {
  const query = normalize(value);
  if (!query) {
    return null;
  }

  return catalog.find(product =>
    normalize(product.id) === query || normalize(product.name).includes(query)
  ) || null;
}

function findCartItem(value) {
  const query = normalize(value);
  if (!query) {
    return null;
  }

  return cart.find(item =>
    normalize(item.id) === query ||
    normalize(item.name) === query ||
    normalize(item.id).includes(query) ||
    normalize(item.name).includes(query)
  ) || null;
}

function makeCartItem(payloadValue, product) {
  const requested = String(payloadValue || '').trim();
  if (product) {
    return {
      id: product.id,
      name: product.name,
      category: product.category,
      quantity: 1
    };
  }

  return {
    id: requested,
    name: requested,
    quantity: 1
  };
}

function addToCart(payload) {
  const rawValue = payload.id || payload.productId || payload.name || '';
  const product = findCatalogProduct(rawValue);
  const cartKey = String(rawValue || (product && product.id) || '').trim();

  if (!cartKey) {
    return null;
  }

  const existing = findCartItem(cartKey);
  if (existing) {
    existing.quantity += 1;
    return existing;
  }

  const item = makeCartItem(cartKey, payload.id ? findCatalogProduct(payload.id) : null);
  if (product && !payload.name) {
    item.name = product.name;
    item.category = product.category;
  }
  cart.push(item);
  return item;
}

function updateCartItem(id, quantity) {
  const item = findCartItem(id);
  if (!item) {
    return null;
  }

  item.quantity = quantity;
  item.subtotal = quantity * 100;
  return item;
}

function removeCartItem(id) {
  const before = cart.length;
  cart = cart.filter(item => !findCartItemMatch(item, id));
  return cart.length !== before;
}

function findCartItemMatch(item, value) {
  const query = normalize(value);
  return normalize(item.id) === query ||
    normalize(item.name) === query ||
    normalize(item.id).includes(query) ||
    normalize(item.name).includes(query);
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function loginResponse(req, res) {
  const body = req.body || {};
  const username = (body.user || body.email || '').toString().trim();
  const password = (body.password || '').toString();

  if (!username || !password) {
    return res.status(400).json({ error: 'Credenciales requeridas' });
  }

  if (validUsers.get(username) === password) {
    return res.status(200).json({
      status: 'success',
      token: 'mock-token-' + username.replace(/[^a-z0-9]/gi, '').toLowerCase(),
      user: { email: username }
    });
  }

  return res.status(400).json({ error: 'Credenciales inválidas' });
}

function registerResponse(req, res) {
  const body = req.body || {};

  if (body.continue) {
    if (!lastCheckoutEmail || !validateEmail(lastCheckoutEmail)) {
      return res.status(400).json({ error: 'Correo inválido' });
    }

    return res.status(200).json({ status: 'continue_ok' });
  }

  if (Object.prototype.hasOwnProperty.call(body, 'email') && Object.prototype.hasOwnProperty.call(body, 'password')) {
    if (!String(body.email || '').trim() || !String(body.password || '').trim()) {
      return res.status(400).json({ errors: ['email', 'password'] });
    }

    return res.status(200).json({
      status: 'checkout_started',
      message: 'Checkout iniciado correctamente'
    });
  }

  if (Object.prototype.hasOwnProperty.call(body, 'email')) {
    lastCheckoutEmail = String(body.email || '').trim();
    if (!lastCheckoutEmail) {
      return res.status(400).json({ error: 'Correo requerido' });
    }
    return res.status(200).json({ status: 'email_saved' });
  }

  return res.status(400).json({ errors: ['email', 'password'] });
}

server.use(jsonServer.bodyParser);

server.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Mock API activo' });
});

server.get('/search', (req, res) => {
  const query = (req.query.query || '').toString().trim();
  const normalized = normalize(query);

  const results = catalog.filter(product =>
    normalize(product.name).includes(normalized) || normalize(product.category).includes(normalized)
  );

  res.status(200).json({ results });
});

server.post('/auth/login', (req, res) => {
  return loginResponse(req, res);
});

server.post('/login', (req, res) => {
  return loginResponse(req, res);
});

server.post('/auth/register', (req, res) => {
  const body = req.body || {};
  const email = (body.email || body.user || '').toString().trim();

  if (!email) {
    return res.status(400).json({ error: 'Email requerido' });
  }

  res.status(200).json({ message: 'Account Created!' });
});

server.post('/register', (req, res) => {
  return registerResponse(req, res);
});

server.get('/cart', (req, res) => {
  res.status(200).json({ cart: { items: cart } });
});

server.post('/cart/reset', (req, res) => {
  cart = [];
  res.status(200).json({ status: 'cart_reset' });
});

server.get('/users', (req, res) => {
  res.status(200).json({ cart: { items: cart } });
});

server.get('/users/:id', (req, res) => {
  const product = findCatalogProduct(req.params.id);
  if (!product) {
    return res.status(404).json({});
  }

  return res.status(200).json({ data: [product] });
});

server.post('/cart/add', (req, res) => {
  const payload = req.body || {};
  const added = addToCart(payload);
  if (!added) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  return res.status(200).json({ cart: { items: cart }, status: 'added' });
});

server.post('/users', (req, res) => {
  const payload = req.body || {};
  const added = addToCart(payload);
  if (!added) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  return res.status(200).json({ cart: { items: cart }, status: 'added' });
});

server.delete('/cart/remove/:id', (req, res) => {
  removeCartItem(req.params.id);
  cart = [];
  res.status(204).end();
});

server.delete('/users/:id', (req, res) => {
  removeCartItem(req.params.id);
  res.status(204).end();
});

server.put('/cart/update', (req, res) => {
  const payload = req.body || {};
  const id = String(payload.id || req.query.id || '').trim();
  const quantity = Number(payload.quantity || 1);

  const item = updateCartItem(id, quantity);
  if (!item) {
    return res.status(404).json({ error: 'Producto no encontrado en el carrito' });
  }

  return res.status(200).json({ cart: { items: cart }, quantity: item.quantity, subtotal: item.subtotal });
});

server.put('/users/:id', (req, res) => {
  const quantity = Number((req.body || {}).quantity || 1);
  const item = updateCartItem(req.params.id, quantity);
  if (!item) {
    return res.status(404).json({ error: 'Producto no encontrado en el carrito' });
  }

  return res.status(200).json({
    cart: { items: cart },
    quantity: item.quantity,
    subtotal: item.subtotal
  });
});

server.post('/checkout/start', (req, res) => {
  const body = req.body || {};
  if (Object.keys(body).length === 0) {
    return res.status(200).json({ status: 'checkout_started', message: 'Checkout iniciado correctamente' });
  }

  if (!Object.prototype.hasOwnProperty.call(body, 'email') || !Object.prototype.hasOwnProperty.call(body, 'password')) {
    return res.status(400).json({ errors: ['email', 'password'] });
  }

  if (!String(body.email || '').trim() || !String(body.password || '').trim()) {
    return res.status(400).json({ errors: ['email', 'password'] });
  }

  res.status(200).json({ status: 'checkout_started', message: 'Checkout iniciado correctamente' });
});

server.post('/checkout/email', (req, res) => {
  const email = (req.body && req.body.email) ? req.body.email.toString() : '';

  if (!email || email.endsWith('@') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Correo inválido' });
  }

  lastCheckoutEmail = email;
  return res.status(200).json({ status: 'email_valid' });
});

server.post('/messenger/contact', (req, res) => {
  res.status(200).json({ status: 'message_sent' });
});

server.use(router);

server.listen(3000, () => {
  console.log('Mock API listening on http://localhost:3000');
});
