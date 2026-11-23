package com.example.ticketmanagementsystem.DtoIn;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.Length;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateCityNameDTO {
    @NotEmpty(message = "City name can't be empty.")
    @Length(max = 30, message = "City name can't be more than 30 characters.")
    private String name;
}
