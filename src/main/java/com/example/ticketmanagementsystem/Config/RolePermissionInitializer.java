
package com.example.ticketmanagementsystem.Config;

import com.example.ticketmanagementsystem.Model.Permission;
import com.example.ticketmanagementsystem.Model.RbacSeedState;
import com.example.ticketmanagementsystem.Model.Role;
import com.example.ticketmanagementsystem.Repository.PermissionRepository;
import com.example.ticketmanagementsystem.Repository.RbacSeedStateRepository;
import com.example.ticketmanagementsystem.Repository.RoleRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Order(3)
public class RolePermissionInitializer implements ApplicationRunner {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final RbacSeedStateRepository seedStateRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {

        if (seedStateRepository.existsById(1)) {
            return;
        }

        // ADMIN
        assignPermissions("ADMIN", List.of(
                "USER_VIEW",
                "USER_CREATE",
                "USER_UPDATE",
                "USER_MANAGE_ROLE",
                "USER_ACTIVATE",
                "USER_DEACTIVATE",
                "DEPARTMENT_VIEW",
                "DEPARTMENT_CREATE",
                "DEPARTMENT_UPDATE",
                "DEPARTMENT_DELETE",
                "TICKET_VIEW_ALL",
                "TICKET_VIEW_OWN",
                "TICKET_VIEW_ASSIGNED",
                "TICKET_VIEW",
                "TICKET_CREATE",
                "TICKET_ASSIGN",
                "TICKET_UPDATE_STATUS",
                "TICKET_UPDATE_PRIORITY",
                "COMMENT_CREATE",
                "COMMENT_VIEW",
                "ATTACHMENT_UPLOAD",
                "ATTACHMENT_VIEW",
                "ATTACHMENT_DOWNLOAD",
                "ACTIVITY_VIEW",
                "ACTIVITY_VIEW_ALL",
                "ROLE_VIEW",
                "ROLE_CREATE",
                "ROLE_DELETE",
                "ROLE_MANAGE_PERMISSIONS",
                "PERMISSION_VIEW",
                "BANK_VIEW",
                "BANK_CREATE",
                "BANK_UPDATE",
                "BANK_DELETE",
                "CITY_VIEW",
                "CITY_CREATE",
                "CITY_UPDATE",
                "CITY_DELETE"
        ));

        // AGENT
        assignPermissions("AGENT", List.of(
                "DEPARTMENT_VIEW",
                "TICKET_VIEW_OWN",
                "TICKET_VIEW_ASSIGNED",
                "TICKET_VIEW",
                "TICKET_CREATE",
                "TICKET_UPDATE_STATUS",
                "COMMENT_CREATE",
                "COMMENT_VIEW",
                "ATTACHMENT_UPLOAD",
                "ATTACHMENT_VIEW",
                "ATTACHMENT_DOWNLOAD",
                "ACTIVITY_VIEW"
        ));

        // EMPLOYEE
        assignPermissions("EMPLOYEE", List.of(
                "DEPARTMENT_VIEW",
                "TICKET_VIEW_OWN",
                "TICKET_VIEW",
                "TICKET_CREATE",
                "COMMENT_CREATE",
                "COMMENT_VIEW",
                "ATTACHMENT_UPLOAD",
                "ATTACHMENT_VIEW",
                "ATTACHMENT_DOWNLOAD",
                "ACTIVITY_VIEW"
        ));

        RbacSeedState state = new RbacSeedState();
        state.setId(1);
        seedStateRepository.save(state);
    }

    private void assignPermissions(String roleName, List<String> names) {

        Role role = roleRepository.findRoleByName(roleName);

        if (role == null) {
            throw new IllegalStateException("Role not found: " + roleName);
        }

        Set<Integer> existingPermissionIds = role.getPermissions()
                .stream()
                .map(Permission::getId)
                .collect(java.util.stream.Collectors.toSet());

        for (String name : names) {

            Permission permission = permissionRepository.findPermissionByName(name);

            if (permission == null) {
                throw new IllegalStateException("Permission not found: " + name);
            }

            if (existingPermissionIds.add(permission.getId())) {
                role.getPermissions().add(permission);
            }
        }

        roleRepository.save(role);
    }
}
