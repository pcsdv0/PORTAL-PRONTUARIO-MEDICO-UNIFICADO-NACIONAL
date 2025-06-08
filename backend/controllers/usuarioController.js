// backend/controllers/usuarioController.js

const Usuario = require('../models/usuario');

// Lista de usuários - renderiza view com todos os usuários
exports.renderView = async (req, res, next) => {
  try {
    const usuarios = await Usuario.findAll();
    res.render('usuarios', { usuarios });  // "usuarios.handlebars" com a lista
  } catch (err) {
    next(err);
  }
};

// Renderiza formulário para criar novo usuário
exports.renderFormNovo = (req, res) => {
  res.render('usuarioNovo');  // seu template para novo usuário
};

// Renderiza formulário para editar usuário pelo ID
exports.renderFormEditar = async (req, res, next) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) {
      return res.status(404).send('Usuário não encontrado');
    }
    res.render('usuarioEditar', { usuario });
  } catch (err) {
    next(err);
  }
};

// API: retorna usuário em JSON
exports.getById = async (req, res, next) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(usuario);
  } catch (err) {
    next(err);
  }
};

// API: cria novo usuário
exports.create = async (req, res, next) => {
  try {
    const created = await Usuario.create(req.body);
    // Se a requisição é via formulário (content-type application/x-www-form-urlencoded)
    // redireciona para a lista de usuários
    if (req.headers.accept && req.headers.accept.includes('html')) {
      return res.redirect('/usuarios');
    }
    // Caso contrário, retorna JSON (API)
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

// Atualiza usuário (API e formulário)
exports.update = async (req, res, next) => {
  try {
    const updated = await Usuario.update(req.params.id, req.body);
    if (req.headers.accept && req.headers.accept.includes('html')) {
      return res.redirect('/usuarios');
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// Remove usuário (API e formulário)
exports.remove = async (req, res, next) => {
  try {
    await Usuario.remove(req.params.id);
    if (req.headers.accept && req.headers.accept.includes('html')) {
      return res.redirect('/usuarios');
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
