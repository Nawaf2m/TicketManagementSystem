package com.example.ticketmanagementsystem.DtoIn;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.Length;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BankDTOIn {
    @NotEmpty(message = "Bank name can't be empty.")
    @Length(max = 30, message = "Bank name length can't be more than 30 characters")
    private String name;

    @NotEmpty(message = "Bank code can't be empty.")
    @Pattern(regexp = "^\\d$", message = "Bank code must be exactly one digit")
    private String code;
}
