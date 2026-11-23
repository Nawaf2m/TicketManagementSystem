package com.example.ticketmanagementsystem.Model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.validator.constraints.Length;


@Getter
@Setter
@NoArgsConstructor
@Entity
public class Device {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotEmpty(message = "Device mode can't be empty.")
    @Length(max = 50, message = "Device model can't be more than 50 characters.")
    @Column(columnDefinition = "varchar(50)", nullable = false)
    private String model;

    @NotEmpty(message = "Serial Number can't be empty.")
    @Length(max = 50, message = "Serial Number can't be more than 50 characters.")
    @Column(columnDefinition = "varchar(50)", nullable = false, unique = true)
    private String serialNumber;
}
