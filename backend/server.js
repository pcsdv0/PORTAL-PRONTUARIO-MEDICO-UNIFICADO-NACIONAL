require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const pool = require('./models/db');
const authMiddleware = require('./middlewares/auth');

const authRoutes = require('./routes/auth');
const usuarioRoutes = require('./routes/usuarios');
const pacienteRoutes = require('./routes/pacientes');
const prontuarioRoutes = require('./routes/prontuarios');

const exphbs = require('express-handlebars');
const app = express();
const PORT = process.env.PORT || 3000;

const FRONTEND_PATH = path.join(__dirname, '..', 'frontend');

const hbs = exphbs.create({
  layoutsDir: path.join(FRONTEND_PATH, 'views', 'layouts'),
  defaultLayout: 'main',
  helpers: {
    eq: (a, b) => a === b,
    ne: (a, b) => a !== b,
    lt: (a, b) => a < b,
    gt: (a, b) => a > b,
    lte: (a, b) => a <= b,
    gte: (a, b) => a >= b,
    and: (a, b) => a && b,
    or: (a, b) => a || b
  }
});
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', path.join(FRONTEND_PATH, 'views'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(FRONTEND_PATH, 'public')));

// Função para remover acentos e normalizar strings
const removeAccents = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// Middleware específico para verificar se é administrador
function adminOnly(req, res, next) {
  if (req.usuario) {
    const funcaoNormalized = removeAccents(req.usuario.funcao);
    if (funcaoNormalized === 'administrador') {
      return next();
    }
  }
  return res.status(403).send('Acesso negado. Somente administradores.');
}

app.get('/', (req, res) => {
  res.render('home');
});

app.post('/login', async (req, res) => {
  const { login, senha, funcao } = req.body;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM usuarios WHERE nome_usuario = ? AND senha = ? AND funcao = ?',
      [login, senha, funcao]
    );

    if (rows.length === 0) {
      return res.render('home', { error: 'Credenciais inválidas. Tente novamente.' });
    }

    const usuario = rows[0];
    const token = jwt.sign(
      { id: usuario.id, nome_usuario: usuario.nome_usuario, funcao: usuario.funcao },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('token', token, { httpOnly: true });
    res.redirect('/login');
  } catch (err) {
    console.error('Erro ao autenticar:', err);
    res.status(500).render('home', { error: 'Erro interno ao tentar fazer login.' });
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

app.get('/login', authMiddleware, async (req, res) => {
  const usuarioModel = require('./models/usuario');
  try {
    const usuario = await usuarioModel.findById(req.userId);
    const funcaoNormalized = removeAccents(usuario.funcao);
    const isAdmin = funcaoNormalized === 'administrador';
    res.render('login', { usuario, isAdmin });
  } catch (err) {
    console.error('Erro ao carregar página de login:', err);
    res.status(500).send('Erro ao carregar página');
  }
});

// API protegida
app.use('/api/login', authRoutes);
app.use('/api/usuarios', authMiddleware, adminOnly, usuarioRoutes);
app.use('/api/pacientes', authMiddleware, pacienteRoutes);
app.use('/api/prontuarios', authMiddleware, prontuarioRoutes);

// Rotas de visualização protegidas
app.use('/usuarios', authMiddleware, adminOnly, usuarioRoutes);
app.use('/pacientes', authMiddleware, pacienteRoutes);
app.use('/prontuarios', authMiddleware, prontuarioRoutes);

app.get('/pacientes/novo', authMiddleware, async (req, res) => {
  const usuarioModel = require('./models/usuario');
  try {
    const usuario = await usuarioModel.findById(req.userId);
    res.render('pacienteNovo', { usuario });
  } catch (err) {
    console.error('Erro ao exibir formulário de novo paciente:', err);
    res.status(500).send('Erro ao carregar o formulário');
  }
});

app.get('/pacientes/editar/:id', authMiddleware, async (req, res) => {
  const usuarioModel = require('./models/usuario');
  const pacienteId = req.params.id;

  try {
    const usuario = await usuarioModel.findById(req.userId);
    const [rows] = await pool.query('SELECT * FROM pacientes WHERE id = ?', [pacienteId]);

    if (rows.length === 0) {
      return res.status(404).send('Paciente não encontrado');
    }

    const paciente = rows[0];
    res.render('pacienteEditar', { usuario, paciente });
  } catch (err) {
    console.error('Erro ao carregar formulário de edição:', err);
    res.status(500).send('Erro ao carregar formulário de edição');
  }
});

app.post('/pacientes/excluir/:id', authMiddleware, async (req, res) => {
  const pacienteId = req.params.id;

  try {
    await pool.query('DELETE FROM pacientes WHERE id = ?', [pacienteId]);
    res.redirect('/pacientes');
  } catch (err) {
    console.error('Erro ao excluir paciente:', err);
    res.status(500).send('Erro ao excluir paciente');
  }
});

app.post('/pacientes', authMiddleware, async (req, res) => {
  const { nome, data_nascimento, endereco, telefone } = req.body;
  try {
    await pool.query(
      'INSERT INTO pacientes (nome, data_nascimento, endereco, telefone) VALUES (?, ?, ?, ?)',
      [nome, data_nascimento, endereco, telefone]
    );
    res.redirect('/pacientes');
  } catch (err) {
    console.error('Erro ao criar paciente:', err);
    res.status(500).render('pacienteNovo', { error: 'Erro ao salvar paciente' });
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno no servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
