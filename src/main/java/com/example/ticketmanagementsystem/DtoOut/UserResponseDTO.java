package com.example.ticketmanagementsystem.DtoOut;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserResponseDTO {

    private Integer id;
    private String name;
    private String email;
    private String departmentName;
    private String roleName;
    private Boolean active;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private List<String> permissions;

    public UserResponseDTO(Integer id, String name, String email, String departmentName, String roleName, Boolean active) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.departmentName = departmentName;
        this.roleName = roleName;
        this.active = active;
    }
}