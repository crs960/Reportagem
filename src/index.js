const express = require('express');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const admin = require("./admin");

const app = express();
const PORT = 8080;

app.use(session({
  secret: 'segredo-super-seguro',
  resave: false,
  saveUninitialized: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(express.urlencoded({ extended: true }));

app.use("/admin/professora",admin);

const docsDir = path.join(__dirname, '../docs');

//Página inicial
app.get("/", (_,res) => {
  res.render("home");
})

//Listagem de arquivos por grupo
app.get('/:group', (req, res) => {
  const { group } = req.params;
  if (!['A','B'].includes(group)) {
    return res.status(404).send('Grupo não existe');
  }
  const folder = path.join(docsDir, group);
  fs.readdir(folder, (err, files) => {
    if (err) return res.status(500).send('Erro ao ler pasta');
    const links = files
      .filter(f => path.extname(f)==='.html')
      .map(f => ({
        name: path.basename(f, '.html'),
        url: `/${group}/${path.basename(f, '.html')}`
      }));
    res.render('group', { group, links });
  });
});

//Visualização de um arquivo
app.get('/:group/:page', (req, res) => {
  const { group, page } = req.params;
  const filePath = path.join(docsDir, group, page + '.html');
  fs.readFile(filePath, 'utf8', (err, content) => {
    if (err) return res.status(404).send('Página não encontrada');
    res.render('wrapper', { content });
  });
});

app.listen(PORT, () => console.log(`Server em http://localhost:${PORT}`));