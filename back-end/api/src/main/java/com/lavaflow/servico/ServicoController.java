package com.lavaflow.servico;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/servicos")
public class ServicoController {

    private final ServicoRepository repositorio;

    public ServicoController(ServicoRepository repositorio) {
        this.repositorio = repositorio;
    }

    @GetMapping
    public List<Servico> listar() {
        return repositorio.findByAtivoTrue();
    }
}
