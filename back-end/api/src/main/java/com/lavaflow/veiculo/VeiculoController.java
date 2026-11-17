package com.lavaflow.veiculo;

import com.lavaflow.agendamento.AgendamentoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/veiculos")
public class VeiculoController {

    private static final Long USUARIO_DEMO = 1L;

    public record DadosVeiculo(String marca, String modelo, String placa, String cor) {}

    private final VeiculoRepository repositorio;
    private final AgendamentoRepository agendamentos;

    public VeiculoController(VeiculoRepository repositorio, AgendamentoRepository agendamentos) {
        this.repositorio = repositorio;
        this.agendamentos = agendamentos;
    }

    @GetMapping
    public List<Veiculo> listar() {
        return repositorio.findByUsuarioId(USUARIO_DEMO);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Veiculo criar(@RequestBody DadosVeiculo dados) {
        Veiculo v = new Veiculo();
        v.setUsuarioId(USUARIO_DEMO);
        return repositorio.save(preencher(v, dados));
    }

    @PutMapping("/{id}")
    public Veiculo editar(@PathVariable Long id, @RequestBody DadosVeiculo dados) {
        return repositorio.save(preencher(buscar(id), dados));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        Veiculo v = buscar(id);
        if (agendamentos.existsByVeiculoId(v.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Veículo possui agendamentos.");
        }
        repositorio.delete(v);
    }

    private Veiculo buscar(Long id) {
        return repositorio.findById(id)
                .filter(v -> v.getUsuarioId().equals(USUARIO_DEMO))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Veículo não encontrado."));
    }

    private Veiculo preencher(Veiculo v, DadosVeiculo d) {
        if (vazio(d.marca()) || vazio(d.modelo()) || vazio(d.placa()) || vazio(d.cor())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Preencha todos os campos.");
        }
        v.setMarca(d.marca().trim());
        v.setModelo(d.modelo().trim());
        v.setPlaca(d.placa().trim().toUpperCase());
        v.setCor(d.cor().trim());
        return v;
    }

    private boolean vazio(String s) {
        return s == null || s.isBlank();
    }
}