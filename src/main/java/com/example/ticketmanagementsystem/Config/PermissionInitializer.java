
package com.example.ticketmanagementsystem.Config;

import com.example.ticketmanagementsystem.Model.Permission;
import com.example.ticketmanagementsystem.Repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Order(2)
@RequiredArgsConstructor
public class PermissionInitializer implements CommandLineRunner {

    private final PermissionRepository permissionRepository;

    @Override
    public void run(String... args) {

        List<String> permissions = List.of(

                // Users
                "USER_VIEW",
                "USER_CREATE",
                "USER_UPDATE",
                "USER_MANAGE_ROLE",
                "USER_ACTIVATE",
                "USER_DEACTIVATE",

                // Departments
                "DEPARTMENT_VIEW",
                "DEPARTMENT_CREATE",
                "DEPARTMENT_UPDATE",
                "DEPARTMENT_DELETE",

                // Tickets
                "TICKET_VIEW_ALL",
                "TICKET_VIEW_OWN",
                "TICKET_VIEW_ASSIGNED",
                "TICKET_VIEW",
                "TICKET_CREATE",
                "TICKET_ASSIGN",
                "TICKET_UPDATE_STATUS",
                "TICKET_UPDATE_PRIORITY",

                // Comments
                "COMMENT_CREATE",
                "COMMENT_VIEW",

                // Attachments
                "ATTACHMENT_UPLOAD",
                "ATTACHMENT_VIEW",
                "ATTACHMENT_DOWNLOAD",

                // Ticket Activities
                "ACTIVITY_VIEW",
                "ACTIVITY_VIEW_ALL",

                // Roles
                "ROLE_VIEW",
                "ROLE_CREATE",
                "ROLE_DELETE",
                "ROLE_MANAGE_PERMISSIONS",

                // Permissions
                "PERMISSION_VIEW",

                //Bank
                "BANK_VIEW",
                "BANK_CREATE",
                "BANK_UPDATE",
                "BANK_DELETE",

                //City
                "CITY_VIEW",
                "CITY_CREATE",
                "CITY_UPDATE",
                "CITY_DELETE",

                // Merchant
                "MERCHANT_VIEW",
                "MERCHANT_CREATE",
                "MERCHANT_UPDATE",
                "MERCHANT_DELETE",

                // Terminal
                "TERMINAL_VIEW",
                "TERMINAL_CREATE",
                "TERMINAL_DELETE",

                // Device
                "DEVICE_VIEW",
                "DEVICE_CREATE",
                "DEVICE_UPDATE",
                "DEVICE_DELETE",

                // SimCard
                "SIMCARD_VIEW",
                "SIMCARD_CREATE",
                "SIMCARD_UPDATE",
                "SIMCARD_DELETE"
        );

        for (String name : permissions) {

            if (permissionRepository.findPermissionByName(name) == null) {

                Permission permission = new Permission();
                permission.setName(name);

                permissionRepository.save(permission);
            }
        }
    }
}
