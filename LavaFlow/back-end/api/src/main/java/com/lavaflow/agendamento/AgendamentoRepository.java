package com.lavaflow.agendamento;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface AgendamentoRepository extends JpaRepository<Agendamento, Long> {

    // agendamentos que começam dentro de um dia, ignorando um status (o CANCELADO)
    List<Agendamento> findByInicioGreaterThanEqualAndInicioLessThanAndStatusNot(
            LocalDateTime de, LocalDateTime ate, String status);

    List<Agendamento> findByUsuarioIdOrderByInicioDesc(Long usuarioId);

        // todos os agendamentos de um período (inclusive cancelados), em ordem de hora
    List<Agendamento> findByInicioGreaterThanEqualAndInicioLessThanOrderByInicio(
            LocalDateTime de, LocalDateTime ate);
}
