package com.example.ticketmanagementsystem.Model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.validator.constraints.Length;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@Entity
public class Merchant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotEmpty(message = "Merchant name can't be empty")
    @Length(max = 100, message = "Merchant name length can't be more 100 characters")
    @Column(columnDefinition = "varchar(100)", nullable = false, unique = true)
    private String name;

    @ManyToMany
    private List<City> cities = new ArrayList<>();

    @OneToMany(mappedBy = "merchant")
    private List<Terminal> terminals = new ArrayList<>();
}
