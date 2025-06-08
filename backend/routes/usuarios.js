// backend/routes/usuarios.js

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/usuarioController');

// ----- VIEWS (renderizadas com Handlebars) -----

// Lista de usuários
router.get('/', ctrl.renderView);

// Formulário: novo usuário
router.get('/novo', ctrl.renderFormNovo);

// Formulário: editar usuário
router.get('/editar/:id', ctrl.renderFormEditar);

// Processa edição via formulário
router.post('/editar/:id', ctrl.update);

// Processa exclusão via formulário
router.post('/excluir/:id', ctrl.remove);

// Cria novo usuário via formulário
router.post('/', ctrl.create);

// ----- API REST (JSON) - essas ficam por último -----

// Retorna um usuário em JSON
router.get('/api/:id', ctrl.getById);

// Atualiza usuário via API
router.put('/:id', ctrl.update);

// Deleta usuário via API
router.delete('/:id', ctrl.remove);

module.exports = router;
