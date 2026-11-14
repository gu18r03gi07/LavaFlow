const campoDia = document.getElementById("dia");
const tabela = document.getElementById("tabela");

async function carregar() {
  try {
    const linhas = await buscarAdminAgendamentos(campoDia.value);
    tabela.innerHTML = "";
    if (linhas.length === 0) {
      tabela.innerHTML = '<tr><td colspan="4" class="vazio">Nenhum veículo agendado para este dia.</td></tr>';
      return;
    }
    linhas.forEach((l) => {
      const [texto, classe] = statusInfo[l.status] || [l.status, "etiqueta"];
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${esc(l.entrada)}</strong><small>até ${esc(l.conclusao)}</small></td>
        <td><strong>${esc(l.veiculo)}</strong><small>${esc(l.placa)} • ${esc(l.cliente)}</small></td>
        <td>${esc(l.servico)}</td>
        <td><span class="${classe}">${texto}</span></td>`;
      tabela.appendChild(tr);
    });
  } catch (e) {
    tabela.innerHTML = '<tr><td colspan="4" class="vazio">Não foi possível carregar. A API está ligada?</td></tr>';
  }
}

campoDia.value = new Date().toLocaleDateString("sv-SE");
campoDia.addEventListener("change", carregar);
carregar();