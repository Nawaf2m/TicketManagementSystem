package com.example.ticketmanagementsystem.Service;

import com.example.ticketmanagementsystem.Api.ApiException;
import com.example.ticketmanagementsystem.DtoOut.RoleResponseDTO;
import com.example.ticketmanagementsystem.Model.Permission;
import com.example.ticketmanagementsystem.Model.Role;
import com.example.ticketmanagementsystem.Repository.RoleRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class RoleService {
    private final RoleRepository roleRepository;

    public List<RoleResponseDTO> getAllRoles() {

        return roleRepository.findAll()
                .stream()
                .map(role -> new RoleResponseDTO(
                        role.getId(),
                        role.getName(),
                        role.getPermissions()
                                .stream()
                                .map(Permission::getName)
                                .toList()
                ))
                .toList();
    }

    @Transactional
    public String initializeRoles(){
        List<Role> allRoles = roleRepository.findAll();

        boolean adminExist = false, agentExist = false, employeeExist = false;
        for (int i = 0; i < allRoles.size(); i++){
            if (allRoles.get(i).getName().equals("ADMIN")){
                adminExist = true;
            } else if (allRoles.get(i).getName().equals("AGENT")){
                agentExist = true;
            } else if (allRoles.get(i).getName().equals("EMPLOYEE")) {
                employeeExist = true;
            }
        }

        if (adminExist && agentExist && employeeExist){
            return "Roles are already initialized";
        }

        if (!adminExist){
            Role adminRole = new Role();
            adminRole.setName("ADMIN");
            roleRepository.save(adminRole);
        }

        if (!agentExist){
            Role agentRole = new Role();
            agentRole.setName("AGENT");
            roleRepository.save(agentRole);
        }

        if (!employeeExist){
            Role employeeRole = new Role();
            employeeRole.setName("EMPLOYEE");
            roleRepository.save(employeeRole);
        }

        return "Missing roles initialized successfully";
    }

    public void addRole(String name) {

        Role existingRole = roleRepository.findRoleByName(name);

        if (existingRole != null) {
            throw new ApiException("Role already exists");
        }

        Role role = new Role();
        role.setName(name);

        roleRepository.save(role);
    }

    public RoleResponseDTO getRoleById(Integer roleId) {

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ApiException("Role not found"));

        return new RoleResponseDTO(
                role.getId(),
                role.getName(),
                role.getPermissions()
                        .stream()
                        .map(Permission::getName)
                        .toList()
        );
    }

    @Transactional
    public void deleteRole(Integer roleId) {

        Role role = roleRepository.findById(roleId).orElseThrow(() -> new ApiException("Role not found"));

        if (role.getName().equals("ADMIN")
                || role.getName().equals("AGENT")
                || role.getName().equals("EMPLOYEE")) {
            throw new ApiException("Default roles cannot be deleted");
        }

        if (!role.getAuths().isEmpty()) {
            throw new ApiException("Cannot delete a role assigned to users");
        }

        role.getPermissions().clear();

        roleRepository.delete(role);
    }
}
