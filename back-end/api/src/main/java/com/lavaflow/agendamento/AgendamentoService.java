package com.lavaflow.agendamento;

import com.lavaflow.servico.Servico;
import com.lavaflow.servico.ServicoRepository;
import com.lavaflow.veiculo.Veiculo;
import com.lavaflow.veiculo.VeiculoRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class AgendamentoService {

    private static final LocalTime ABRE = LocalTime.of(8, 0);
    private static final LocalTime FECHA = LocalTime.of(18, 0);
    private static final int PASSO_MIN = 30;

    public record Disponibilidade(boolean disponivel, List<String> sugestoes) {}

    public record Resumo(Long id, String servico, String veiculo, String placa,
                         LocalDate data, String entrada, String conclusao,
                         int duracaoMin, BigDecimal preco, String status) {}

    private final AgendamentoRepository agendamentos;
    private final BoxRepository boxes;
    private final ServicoRepository servicos;
    private final VeiculoRepository veiculos;

    public AgendamentoService(AgendamentoRepository agendamentos, BoxRepository boxes,
                              ServicoRepository servicos, VeiculoRepository veiculos) {
        this.agendamentos = agendamentos;
        this.boxes = boxes;
        this.servicos = servicos;
        this.veiculos = veiculos;
    }

    private ResponseStatusException erro(HttpStatus status, String mensagem) {
        return new ResponseStatusException(status, mensagem);
    }

    private Servico buscarServico(Long id) {
        return servicos.findById(id)
                .orElseThrow(() -> erro(HttpStatus.NOT_FOUND, "Serviço não encontrado."));
    }

    private List<Agendamento> doDia(LocalDate dia) {
        return agendamentos.findByInicioGreaterThanEqualAndInicioLessThanAndStatusNot(
                dia.atStartOfDay(), dia.plusDays(1).atStartOfDay(), "CANCELADO");
    }

    // Devolve o id de um box livre, ou null se não houver.
    // Regra de sobreposição: novoInicio < fimExistente  E  novoFim > inicioExistente
    private Long boxLivre(LocalDateTime inicio, int duracaoMin,
                          List<Agendamento> doDia, List<Box> boxesAtivos) {
        LocalDate dia = inicio.toLocalDate();
        LocalDateTime fim = inicio.plusMinutes(duracaoMin);

        if (inicio.isBefore(dia.atTime(ABRE)) || fim.isAfter(dia.atTime(FECHA))) return null; // fora do expediente
        if (inicio.isBefore(LocalDateTime.now())) return null;                                // horário que já passou

        for (Box box : boxesAtivos) {
            boolean conflito = doDia.stream().anyMatch(a ->
                    a.getBoxId().equals(box.getId())
                            && inicio.isBefore(a.getFim())
                            && fim.isAfter(a.getInicio()));
            if (!conflito) return box.getId();
        }
        return null;
    }

    // os 3 horários livres mais próximos do pedido
    private List<String> sugerir(LocalDateTime pedido, int duracaoMin,
                                 List<Agendamento> doDia, List<Box> boxesAtivos) {
        LocalDate dia = pedido.toLocalDate();
        List<LocalDateTime> livres = new ArrayList<>();

        for (LocalDateTime t = dia.atTime(ABRE);
             !t.plusMinutes(duracaoMin).isAfter(dia.atTime(FECHA));
             t = t.plusMinutes(PASSO_MIN)) {
            if (!t.equals(pedido) && boxLivre(t, duracaoMin, doDia, boxesAtivos) != null) {
                livres.add(t);
            }
        }

        return livres.stream()
                .sorted(Comparator.comparingLong(
                        (LocalDateTime t) -> Math.abs(Duration.between(pedido, t).toMinutes())))
                .limit(3)
                .sorted()
                .map(t -> t.toLocalTime().toString())
                .toList();
    }

    public Disponibilidade verificar(Long servicoId, LocalDate data, LocalTime hora) {
        int duracao = buscarServico(servicoId).getDuracaoMin();
        LocalDateTime pedido = data.atTime(hora);
        List<Agendamento> doDia = doDia(data);
        List<Box> ativos = boxes.findByAtivoTrue();

        if (boxLivre(pedido, duracao, doDia, ativos) != null) {
            return new Disponibilidade(true, List.of());
        }
        return new Disponibilidade(false, sugerir(pedido, duracao, doDia, ativos));
    }

    @Transactional
    public Agendamento criar(Long usuarioId, Long veiculoId, Long servicoId,
                             LocalDate data, LocalTime hora) {
        Servico servico = buscarServico(servicoId);

        // o veículo precisa existir E ser do usuário
        Veiculo veiculo = veiculos.findById(veiculoId)
                .filter(v -> v.getUsuarioId().equals(usuarioId))
                .orElseThrow(() -> erro(HttpStatus.NOT_FOUND, "Veículo não encontrado."));

        LocalDateTime inicio = data.atTime(hora);
        Long boxId = boxLivre(inicio, servico.getDuracaoMin(), doDia(data), boxes.findByAtivoTrue());
        if (boxId == null) {
            throw erro(HttpStatus.CONFLICT, "Horário indisponível.");
        }

        Agendamento a = new Agendamento();
        a.setUsuarioId(usuarioId);
        a.setVeiculoId(veiculo.getId());
        a.setServicoId(servico.getId());
        a.setBoxId(boxId);
        a.setInicio(inicio);
        a.setFim(inicio.plusMinutes(servico.getDuracaoMin()));

        try {
            return agendamentos.saveAndFlush(a);
        } catch (DataIntegrityViolationException e) {
            // o banco barrou (regra anti-sobreposição): alguém reservou no mesmo instante
            throw erro(HttpStatus.CONFLICT, "Horário indisponível.");
        }
    }

    public List<Resumo> listar(Long usuarioId) {
        return agendamentos.findByUsuarioIdOrderByInicioDesc(usuarioId).stream().map(a -> {
            Servico s = servicos.findById(a.getServicoId()).orElseThrow();
            Veiculo v = veiculos.findById(a.getVeiculoId()).orElseThrow();
            return new Resumo(a.getId(), s.getNome(),
                    v.getMarca() + " " + v.getModelo(), v.getPlaca(),
                    a.getInicio().toLocalDate(),
                    a.getInicio().toLocalTime().toString(),
                    a.getFim().toLocalTime().toString(),
                    s.getDuracaoMin(), s.getPreco(), a.getStatus());
        }).toList();
    }

    @Transactional
    public void cancelar(Long usuarioId, Long id) {
        Agendamento a = agendamentos.findById(id)
                .filter(x -> x.getUsuarioId().equals(usuarioId))
                .orElseThrow(() -> erro(HttpStatus.NOT_FOUND, "Agendamento não encontrado."));
        a.setStatus("CANCELADO"); // não apagamos: o histórico fica
    }
}