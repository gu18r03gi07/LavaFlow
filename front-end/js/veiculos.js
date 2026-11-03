let veiculos = [];

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
    </dl>`;
  // textContent (e não innerHTML) para o que o usuário digitou:
  // assim ninguém consegue injetar HTML/JS na página
  cartao.querySelector(".rotulo").textContent = v.marca;
  cartao.querySelector("h2").textContent = v.modelo;
  cartao.querySelector(".v-placa").textContent = v.placa;
  cartao.querySelector(".v-cor").textContent = v.cor;
  return cartao;
}

function desenhar() {
  lista.innerHTML = "";
  veiculos.forEach((v) => lista.appendChild(criarCartao(v)));

  // cartão tracejado no final
  const novo = document.createElement("button");
  novo.className = "cartao veiculo-novo";
  novo.innerHTML = `<strong>+ Adicionar outro veículo</strong>
                    <span class="texto-suave">Cadastre marca, modelo, cor e placa</span>`;
  novo.addEventListener("click", abrirModal);
  lista.appendChild(novo);
}

function abrirModal() {
  form.reset();
  modal.showModal();
}

document.getElementById("btn-novo-veiculo").addEventListener("click", abrirModal);
document.getElementById("btn-fechar-veiculo").addEventListener("click", () => modal.close());

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const novo = await criarVeiculo({
      marca: document.getElementById("marca").value.trim(),
      modelo: document.getElementById("modelo").value.trim(),
      placa: document.getElementById("placa").value.trim().toUpperCase(),
      cor: document.getElementById("cor").value.trim(),
    });
    veiculos.push(novo);
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