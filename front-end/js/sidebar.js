// Monta a sidebar conforme o data-area do <body>: "cliente" ou "admin".
// O item ativo vem do nome do arquivo na URL (ex.: agenda.html).
const area = document.body.dataset.area;
const arquivoAtual = location.pathname.split("/").pop().replace(".html", "");

const menus = {
  cliente: {
    titulo: "Área do cliente",
    nome: "Marina Alves",
    detalhe: "marina@email.com",
    iniciais: "MA",
    links: [
      ["Início", "inicio.html"],
      ["Agendar lavagem", "agendar.html"],
      ["Meus veículos", "veiculos.html"],
      ["Meus agendamentos", "agendamentos.html"],
    ],
    troca: ["Acessar administração", "../admin/visao-geral.html"],
  },
  admin: {
    titulo: "Área administrativa",
    nome: "Unidade Centro",
    detalhe: "Administrador",
    iniciais: "UC",
    links: [
      ["Visão geral", "visao-geral.html"],
      ["Agenda", "agenda.html"],
      ["Veículos agendados", "veiculos-agendados.html"],
      ["Serviços e preços", "servicos.html"],
    ],
    troca: ["Ver área do cliente", "../cliente/inicio.html"],
  },
};

const menu = menus[area];

const linksHtml = menu.links
  .map(([texto, href]) => {
    const ativo = href.replace(".html", "") === arquivoAtual;
    return `<a href="${href}" class="${ativo ? "ativo" : ""}">${texto}</a>`;
  })
  .join("");

document.getElementById("sidebar").innerHTML = `
  <a href="../index.html" class="logo">Lava<span>Flow</span></a>
  <div class="perfil">
    <div class="avatar">${menu.iniciais}</div>
    <div><small>${menu.titulo}</small><strong>${menu.nome}</strong><small>${menu.detalhe}</small></div>
  </div>
  <nav class="menu">${linksHtml}</nav>
  <nav class="menu menu-rodape">
    <a href="${menu.troca[1]}">${menu.troca[0]}</a>
    <a href="../login.html">Sair</a>
  </nav>
`;