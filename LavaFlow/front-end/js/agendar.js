let servicos = [];
let servico = null;
let etapa = 1;

function mostrarSugestoes(horas) {
  const data = document.getElementById("data").value;
  const caixa = document.getElementById("sugestoes");
  const lista = document.getElementById("lista-sugestoes");

  lista.innerHTML = "";
  if (horas.length === 0) {
    lista.textContent = "Não há horários livres nesse dia. Tente outra data.";
  }
  horas.forEach((h) => {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "sugestao";
    botao.innerHTML = `<strong>${h}</strong>
      <span>${dataCurta(data)} • pronto às ${somarMinutos(h, servico.duracaoMin)}</span>`;
    botao.addEventListener("click", () => {
      document.getElementById("hora").value = h;
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
  // o value do select é o id; o nome do veículo está no texto da opção
  const select = document.getElementById("veiculo");
  const veiculo = select.options[select.selectedIndex].text;
  const dataBr = data.split("-").reverse().join("/");

  document.getElementById("confirmacao").innerHTML = `
    <li><span>Serviço</span><strong>${servico.nome}</strong></li>
    <li><span>Veículo</span><strong>${veiculo}</strong></li>
    <li><span>Data</span><strong>${dataBr}</strong></li>
    <li><span>Entrada</span><strong>${hora}</strong></li>
    <li><span>Previsão de saída</span><strong>${somarMinutos(hora, servico.duracaoMin)}</strong></li>
    <li><span>Total</span><strong>${dinheiro(servico.preco)}</strong></li>`;
}

document.getElementById("btn-continuar").addEventListener("click", async () => {
  const botao = document.getElementById("btn-continuar");

  if (etapa === 2) {
    const erro = document.getElementById("erro");
    const data = document.getElementById("data").value;
    const hora = document.getElementById("hora").value;

    if (!data || !hora) {
      erro.textContent = "Escolha o dia e o horário.";
      erro.classList.remove("escondido");
      return;
    }
    erro.classList.add("escondido");

    try {
      const disp = await verificarHorario(data, hora, servico.id);
      if (!disp.disponivel) {
        mostrarSugestoes(disp.sugestoes);
        return;
      }
    } catch (e) {
      erro.textContent = e.message + " A API está ligada?";
      erro.classList.remove("escondido");
      return;
    }

    document.getElementById("sugestoes").classList.add("escondido");
    preencherConfirmacao();
  }

  if (etapa === 3) {
    const veiculoId = Number(document.getElementById("veiculo").value);
    botao.disabled = true; // evita clique duplo
    try {
      await criarAgendamento({
        veiculoId,
        servicoId: servico.id,
        data: document.getElementById("data").value,
        hora: document.getElementById("hora").value,
      });
      window.location.href = "agendamentos.html";
    } catch (e) {
      botao.disabled = false;
      alert(e.message);
      if (e.sugestoes && e.sugestoes.length) {
        mostrarEtapa(2);
        mostrarSugestoes(e.sugestoes);
      }
    }
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
  document.getElementById("data").min = new Date().toLocaleDateString("sv-SE");

  // veículos vindos da API (o value é o id)
  try {
    const lista = await buscarVeiculos();
    document.getElementById("veiculo").innerHTML = lista
      .map((v) => `<option value="${v.id}">${v.marca} ${v.modelo} • ${v.placa}</option>`)
      .join("");
  } catch (e) {
    document.getElementById("veiculo").innerHTML = "<option>Erro ao carregar veículos</option>";
  }

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