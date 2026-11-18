package com.example.ticketmanagementsystem.DtoOut;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RoleResponseDTO {

    private Integer id;
    private String name;
    private List<String> permissions;
}