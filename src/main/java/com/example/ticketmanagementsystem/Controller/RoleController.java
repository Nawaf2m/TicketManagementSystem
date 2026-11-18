package com.example.ticketmanagementsystem.Controller;

import com.example.ticketmanagementsystem.Api.ApiResponse;
import com.example.ticketmanagementsystem.DtoIn.AddRoleDTO;
import com.example.ticketmanagementsystem.DtoOut.RoleResponseDTO;
import com.example.ticketmanagementsystem.Repository.RoleRepository;
import com.example.ticketmanagementsystem.Service.RoleService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/role")
@AllArgsConstructor
public class RoleController {
    private final RoleService roleService;

    @PreAuthorize("hasAuthority('ROLE_VIEW')")
    @GetMapping("/get")
    public ResponseEntity<List<RoleResponseDTO>> getAllRoles() {
        return ResponseEntity.ok(roleService.getAllRoles());
    }

    // Bootstrap endpoint: keep disabled until a dedicated setup policy is defined.
    @PreAuthorize("denyAll()")
    @PutMapping("/initialize-roles")
    public ResponseEntity<?> initializeRoles(){
        String message = roleService.initializeRoles();
        return ResponseEntity.status(200).body(new ApiResponse(message));
    }

    @PreAuthorize("hasAuthority('ROLE_CREATE')")
    @PostMapping("/add")
    public ResponseEntity<?> addRole(@RequestBody @Valid AddRoleDTO dto) {
        roleService.addRole(dto.getName());
        return ResponseEntity.status(200).body(new ApiResponse("Role added successfully"));
    }

    @PreAuthorize("hasAuthority('ROLE_VIEW')")
    @GetMapping("/get/{roleId}")
    public ResponseEntity<RoleResponseDTO> getRoleById(
            @PathVariable Integer roleId) {

        return ResponseEntity.ok(roleService.getRoleById(roleId));
    }

    @PreAuthorize("hasAuthority('ROLE_DELETE')")
    @DeleteMapping("/delete/{roleId}")
    public ResponseEntity<?> deleteRole(@PathVariable Integer roleId) {
        roleService.deleteRole(roleId);
        return ResponseEntity.status(200).body(new ApiResponse("Role deleted successfully"));
    }
}
