const API = "http://localhost:8080/api";

async function buscarServicos() {
  const resposta = await fetch(`${API}/servicos`);
  if (!resposta.ok) throw new Error("Não foi possível carregar os serviços.");
  return resposta.json();
}