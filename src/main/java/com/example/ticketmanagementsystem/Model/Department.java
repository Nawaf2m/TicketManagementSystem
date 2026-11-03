package com.example.ticketmanagementsystem.Model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.validator.constraints.Length;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@Entity
@NoArgsConstructor
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotEmpty(message = "Name can't be empty")
    @Length(min = 2, max = 30, message = "Name length must be between 2 and 20 characters")
    @Column(columnDefinition = "varchar(30) not null", unique = true)
    private String name;

    @OneToMany(mappedBy = "department")
    @JsonIgnore
    private List<Auth> users = new ArrayList<>();
}
