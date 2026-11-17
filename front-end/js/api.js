const API = "https://congenial-guacamole-v6wv4q5p76vwfpp9p-8080.app.github.dev";

async function buscarServicos() {
  const resposta = await fetch(`${API}/servicos`);
  if (!resposta.ok) throw new Error("Não foi possível carregar os serviços.");
  return resposta.json();
}

async function buscarVeiculos() {
  const resposta = await fetch(`${API}/veiculos`);
  if (!resposta.ok) throw new Error("Não foi possível carregar os veículos.");
  return resposta.json();
}

async function criarVeiculo(dados) {
  const resposta = await fetch(`${API}/veiculos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  if (!resposta.ok) throw new Error("Não foi possível salvar o veículo.");
  return resposta.json();
}

async function buscarVeiculosDoUsuario() {
  return buscarVeiculos();
}

async function verificarHorario(data, hora, servicoId) {
  const resposta = await fetch(`${API}/horarios?data=${data}&hora=${hora}&servicoId=${servicoId}`);
  if (!resposta.ok) throw new Error("Não foi possível verificar o horário.");
  return resposta.json();
}

async function criarAgendamento(dados) {
  const resposta = await fetch(`${API}/agendamentos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  const corpo = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    const erro = new Error(corpo.erro || "Não foi possível agendar.");
    erro.sugestoes = corpo.sugestoes || [];
    throw erro;
  }
  return corpo;
}

async function buscarAgendamentos() {
  const resposta = await fetch(`${API}/agendamentos`);
  if (!resposta.ok) throw new Error("Não foi possível carregar os agendamentos.");
  return resposta.json();
}

async function cancelarAgendamento(id) {
  const resposta = await fetch(`${API}/agendamentos/${id}/cancelar`, { method: "PATCH" });
  if (!resposta.ok) throw new Error("Não foi possível cancelar.");
}


async function buscarAdminAgendamentos(data) {
  const r = await fetch(`${API}/admin/agendamentos?data=${data}`);
  if (!r.ok) throw new Error("Não foi possível carregar os agendamentos.");
  return r.json();
}

async function buscarAdminResumo(data) {
  const r = await fetch(`${API}/admin/resumo?data=${data}`);
  if (!r.ok) throw new Error("Não foi possível carregar o resumo.");
  return r.json();
}

async function mudarStatus(id, status) {
  const r = await fetch(`${API}/admin/agendamentos/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!r.ok) throw new Error("Não foi possível mudar o status.");
}

async function buscarTodosServicos() {
  const r = await fetch(`${API}/servicos?todos=true`);
  if (!r.ok) throw new Error("Não foi possível carregar os serviços.");
  return r.json();
}


async function salvarServico(dados, id) {
  const r = await fetch(`${API}/servicos${id ? "/" + id : ""}`, {
    method: id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  if (!r.ok) throw new Error("Não foi possível salvar o serviço.");
  return r.json();
}

async function ligarServico(id, ativo) {
  const r = await fetch(`${API}/servicos/${id}/ativo`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ativo }),
  });
  if (!r.ok) throw new Error("Não foi possível alterar o serviço.");
  return r.json();
}

async function atualizarVeiculo(id, dados) {
  const r = await fetch(`${API}/veiculos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  if (!r.ok) throw new Error("Não foi possível atualizar o veículo.");
  return r.json();
}

async function excluirVeiculo(id) {
  const r = await fetch(`${API}/veiculos/${id}`, { method: "DELETE" });
  if (r.status === 409) throw new Error("Este veículo possui agendamentos e não pode ser excluído.");
  if (!r.ok) throw new Error("Não foi possível excluir o veículo.");
}