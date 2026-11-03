package com.lavaflow.veiculo;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController
@RequestMapping("/api/veiculos")
public class VeiculoController {

    // TEMPORÁRIO: no passo 20 isto vem do usuário logado
    private static final Long USUARIO_DEMO = 1L;

    // os dados que chegam do front
    public record NovoVeiculo(String marca, String modelo, String placa, String cor) {}

    private final VeiculoRepository repositorio;

    public VeiculoController(VeiculoRepository repositorio) {
        this.repositorio = repositorio;
    }

    @GetMapping
    public List<Veiculo> listar() {
        return repositorio.findByUsuarioId(USUARIO_DEMO);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Veiculo criar(@RequestBody NovoVeiculo dados) {
        if (vazio(dados.marca()) || vazio(dados.modelo()) || vazio(dados.placa()) || vazio(dados.cor())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Preencha todos os campos.");
        }
        Veiculo v = new Veiculo();
        v.setUsuarioId(USUARIO_DEMO);
        v.setMarca(dados.marca().trim());
        v.setModelo(dados.modelo().trim());
        v.setPlaca(dados.placa().trim().toUpperCase());
        v.setCor(dados.cor().trim());
        return repositorio.save(v);
    }

    private boolean vazio(String s) {
        return s == null || s.isBlank();
    }
}