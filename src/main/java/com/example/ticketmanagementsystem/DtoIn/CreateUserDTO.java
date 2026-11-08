package com.example.ticketmanagementsystem.DtoIn;

import jakarta.persistence.Column;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.Length;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateUserDTO {
    @NotEmpty(message = "Name can't be empty")
    @Length(min = 2, max = 20, message = "Name length must be between 2 and 20 characters")
    private String name;

    @NotEmpty(message = "Email can't be empty")
    @Email(message = "Email must be in the right format")
    @Length(max = 50, message = "Email length can't be more than 50 characters")
    private String email;

    @NotEmpty(message = "Password can't be empty")
    @Size(min = 8, max = 20, message = "Password must be between 8 and 20 characters")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[^A-Za-z0-9\\s])\\S+$", message = "Password must contain at least one letter, one number, one special character, and no spaces")
    private String password;

    @NotNull(message = "Department id can't be empty.")
    @Positive(message = "Department id must be a positive number")
    private Integer departmentId;

    @NotEmpty(message = "Role can't be empty")
    @Pattern(regexp = "^(ADMIN|AGENT|EMPLOYEE)$", message = "Role must be ADMIN, AGENT or EMPLOYEE")
    private String roleName;
}
