package com.example.ticketmanagementsystem.DtoIn;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;
import org.hibernate.validator.constraints.Length;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateUserDTO {
    @NotEmpty(message = "Name can't be empty")
    @Length(min = 2, max = 20, message = "Name length must be between 2 and 20 characters")
    private String name;

    @NotEmpty(message = "Email can't be empty")
    @Email(message = "Email must be in the right format")
    @Length(max = 50, message = "Email length can't be more than 50 characters")
    private String email;

    @NotNull(message = "Department id can't be empty.")
    @Positive(message = "Department id must be a positive number")
    private Integer departmentId;
}
