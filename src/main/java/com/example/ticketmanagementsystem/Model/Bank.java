package com.example.ticketmanagementsystem.Model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@Entity
public class Bank {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(columnDefinition = "varchar(30)", nullable = false, unique = true)
    private String name;

    @Column(columnDefinition = "varchar(1)", nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private Integer lastTerminalSequence = 0;

    @OneToMany(mappedBy = "bank")
    private List<Terminal> terminals = new ArrayList<>();
}
