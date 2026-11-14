package com.lavaflow.agendamento;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class AgendamentoController {

    // TEMPORÁRIO: no passo 20 isto vem do usuário logado
    private static final Long USUARIO_DEMO = 1L;

    public record NovoAgendamento(Long veiculoId, Long servicoId, LocalDate data, LocalTime hora) {}

    private final AgendamentoService service;

    public AgendamentoController(AgendamentoService service) {
        this.service = service;
    }

    // GET /api/horarios?data=2026-11-10&hora=14:00&servicoId=2
    @GetMapping("/horarios")
    public AgendamentoService.Disponibilidade horarios(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime hora,
            @RequestParam Long servicoId) {
        return service.verificar(servicoId, data, hora);
    }

    @GetMapping("/agendamentos")
    public List<AgendamentoService.Resumo> listar() {
        return service.listar(USUARIO_DEMO);
    }

    @PostMapping("/agendamentos")
    public ResponseEntity<?> criar(@RequestBody NovoAgendamento dados) {
        // checa antes, para devolver as sugestões junto com o erro
        var disp = service.verificar(dados.servicoId(), dados.data(), dados.hora());
        if (!disp.disponivel()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("erro", "Horário indisponível.", "sugestoes", disp.sugestoes()));
        }
        var criado = service.criar(USUARIO_DEMO, dados.veiculoId(), dados.servicoId(),
                dados.data(), dados.hora());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", criado.getId()));
    }

    @PatchMapping("/agendamentos/{id}/cancelar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelar(@PathVariable Long id) {
        service.cancelar(USUARIO_DEMO, id);
    }
}
