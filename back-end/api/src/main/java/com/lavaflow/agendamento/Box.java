package com.lavaflow.agendamento;

import jakarta.persistence.*;

@Entity
@Table(name = "boxes")
public class Box {

    @Id
    private Long id;

    private String nome;
    private Boolean ativo;

    public Long getId() { return id; }
    public String getNome() { return nome; }
    public Boolean getAtivo() { return ativo; }
}
