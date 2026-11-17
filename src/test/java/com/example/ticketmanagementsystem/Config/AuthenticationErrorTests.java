package com.example.ticketmanagementsystem.Config;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Bean;
import org.springframework.mock.web.MockServletContext;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthenticationErrorTests {
    private AnnotationConfigWebApplicationContext context;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        // Load the real security filter with in-memory users; no application or DB startup.
        context = new AnnotationConfigWebApplicationContext();
        context.setServletContext(new MockServletContext());
        context.register(Configuration.class, TestConfiguration.class, CurrentUserController.class);
        context.refresh();
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @AfterEach
    void tearDown() {
        context.close();
    }

    @Test
    void disabledAccountGetsAnInactiveMessage() throws Exception {
        mockMvc.perform(get("/api/v1/user/me").with(httpBasic("disabled@example.com", "test-password")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Your account is inactive. Please contact your administrator."));
    }

    @Test
    void wrongPasswordKeepsTheInvalidCredentialsMessage() throws Exception {
        mockMvc.perform(get("/api/v1/user/me").with(httpBasic("active@example.com", "wrong-password")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    void unknownAccountKeepsTheInvalidCredentialsMessage() throws Exception {
        mockMvc.perform(get("/api/v1/user/me").with(httpBasic("unknown@example.com", "test-password")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    void activeAccountCanStillAuthenticate() throws Exception {
        mockMvc.perform(get("/api/v1/user/me").with(httpBasic("active@example.com", "test-password")))
                .andExpect(status().isOk());
    }

    @org.springframework.context.annotation.Configuration
    @EnableWebMvc
    static class TestConfiguration {
        @Bean
        UserDetailsService userDetailsService(PasswordEncoder encoder) {
            String password = encoder.encode("test-password");
            return new InMemoryUserDetailsManager(
                    User.withUsername("disabled@example.com").password(password).authorities("EMPLOYEE").disabled(true).build(),
                    User.withUsername("active@example.com").password(password).authorities("EMPLOYEE").build());
        }
    }

    @RestController
    static class CurrentUserController {
        @GetMapping("/api/v1/user/me")
        String currentUser() {
            return "Authenticated";
        }
    }
}
