package com.lavaflow.agendamento;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    public record NovoStatus(String status) {}

    private final AdminService service;

    public AdminController(AdminService service) {
        this.service = service;
    }

    // sem ?data= usa o dia de hoje
    @GetMapping("/agendamentos")
    public List<AdminService.Linha> listar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        return service.listarDia(data != null ? data : LocalDate.now());
    }

    @GetMapping("/resumo")
    public AdminService.Resumo resumo(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        return service.resumo(data != null ? data : LocalDate.now());
    }

    @PatchMapping("/agendamentos/{id}/status")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void mudarStatus(@PathVariable Long id, @RequestBody NovoStatus dados) {
        service.mudarStatus(id, dados.status());
    }
}
