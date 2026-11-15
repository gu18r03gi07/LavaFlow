package com.lavaflow.agendamento;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface AgendamentoRepository extends JpaRepository<Agendamento, Long> {


    List<Agendamento> findByInicioGreaterThanEqualAndInicioLessThanAndStatusNot(
            LocalDateTime de, LocalDateTime ate, String status);

    List<Agendamento> findByUsuarioIdOrderByInicioDesc(Long usuarioId);


    List<Agendamento> findByInicioGreaterThanEqualAndInicioLessThanOrderByInicio(
            LocalDateTime de, LocalDateTime ate);

                boolean existsByVeiculoId(Long veiculoId);
}

