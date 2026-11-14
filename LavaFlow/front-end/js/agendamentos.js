const lista = document.getElementById("lista-agendamentos");
const botoesFiltro = document.querySelectorAll(".filtro");
let agendamentos = [];
let filtroAtual = "todos";

// o banco guarda AGENDADO/RECEBIDO/EM_LAVAGEM/CONCLUIDO/CANCELADO
const rotulos = {
  AGENDADO: ["Agendado", "etiqueta"],
  RECEBIDO: ["Recebido", "etiqueta etiqueta-amarela"],
  EM_LAVAGEM: ["Em lavagem", "etiqueta etiqueta-roxa"],
  CONCLUIDO: ["Concluído", "etiqueta etiqueta-verde"],
  CANCELADO: ["Cancelado", "etiqueta etiqueta-vermelha"],
};

const emAndamento = ["AGENDADO", "RECEBIDO", "EM_LAVAGEM"];

function passaNoFiltro(a) {
  if (filtroAtual === "todos") return true;
  if (filtroAtual === "proximo") return emAndamento.includes(a.status);
  if (filtroAtual === "concluido") return a.status === "CONCLUIDO";
  if (filtroAtual === "cancelado") return a.status === "CANCELADO";
  return true;
}

function criarCartao(a) {
  const [texto, classe] = rotulos[a.status] || [a.status, "etiqueta"];
  const cartao = document.createElement("article");
  cartao.className = "cartao agendamento";
  cartao.innerHTML = `
    <div class="agendamento-topo">
      <div>
        <h3><span class="a-servico"></span> <span class="${classe}">${texto}</span></h3>
        <p class="texto-suave a-veiculo"></p>
        <p class="texto-suave">Agendamento #LF-${a.id}</p>
      </div>
      <strong class="agendamento-preco">${dinheiro(a.preco)}</strong>
    </div>
    <div class="agendamento-base">
      <div><small>Data</small><strong>${dataCurta(a.data)}, ${a.data.slice(0, 4)}</strong></div>
      <div><small>Entrada</small><strong>${a.entrada}</strong></div>
      <div><small>Conclusão</small><strong>${a.conclusao}</strong></div>
      <div><small>Duração</small><strong>${a.duracaoMin} min</strong></div>
      <div class="agendamento-botoes"></div>
    </div>`;
  cartao.querySelector(".a-servico").textContent = a.servico;
  cartao.querySelector(".a-veiculo").textContent = `${a.veiculo} • ${a.placa}`;

  // só dá para cancelar o que ainda está só agendado
  if (a.status === "AGENDADO") {
    const btn = document.createElement("button");
    btn.className = "botao botao-perigo";
    btn.textContent = "Cancelar";
    btn.addEventListener("click", async () => {
      if (!confirm("Deseja mesmo cancelar este agendamento?")) return;
      try {
        await cancelarAgendamento(a.id);
        a.status = "CANCELADO";
        desenhar();
      } catch (e) {
        alert(e.message);
      }
    });
    cartao.querySelector(".agendamento-botoes").appendChild(btn);
  }
  return cartao;
}

function desenhar() {
  lista.innerHTML = "";
  const visiveis = agendamentos.filter(passaNoFiltro);
  if (visiveis.length === 0) {
    lista.innerHTML = '<p class="texto-suave">Nenhum agendamento por aqui.</p>';
    return;
  }
  visiveis.forEach((a) => lista.appendChild(criarCartao(a)));
}

botoesFiltro.forEach((botao) => {
  botao.addEventListener("click", () => {
    botoesFiltro.forEach((b) => b.classList.remove("ativo"));
    botao.classList.add("ativo");
    filtroAtual = botao.dataset.filtro;
    desenhar();
  });
});

async function iniciar() {
  try {
    agendamentos = await buscarAgendamentos();
  } catch (e) {
    lista.textContent = "Não foi possível carregar os agendamentos. A API está ligada?";
    return;
  }
  desenhar();
}
iniciar();