package com.example.ticketmanagementsystem.DtoIn;

import jakarta.persistence.Column;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateUserRoleDTO {
    @NotEmpty(message = "Role can't be empty")
    @Pattern(regexp = "^(ADMIN|AGENT|EMPLOYEE)$", message = "Role must be ADMIN, AGENT or EMPLOYEE")
    private String roleName;
}
