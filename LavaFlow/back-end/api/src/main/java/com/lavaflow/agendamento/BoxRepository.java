package com.lavaflow.agendamento;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BoxRepository extends JpaRepository<Box, Long> {
    List<Box> findByAtivoTrue();
}
