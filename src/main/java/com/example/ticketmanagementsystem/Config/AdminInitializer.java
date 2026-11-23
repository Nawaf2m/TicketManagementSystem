
package com.example.ticketmanagementsystem.Config;

import com.example.ticketmanagementsystem.DtoIn.CreateUserDTO;
import com.example.ticketmanagementsystem.Repository.AuthRepository;
import com.example.ticketmanagementsystem.Service.UserService;
import lombok.AllArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(4)
@AllArgsConstructor
public class AdminInitializer implements CommandLineRunner {

    private final UserService userService;
    private final AuthRepository authRepository;

    @Override
    public void run(String... args) {

        if (authRepository.countByRole_Name("ADMIN") > 0) {
            return;
        }

        String name = System.getenv("BOOTSTRAP_ADMIN_NAME");
        String email = System.getenv("BOOTSTRAP_ADMIN_EMAIL");
        String password = System.getenv("BOOTSTRAP_ADMIN_PASSWORD");

        if (name == null || name.isBlank()
                || email == null || email.isBlank()
                || password == null || password.isBlank()) {
            throw new IllegalStateException(
                    "Missing admin environment variables: BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD"
            );
        }

        CreateUserDTO adminDTO = new CreateUserDTO();
        adminDTO.setName(name);
        adminDTO.setEmail(email);
        adminDTO.setPassword(password);

        userService.initializeAdmin(adminDTO);
    }
}
