package com.lavaflow.agendamento;

import com.lavaflow.servico.Servico;
import com.lavaflow.servico.ServicoRepository;
import com.lavaflow.usuario.Usuario;
import com.lavaflow.usuario.UsuarioRepository;
import com.lavaflow.veiculo.Veiculo;
import com.lavaflow.veiculo.VeiculoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private static final Set<String> STATUS_VALIDOS =
            Set.of("AGENDADO", "RECEBIDO", "EM_LAVAGEM", "CONCLUIDO", "CANCELADO");

    public record Linha(Long id, String entrada, String conclusao, String veiculo, String placa,
                        String cliente, String servico, String box, int duracaoMin,
                        BigDecimal preco, String status) {}

    public record Resumo(int agendamentos, int emAtendimento, int concluidos,
                         BigDecimal faturamentoPrevisto, int boxesEmUso, int boxesTotal) {}

    private final AgendamentoRepository agendamentos;
    private final BoxRepository boxes;
    private final ServicoRepository servicos;
    private final VeiculoRepository veiculos;
    private final UsuarioRepository usuarios;

    public AdminService(AgendamentoRepository agendamentos, BoxRepository boxes,
                        ServicoRepository servicos, VeiculoRepository veiculos,
                        UsuarioRepository usuarios) {
        this.agendamentos = agendamentos;
        this.boxes = boxes;
        this.servicos = servicos;
        this.veiculos = veiculos;
        this.usuarios = usuarios;
    }

    private List<Agendamento> doDia(LocalDate dia) {
        return agendamentos.findByInicioGreaterThanEqualAndInicioLessThanOrderByInicio(
                dia.atStartOfDay(), dia.plusDays(1).atStartOfDay());
    }

    public List<Linha> listarDia(LocalDate dia) {
        // carrega as tabelas pequenas uma vez só (evita uma consulta por linha)
        Map<Long, Servico> sv = servicos.findAll().stream()
                .collect(Collectors.toMap(Servico::getId, Function.identity()));
        Map<Long, Veiculo> ve = veiculos.findAll().stream()
                .collect(Collectors.toMap(Veiculo::getId, Function.identity()));
        Map<Long, Usuario> us = usuarios.findAll().stream()
                .collect(Collectors.toMap(Usuario::getId, Function.identity()));
        Map<Long, Box> bx = boxes.findAll().stream()
                .collect(Collectors.toMap(Box::getId, Function.identity()));

        return doDia(dia).stream().map(a -> {
            Servico s = sv.get(a.getServicoId());
            Veiculo v = ve.get(a.getVeiculoId());
            return new Linha(a.getId(),
                    a.getInicio().toLocalTime().toString(),
                    a.getFim().toLocalTime().toString(),
                    v.getMarca() + " " + v.getModelo(), v.getPlaca(),
                    us.get(a.getUsuarioId()).getNome(),
                    s.getNome(), bx.get(a.getBoxId()).getNome(),
                    s.getDuracaoMin(), s.getPreco(), a.getStatus());
        }).toList();
    }

    public Resumo resumo(LocalDate dia) {
        Map<Long, Servico> sv = servicos.findAll().stream()
                .collect(Collectors.toMap(Servico::getId, Function.identity()));
        List<Agendamento> validos = doDia(dia).stream()
                .filter(a -> !a.getStatus().equals("CANCELADO")).toList();
        LocalDateTime agora = LocalDateTime.now();

        BigDecimal faturamento = validos.stream()
                .map(a -> sv.get(a.getServicoId()).getPreco())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // boxes ocupados neste instante (só faz sentido quando o dia é hoje)
        long emUso = validos.stream()
                .filter(a -> !agora.isBefore(a.getInicio()) && agora.isBefore(a.getFim()))
                .map(Agendamento::getBoxId).distinct().count();

        return new Resumo(validos.size(),
                (int) validos.stream().filter(a -> a.getStatus().equals("EM_LAVAGEM")).count(),
                (int) validos.stream().filter(a -> a.getStatus().equals("CONCLUIDO")).count(),
                faturamento, (int) emUso, boxes.findByAtivoTrue().size());
    }

    @Transactional
    public void mudarStatus(Long id, String status) {
        if (status == null || !STATUS_VALIDOS.contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status inválido.");
        }
        Agendamento a = agendamentos.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Agendamento não encontrado."));
        a.setStatus(status);
    }
}
