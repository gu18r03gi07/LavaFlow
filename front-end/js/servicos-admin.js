let servicos = [];
let editandoId = null; // null = criando; número = editando aquele serviço

const lista = document.getElementById("lista-servicos-admin");
const modal = document.getElementById("modal-servico");
const form = document.getElementById("form-servico");

function desenhar() {
  lista.innerHTML = "";

  servicos.forEach((s) => {
    const linha = document.createElement("article");
    linha.className = "cartao servico-linha" + (s.ativo ? "" : " inativo");
    linha.innerHTML = `
      <div><h2></h2><p class="texto-suave"></p></div>
      <div class="servico-dados">
        <div><small>Preço</small><strong class="s-preco"></strong></div>
        <div><small>Duração</small><strong class="s-duracao"></strong></div>
        <label class="chave" title="Ativar/desativar serviço">
          <input type="checkbox"><span></span>
        </label>
        <button class="botao botao-claro btn-editar">Editar</button>
      </div>`;

    linha.querySelector("h2").textContent = s.nome;
    linha.querySelector("p").textContent = s.descricao;
    linha.querySelector(".s-preco").textContent = dinheiro(s.preco);
    linha.querySelector(".s-duracao").textContent = s.duracaoMin + " min";

    const chave = linha.querySelector("input[type=checkbox]");
    chave.checked = s.ativo;
    chave.addEventListener("change", async () => {
      try {
        const atualizado = await ligarServico(s.id, chave.checked);
        Object.assign(s, atualizado);
      } catch (e) {
        alert(e.message);
      }
      desenhar();
    });

    linha.querySelector(".btn-editar").addEventListener("click", () => abrirModal(s));
    lista.appendChild(linha);
  });
}

function abrirModal(servico) {
  form.reset();
  if (servico) {
    editandoId = servico.id;
    document.getElementById("titulo-modal-servico").textContent = "Editar serviço";
    document.getElementById("s-nome").value = servico.nome;
    document.getElementById("s-descricao").value = servico.descricao;
    document.getElementById("s-preco").value = servico.preco;
    document.getElementById("s-duracao").value = servico.duracaoMin;
  } else {
    editandoId = null;
    document.getElementById("titulo-modal-servico").textContent = "Novo serviço";
  }
  modal.showModal();
}

document.getElementById("btn-novo-servico").addEventListener("click", () => abrirModal(null));
document.getElementById("btn-fechar-servico").addEventListener("click", () => modal.close());

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const dados = {
    nome: document.getElementById("s-nome").value.trim(),
    descricao: document.getElementById("s-descricao").value.trim(),
    preco: Number(document.getElementById("s-preco").value),
    duracaoMin: Number(document.getElementById("s-duracao").value),
  };

  try {
    const salvo = await salvarServico(dados, editandoId);
    if (editandoId === null) servicos.push(salvo);
    else Object.assign(servicos.find((s) => s.id === editandoId), salvo);
    modal.close();
    desenhar();
  } catch (erro) {
    alert(erro.message);
  }
});

async function iniciar() {
  try {
    servicos = await buscarTodosServicos();
  } catch (e) {
    lista.textContent = "Não foi possível carregar os serviços. A API está ligada?";
    return;
  }
  desenhar();
}
iniciar();