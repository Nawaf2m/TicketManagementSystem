package com.example.ticketmanagementsystem.Service;

import com.example.ticketmanagementsystem.Api.ApiException;
import com.example.ticketmanagementsystem.Model.Permission;
import com.example.ticketmanagementsystem.Model.Role;
import com.example.ticketmanagementsystem.Repository.PermissionRepository;
import com.example.ticketmanagementsystem.Repository.RoleRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PermissionService {
    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;

    public List<Permission> getAllPermissions() {
        return permissionRepository.findAll();
    }

    public void addPermission(String name) {

        Permission existingPermission = permissionRepository.findPermissionByName(name);

        if (existingPermission != null) {
            throw new ApiException("Permission already exists");
        }

        Permission permission = new Permission();
        permission.setName(name);

        permissionRepository.save(permission);
    }

    @Transactional
    public void assignPermissionToRole(Integer roleId, Integer permissionId) {

        Role role = roleRepository.findById(roleId).orElseThrow(() -> new ApiException("Role not found"));

        Permission permission = permissionRepository.findById(permissionId).orElseThrow(() -> new ApiException("Permission not found"));

        boolean alreadyAssigned = role.getPermissions().stream().anyMatch(p -> p.getId().equals(permissionId));

        if (alreadyAssigned) {
            throw new ApiException("Role already has this permission");
        }

        role.getPermissions().add(permission);

        roleRepository.save(role);
    }

    @Transactional
    public void removePermissionFromRole(Integer roleId, Integer permissionId) {
        Role role = roleRepository.findById(roleId).orElseThrow(() -> new ApiException("Role not found"));

        Permission permission = permissionRepository.findById(permissionId).orElseThrow(() -> new ApiException("Permission not found"));

        boolean removed = role.getPermissions().removeIf(p -> p.getId().equals(permission.getId()));

        if (!removed) {
            throw new ApiException("Role does not have this permission");
        }

        roleRepository.save(role);
    }

    public Permission getPermissionById(Integer permissionId) {
        return permissionRepository.findById(permissionId).orElseThrow(() -> new ApiException("Permission not found"));
    }
}