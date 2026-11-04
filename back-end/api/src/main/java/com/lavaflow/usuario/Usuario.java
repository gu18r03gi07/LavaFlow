package com.lavaflow.usuario;

import jakarta.persistence.*;

@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    private Long id;

    private String nome;
    private String email;

    public Long getId() { return id; }
    public String getNome() { return nome; }
    public String getEmail() { return email; }
}
