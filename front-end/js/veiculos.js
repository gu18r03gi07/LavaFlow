let veiculos = [];
let editandoId = null;

const lista = document.getElementById("lista-veiculos");
const modal = document.getElementById("modal-veiculo");
const form = document.getElementById("form-veiculo");

function criarCartao(v) {
  const cartao = document.createElement("article");
  cartao.className = "cartao cartao-veiculo";
  cartao.innerHTML = `
    <p class="rotulo"></p>
    <h2></h2>
    <dl>
      <div><dt>Placa</dt><dd class="v-placa"></dd></div>
      <div><dt>Cor</dt><dd class="v-cor"></dd></div>
    </dl>
    <div class="cartao-acoes">
      <button class="botao botao-claro btn-editar">Editar</button>
      <button class="botao botao-perigo btn-excluir">Excluir</button>
    </div>`;
  cartao.querySelector(".rotulo").textContent = v.marca;
  cartao.querySelector("h2").textContent = v.modelo;
  cartao.querySelector(".v-placa").textContent = v.placa;
  cartao.querySelector(".v-cor").textContent = v.cor;

  cartao.querySelector(".btn-editar").addEventListener("click", () => abrirModal(v));
  cartao.querySelector(".btn-excluir").addEventListener("click", async () => {
    if (!confirm("Deseja excluir este veículo?")) return;
    try {
      await excluirVeiculo(v.id);
      veiculos = veiculos.filter((x) => x.id !== v.id);
      desenhar();
    } catch (erro) {
      alert(erro.message);
    }
  });
  return cartao;
}

function desenhar() {
  lista.innerHTML = "";
  veiculos.forEach((v) => lista.appendChild(criarCartao(v)));

  const novo = document.createElement("button");
  novo.className = "cartao veiculo-novo";
  novo.innerHTML = `<strong>+ Adicionar outro veículo</strong>
                    <span class="texto-suave">Cadastre marca, modelo, cor e placa</span>`;
  novo.addEventListener("click", () => abrirModal(null));
  lista.appendChild(novo);
}

function abrirModal(veiculo) {
  form.reset();
  const titulo = modal.querySelector("h2");
  if (veiculo) {
    editandoId = veiculo.id;
    titulo.textContent = "Editar veículo";
    document.getElementById("marca").value = veiculo.marca;
    document.getElementById("modelo").value = veiculo.modelo;
    document.getElementById("placa").value = veiculo.placa;
    document.getElementById("cor").value = veiculo.cor;
  } else {
    editandoId = null;
    titulo.textContent = "Adicionar veículo";
  }
  modal.showModal();
}

document.getElementById("btn-novo-veiculo").addEventListener("click", () => abrirModal(null));
document.getElementById("btn-fechar-veiculo").addEventListener("click", () => modal.close());

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const dados = {
    marca: document.getElementById("marca").value.trim(),
    modelo: document.getElementById("modelo").value.trim(),
    placa: document.getElementById("placa").value.trim().toUpperCase(),
    cor: document.getElementById("cor").value.trim(),
  };
  try {
    if (editandoId === null) {
      veiculos.push(await criarVeiculo(dados));
    } else {
      const salvo = await atualizarVeiculo(editandoId, dados);
      veiculos = veiculos.map((v) => (v.id === editandoId ? salvo : v));
    }
    modal.close();
    desenhar();
  } catch (erro) {
    alert(erro.message);
  }
});

async function iniciar() {
  try {
    veiculos = await buscarVeiculos();
  } catch (erro) {
    lista.textContent = "Não foi possível carregar os veículos. A API está ligada?";
    return;
  }
  desenhar();
}
iniciar();