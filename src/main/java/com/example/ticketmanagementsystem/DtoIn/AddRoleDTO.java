package com.example.ticketmanagementsystem.DtoIn;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AddRoleDTO {

    @NotBlank(message = "Role name can't be empty")
    @Pattern(
            regexp = "^[A-Z][A-Z0-9_]*$",
            message = "Role name must contain uppercase letters, numbers or underscores"
    )
    @Size(max = 20, message = "Role name must not exceed 20 characters")
    private String name;
}