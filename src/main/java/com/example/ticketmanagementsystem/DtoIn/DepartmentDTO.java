package com.example.ticketmanagementsystem.DtoIn;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.Length;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DepartmentDTO {
    @NotEmpty(message = "Name can't be empty")
    @Length(min = 2, max = 30, message = "Name length must be between 2 and 30 characters")
    private String name;
}
