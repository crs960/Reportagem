const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const session = require('express-session');
const app = express();


const router = express.Router();

const docsDir = path.join(__dirname, '../docs');

app.use(session({
  secret: 'segredo-super-seguro',
  resave: false,
  saveUninitialized: true
}));

app.use(express.urlencoded({ extended: true }));

const storage = multer.diskStorage({
  destination: (req, _, cb) => {
    const group = req.params.group;
    if (!['A','B'].includes(group)) {
      return cb(new Error('Grupo inválido'), null);
    }
    const dir = path.join(docsDir, group);
    cb(null, dir);
  },
  filename: (req, _, cb) => {
    // salva com o nome passado na URL
    cb(null, req.params.filename);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, _, cb) => {
    if (path.extname(req.params.filename) !== '.html') {
      return cb(new Error('Apenas .html são permitidos'));
    }
    cb(null, true);
  }
});

router.get('/home', requireLogin,(req, res) => {
  res.render('admin', { session: req.session });
});

router.post('/:group/:filename', upload.single('file'), (_, res) => {
    res.redirect("/admin/professora/home");
});
  
router.delete('/:group/:filename', (req, res) => {
    const { group, filename } = req.params;
    const filePath = path.join(docsDir, group, filename);
    fs.unlink(filePath, err => {
      if (err) {
        if (err.code==='ENOENT') return res.status(404).send('Arquivo não encontrado');
        return res.status(500).send('Erro ao deletar');
      }
      res.send(`Arquivo ${filename} removido de ${group}`);
    });
});


const USERNAME = 'Joseane';
const PASSWORD = 'o2Béamelhorturma';

router.get('/login', (_, res) => {
  res.render('login');
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === USERNAME && password === PASSWORD) {
    req.session.authenticated = true;
    res.redirect('/admin/professora/home');
  } else {
    res.render('login', { error: 'Usuário ou senha incorretos' });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

function requireLogin(req, res, next) {
  if (req.session.authenticated) return next();
  res.redirect('/admin/professora/login');
}


module.exports = router;