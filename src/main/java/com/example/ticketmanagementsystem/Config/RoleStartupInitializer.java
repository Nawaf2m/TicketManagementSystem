package com.example.ticketmanagementsystem.Config;

import com.example.ticketmanagementsystem.Service.RoleService;
import lombok.AllArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(1)
@AllArgsConstructor
public class RoleStartupInitializer implements CommandLineRunner {
    private final RoleService roleService;

    @Override
    public void run(String... args) throws Exception {
        roleService.initializeRoles();
    }
}