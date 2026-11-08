package com.example.ticketmanagementsystem.Controller;

import com.example.ticketmanagementsystem.Api.ApiResponse;
import com.example.ticketmanagementsystem.Repository.RoleRepository;
import com.example.ticketmanagementsystem.Service.RoleService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/role")
@AllArgsConstructor
public class RoleController {
    private final RoleService roleService;

    @PutMapping("/initialize-roles")
    public ResponseEntity<?> initializeRoles(){
        String message = roleService.initializeRoles();
        return ResponseEntity.status(200).body(new ApiResponse(message));
    }
}
