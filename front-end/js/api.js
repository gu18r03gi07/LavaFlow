const API = "http://localhost:8080/api";

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