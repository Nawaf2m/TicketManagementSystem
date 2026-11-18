package com.example.ticketmanagementsystem.Controller;

import com.example.ticketmanagementsystem.Api.ApiResponse;
import com.example.ticketmanagementsystem.DtoIn.AddPermissionDTO;
import com.example.ticketmanagementsystem.Model.Permission;
import com.example.ticketmanagementsystem.Service.PermissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/permissions")
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionService permissionService;

    @PreAuthorize("hasAuthority('PERMISSION_VIEW')")
    @GetMapping("/get")
    public ResponseEntity<List<Permission>> getAllPermissions() {
        return ResponseEntity.ok(permissionService.getAllPermissions());
    }

    // No permission for creating permissions exists in the current catalog.
    @PreAuthorize("denyAll()")
    @PostMapping("/add")
    public ResponseEntity<?> addPermission(@RequestBody @Valid AddPermissionDTO dto) {
        permissionService.addPermission(dto.getName());
        return ResponseEntity.status(200).body(new ApiResponse("Permission added successfully"));
    }

    @PreAuthorize("hasAuthority('ROLE_MANAGE_PERMISSIONS')")
    @PostMapping("/assign/{roleId}/{permissionId}")
    public ResponseEntity<?> assignPermissionToRole(@PathVariable Integer roleId, @PathVariable Integer permissionId) {
        permissionService.assignPermissionToRole(roleId, permissionId);
        return ResponseEntity.status(200).body(new ApiResponse("Permission assigned to role successfully"));
    }

    @PreAuthorize("hasAuthority('ROLE_MANAGE_PERMISSIONS')")
    @DeleteMapping("/remove/{roleId}/{permissionId}")
    public ResponseEntity<?> removePermissionFromRole(@PathVariable Integer roleId, @PathVariable Integer permissionId) {
        permissionService.removePermissionFromRole(roleId, permissionId);
        return ResponseEntity.status(200).body(new ApiResponse("Permission removed from role successfully"));
    }

    @PreAuthorize("hasAuthority('PERMISSION_VIEW')")
    @GetMapping("/get/{permissionId}")
    public ResponseEntity<Permission> getPermissionById(
            @PathVariable Integer permissionId) {

        return ResponseEntity.ok(permissionService.getPermissionById(permissionId));
    }
}