// middleware/adminOnly.js

// Função para remover acentos e normalizar string
const removeAccents = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

module.exports = (req, res, next) => {
  if (req.usuario && req.usuario.funcao) {
    // Normaliza a função: minusculo e sem acentos
    const funcaoNormalized = removeAccents(req.usuario.funcao.toLowerCase());
    if (funcaoNormalized === 'administrador') {
      return next(); // é admin, pode continuar
    }
  }
  // Não é admin
  return res.status(403).send('Acesso restrito a administradores');
};
