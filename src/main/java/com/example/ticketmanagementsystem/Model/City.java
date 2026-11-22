package com.example.ticketmanagementsystem.Model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.validator.constraints.Length;

import java.util.ArrayList;
import java.util.List;

@Setter
@Getter
@NoArgsConstructor
@Entity
public class City {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotEmpty(message = "City name can't be empty.")
    @Length(max = 30, message = "City name can't be more than 30 characters.")
    @Column(columnDefinition = "varchar(30)", nullable = false, unique = true)
    private String name;

    @ManyToMany(mappedBy = "cities")
    private List<Merchant> merchants = new ArrayList<>();
}
