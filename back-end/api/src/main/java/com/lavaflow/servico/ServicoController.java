package com.lavaflow.servico;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/servicos")
public class ServicoController {

    public record DadosServico(String nome, String descricao, BigDecimal preco, Integer duracaoMin) {}
    public record DadosAtivo(Boolean ativo) {}

    private final ServicoRepository repositorio;

    public ServicoController(ServicoRepository repositorio) {
        this.repositorio = repositorio;
    }

    // clientes veem só os ativos; o admin pede ?todos=true
    @GetMapping
    public List<Servico> listar(@RequestParam(defaultValue = "false") boolean todos) {
        return todos ? repositorio.findAll() : repositorio.findByAtivoTrue();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Servico criar(@RequestBody DadosServico dados) {
        Servico s = new Servico();
        s.setAtivo(true);
        return repositorio.save(preencher(s, dados));
    }

    @PutMapping("/{id}")
    public Servico editar(@PathVariable Long id, @RequestBody DadosServico dados) {
        Servico s = repositorio.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviço não encontrado."));
        return repositorio.save(preencher(s, dados));
    }

    @PatchMapping("/{id}/ativo")
    public Servico ligarDesligar(@PathVariable Long id, @RequestBody DadosAtivo dados) {
        Servico s = repositorio.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviço não encontrado."));
        s.setAtivo(Boolean.TRUE.equals(dados.ativo()));
        return repositorio.save(s);
    }

    private Servico preencher(Servico s, DadosServico d) {
        if (d.nome() == null || d.nome().isBlank()
                || d.preco() == null || d.preco().signum() < 0
                || d.duracaoMin() == null || d.duracaoMin() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dados do serviço inválidos.");
        }
        s.setNome(d.nome().trim());
        s.setDescricao(d.descricao() == null ? "" : d.descricao().trim());
        s.setPreco(d.preco());
        s.setDuracaoMin(d.duracaoMin());
        return s;
    }
}