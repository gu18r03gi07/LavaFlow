// "14:00" + 90 min => "15:30"
function somarMinutos(hora, minutos) {
  const [h, m] = hora.split(":").map(Number);
  const total = h * 60 + m + minutos;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

const dinheiro = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// "14:30" -> 870
function paraMinutos(hora) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

// 870 -> "14:30"
function paraHora(minutos) {
  const h = String(Math.floor(minutos / 60)).padStart(2, "0");
  const m = String(minutos % 60).padStart(2, "0");
  return `${h}:${m}`;
}

// "2026-10-29" -> "29 out"
// o "T00:00:00" evita o bug de fuso, que mostraria o dia anterior
function dataCurta(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "");
}

// hoje -> "quinta-feira, 29 de outubro"
function dataExtenso(d = new Date()) {
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
}

// protege textos vindos do banco antes de usar dentro de innerHTML
function esc(texto) {
  const d = document.createElement("div");
  d.textContent = texto;
  return d.innerHTML;
}

// o banco guarda o código; aqui está o texto e a cor de cada status
const statusInfo = {
  AGENDADO: ["Agendado", "etiqueta"],
  RECEBIDO: ["Recebido", "etiqueta etiqueta-amarela"],
  EM_LAVAGEM: ["Em lavagem", "etiqueta etiqueta-roxa"],
  CONCLUIDO: ["Concluído", "etiqueta etiqueta-verde"],
  CANCELADO: ["Cancelado", "etiqueta etiqueta-vermelha"],
};