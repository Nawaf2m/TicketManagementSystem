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
public class AddPermissionDTO {

    @NotBlank(message = "Permission name can't be empty")
    @Pattern(
            regexp = "^[A-Z][A-Z0-9_]*$",
            message = "Permission name must contain uppercase letters, numbers or underscores"
    )
    @Size(max = 50, message = "Permission name must not exceed 50 characters")
    private String name;
}