
package com.example.ticketmanagementsystem.Config;

import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@org.springframework.context.annotation.Configuration
@EnableWebSecurity
public class Configuration {

    @Bean
    public PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception{
        return http.csrf(csrf -> csrf.disable())

                .sessionManagement(sm ->
                        sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth

                        .requestMatchers("/error").permitAll()

                        .requestMatchers(HttpMethod.PUT, "/api/v1/role/initialize-roles")
                        .hasAuthority("ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/v1/user/initialize-admin")
                        .denyAll()

                        .requestMatchers("/api/v1/user/**")
                        .hasAuthority("ADMIN")

                        .requestMatchers(HttpMethod.GET, "/api/v1/department/get")
                        .authenticated()

                        .requestMatchers(HttpMethod.GET, "/api/v1/department/get-department-by-id/*")
                        .authenticated()

                        .requestMatchers(HttpMethod.POST, "/api/v1/department/add")
                        .hasAuthority("ADMIN")

                        .requestMatchers(HttpMethod.PUT, "/api/v1/department/update/*")
                        .hasAuthority("ADMIN")

                        .requestMatchers(HttpMethod.DELETE, "/api/v1/department/delete/*")
                        .hasAuthority("ADMIN")

                        .requestMatchers(HttpMethod.GET, "/api/v1/ticket/get")
                        .hasAuthority("ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/v1/ticket/add")
                        .hasAnyAuthority("ADMIN", "AGENT", "EMPLOYEE")

                        .requestMatchers(HttpMethod.GET, "/api/v1/ticket/get-my-tickets")
                        .authenticated()

                        .requestMatchers(HttpMethod.GET, "/api/v1/ticket/get-ticket-by-id/*")
                        .authenticated()

                        .requestMatchers(HttpMethod.PATCH, "/api/v1/ticket/assign-ticket/*/*")
                        .hasAuthority("ADMIN")

                        .requestMatchers(HttpMethod.PATCH, "/api/v1/ticket/advance-ticket-status/*")
                        .hasAnyAuthority("ADMIN", "AGENT")

                        .requestMatchers(HttpMethod.PATCH, "/api/v1/ticket/update-ticket-priority/*/*")
                        .hasAuthority("ADMIN")

                        .requestMatchers(HttpMethod.GET, "/api/v1/ticket/get-assigned-tickets")
                        .hasAuthority("AGENT")

                        .requestMatchers(HttpMethod.POST, "/api/v1/comment/add/*")
                        .hasAnyAuthority("ADMIN", "AGENT", "EMPLOYEE")

                        .requestMatchers(HttpMethod.GET, "/api/v1/comment/**")
                        .hasAnyAuthority("ADMIN", "AGENT", "EMPLOYEE")

                        .requestMatchers(HttpMethod.POST, "/api/v1/attachment/upload/*")
                        .hasAnyAuthority("ADMIN", "AGENT", "EMPLOYEE")

                        .requestMatchers(HttpMethod.GET, "/api/v1/attachment/**")
                        .hasAnyAuthority("ADMIN", "AGENT", "EMPLOYEE")

                        .anyRequest().denyAll())

                .httpBasic(basic -> {})

                .build();
    }
}
