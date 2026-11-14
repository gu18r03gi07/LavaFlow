const campoDia = document.getElementById("dia");
const grade = document.getElementById("grade-boxes");
const hoje = new Date().toLocaleDateString("sv-SE");

function somarDias(iso, n) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString("sv-SE");
}

async function carregar() {
  const dia = campoDia.value;
  try {
    const [linhas, resumo] = await Promise.all([
      buscarAdminAgendamentos(dia),
      buscarAdminResumo(dia),
    ]);
    document.getElementById("subtitulo-agenda").textContent =
      `${dataExtenso(new Date(dia + "T00:00:00"))} • ${resumo.agendamentos} agendamentos`;

    grade.innerHTML = "";
    // um cartão por box (o banco tem Box 01 ... Box 06)
    for (let i = 1; i <= resumo.boxesTotal; i++) {
      const nome = `Box 0${i}`;
      const cartao = document.createElement("section");
      cartao.className = "cartao";
      cartao.innerHTML = `<h2 class="titulo-box">${nome}</h2>`;

      const doBox = linhas.filter((l) => l.box === nome && l.status !== "CANCELADO");
      if (doBox.length === 0) {
        cartao.innerHTML += '<p class="texto-suave">Livre o dia todo.</p>';
      }
      doBox.forEach((l) => {
        const ev = document.createElement("div");
        ev.className = "evento";
        ev.innerHTML = `<strong>${esc(l.entrada)} • ${esc(l.veiculo)}</strong>
          <span>${esc(l.servico)} • até ${esc(l.conclusao)}</span>`;
        cartao.appendChild(ev);
      });
      grade.appendChild(cartao);
    }
  } catch (e) {
    grade.textContent = "Não foi possível carregar a agenda. A API está ligada?";
  }
}

function irPara(iso) {
  campoDia.value = iso;
  carregar();
}

document.getElementById("dia-anterior").addEventListener("click", () => irPara(somarDias(campoDia.value, -1)));
document.getElementById("dia-seguinte").addEventListener("click", () => irPara(somarDias(campoDia.value, 1)));
document.getElementById("dia-hoje").addEventListener("click", () => irPara(hoje));
campoDia.addEventListener("change", carregar);

irPara(hoje);