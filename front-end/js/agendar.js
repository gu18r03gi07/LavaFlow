let servicos = [];
let servico = null;
const veiculos = ["Volkswagen T-Cross • ABC-1D23", "Honda Civic • EKO-7F89"]; // vira API no passo 18
let etapa = 1;

// ---------- disponibilidade (dados falsos; no Java isso vem do banco) ----------
const ABRE = paraMinutos("08:00");
const FECHA = paraMinutos("18:00");
const PASSO = 30;
const NUM_BOXES = 3;

const ocupados = [
  { box: 1, inicio: paraMinutos("09:00"), fim: paraMinutos("10:00") },
  { box: 1, inicio: paraMinutos("13:00"), fim: paraMinutos("16:00") },
  { box: 2, inicio: paraMinutos("13:30"), fim: paraMinutos("15:30") },
  { box: 3, inicio: paraMinutos("12:00"), fim: paraMinutos("16:30") },
];

function boxLivre(inicio, duracao) {
  const fim = inicio + duracao;
  if (inicio < ABRE || fim > FECHA) return null;

  for (let box = 1; box <= NUM_BOXES; box++) {
    const temConflito = ocupados.some(
      (o) => o.box === box && inicio < o.fim && fim > o.inicio
    );
    if (!temConflito) return box;
  }
  return null;
}

function sugerirHorarios(pedido, duracao, quantidade = 3) {
  const livres = [];
  for (let t = ABRE; t + duracao <= FECHA; t += PASSO) {
    if (t !== pedido && boxLivre(t, duracao) !== null) livres.push(t);
  }
  return livres
    .sort((a, b) => Math.abs(a - pedido) - Math.abs(b - pedido))
    .slice(0, quantidade)
    .sort((a, b) => a - b);
}

function mostrarSugestoes(pedido) {
  const data = document.getElementById("data").value;
  const caixa = document.getElementById("sugestoes");
  const lista = document.getElementById("lista-sugestoes");
  const sugestoes = sugerirHorarios(pedido, servico.duracaoMin);

  lista.innerHTML = "";
  if (sugestoes.length === 0) {
    lista.textContent = "Não há horários livres nesse dia. Tente outra data.";
  }
  sugestoes.forEach((t) => {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "sugestao";
    botao.innerHTML = `<strong>${paraHora(t)}</strong>
      <span>${dataCurta(data)} • pronto às ${paraHora(t + servico.duracaoMin)}</span>`;
    botao.addEventListener("click", () => {
      document.getElementById("hora").value = paraHora(t);
      caixa.classList.add("escondido");
      atualizarResumo();
    });
    lista.appendChild(botao);
  });
  caixa.classList.remove("escondido");
}

// ---------- telas ----------
function desenharServicos() {
  const lista = document.getElementById("lista-servicos");
  lista.innerHTML = "";
  servicos.forEach((s) => {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "opcao-servico" + (s === servico ? " selecionado" : "");
    botao.innerHTML = `
      <div><strong>${s.nome}</strong><span>${s.descricao}</span></div>
      <div class="direita"><strong>${dinheiro(s.preco)}</strong><span>${s.duracaoMin} min</span></div>`;
    botao.addEventListener("click", () => {
      servico = s;
      desenharServicos();
      atualizarResumo();
    });
    lista.appendChild(botao);
  });
}

function atualizarResumo() {
  document.getElementById("resumo-nome").textContent = servico.nome;
  document.getElementById("resumo-duracao").textContent = servico.duracaoMin + " minutos";
  document.getElementById("resumo-total").textContent = dinheiro(servico.preco);

  const data = document.getElementById("data").value;
  const hora = document.getElementById("hora").value;
  const quando = document.getElementById("resumo-quando");

  if (data && hora) {
    quando.textContent = `${dataCurta(data)} • ${hora} às ${somarMinutos(hora, servico.duracaoMin)}`;
  } else {
    quando.textContent = data ? dataCurta(data) : "";
  }
}

function mostrarEtapa(n) {
  etapa = n;
  [1, 2, 3].forEach((i) =>
    document.getElementById("etapa-" + i).classList.toggle("escondido", i !== n));
  document.querySelectorAll(".passos li").forEach((li, i) =>
    li.classList.toggle("ativo", i + 1 <= n));
  document.getElementById("btn-continuar").textContent = n === 3 ? "Confirmar agendamento" : "Continuar";
}

function preencherConfirmacao() {
  const data = document.getElementById("data").value;
  const hora = document.getElementById("hora").value;
  const veiculo = document.getElementById("veiculo").value;
  const dataBr = data.split("-").reverse().join("/");

  document.getElementById("confirmacao").innerHTML = `
    <li><span>Serviço</span><strong>${servico.nome}</strong></li>
    <li><span>Veículo</span><strong>${veiculo}</strong></li>
    <li><span>Data</span><strong>${dataBr}</strong></li>
    <li><span>Entrada</span><strong>${hora}</strong></li>
    <li><span>Previsão de saída</span><strong>${somarMinutos(hora, servico.duracaoMin)}</strong></li>
    <li><span>Total</span><strong>${dinheiro(servico.preco)}</strong></li>`;
}

document.getElementById("btn-continuar").addEventListener("click", () => {
  if (etapa === 2) {
    const erro = document.getElementById("erro");
    const hora = document.getElementById("hora").value;

    if (!document.getElementById("data").value || !hora) {
      erro.textContent = "Escolha o dia e o horário.";
      erro.classList.remove("escondido");
      return;
    }
    erro.classList.add("escondido");

    // horário lotado (ou fora do expediente)? mostra alternativas e não avança
    if (boxLivre(paraMinutos(hora), servico.duracaoMin) === null) {
      mostrarSugestoes(paraMinutos(hora));
      return;
    }

    document.getElementById("sugestoes").classList.add("escondido");
    preencherConfirmacao();
  }
  if (etapa === 3) {
    // aqui, depois, vai o fetch para a API
    alert("Agendamento confirmado!");
    window.location.href = "agendamentos.html";
    return;
  }
  mostrarEtapa(etapa + 1);
});

document.getElementById("btn-voltar").addEventListener("click", () => {
  if (etapa === 1) window.location.href = "inicio.html";
  else mostrarEtapa(etapa - 1);
});

// ao mexer no dia/hora: esconde sugestões antigas e atualiza o resumo
["hora", "data"].forEach((id) =>
  document.getElementById(id).addEventListener("input", () => {
    document.getElementById("sugestoes").classList.add("escondido");
    atualizarResumo();
  }));

// ---------- inicialização ----------
async function iniciar() {
  document.getElementById("veiculo").innerHTML = veiculos.map((v) => `<option>${v}</option>`).join("");
  document.getElementById("data").min = new Date().toLocaleDateString("sv-SE");

  try {
    servicos = await buscarServicos();
    // se veio do Início ou da landing (agendar.html?servico=3), já deixa esse selecionado
    const idDaUrl = Number(new URLSearchParams(location.search).get("servico"));
    servico = servicos.find((s) => s.id === idDaUrl) || servicos[1] || servicos[0];
    desenharServicos();
    atualizarResumo();
  } catch (erro) {
    document.getElementById("lista-servicos").textContent =
      "Não foi possível carregar os serviços. A API está ligada?";
  }
}
iniciar();