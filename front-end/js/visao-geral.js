const hoje = new Date().toLocaleDateString("sv-SE"); // AAAA-MM-DD no fuso local
const tabela = document.getElementById("tabela-hoje");

function desenharResumo(r) {
  document.getElementById("stat-agendamentos").textContent = r.agendamentos;
  document.getElementById("stat-atendimento").textContent = r.emAtendimento;
  document.getElementById("stat-concluidos").textContent = r.concluidos;
  document.getElementById("stat-faturamento").textContent = dinheiro(r.faturamentoPrevisto);

  document.getElementById("cap-num").textContent = `${r.boxesEmUso}/${r.boxesTotal}`;
  document.getElementById("cap-livres").textContent = `${r.boxesTotal - r.boxesEmUso} livres`;

  const caixa = document.getElementById("boxes");
  caixa.innerHTML = "";
  for (let i = 0; i < r.boxesTotal; i++) {
    const span = document.createElement("span");
    span.className = "box" + (i < r.boxesEmUso ? " ocupado" : "");
    caixa.appendChild(span);
  }
}

function desenharTabela(linhas) {
  tabela.innerHTML = "";
  if (linhas.length === 0) {
    tabela.innerHTML = '<tr><td colspan="4" class="vazio">Nenhum agendamento para hoje.</td></tr>';
    return;
  }
  linhas.forEach((l) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${esc(l.entrada)}</strong><small>até ${esc(l.conclusao)}</small></td>
      <td><strong>${esc(l.veiculo)}</strong><small>${esc(l.placa)} • ${esc(l.cliente)}</small></td>
      <td>${esc(l.servico)}</td>
      <td></td>`;

    const select = document.createElement("select");
    select.className = "seletor-status";
    Object.entries(statusInfo).forEach(([codigo, [texto]]) => {
      const op = new Option(texto, codigo, false, codigo === l.status);
      select.add(op);
    });
    select.addEventListener("change", async () => {
      try {
        await mudarStatus(l.id, select.value);
        desenharResumo(await buscarAdminResumo(hoje)); // atualiza os números
      } catch (e) {
        alert(e.message);
        carregar(); // volta ao que está no banco
      }
    });
    tr.lastElementChild.appendChild(select);
    tabela.appendChild(tr);
  });
}

async function carregar() {
  try {
    const [linhas, resumo] = await Promise.all([
      buscarAdminAgendamentos(hoje),
      buscarAdminResumo(hoje),
    ]);
    desenharResumo(resumo);
    desenharTabela(linhas);
  } catch (e) {
    tabela.innerHTML = '<tr><td colspan="4" class="vazio">Não foi possível carregar. A API está ligada?</td></tr>';
  }
}
carregar();