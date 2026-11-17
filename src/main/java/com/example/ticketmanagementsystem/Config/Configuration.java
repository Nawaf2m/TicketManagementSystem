
package com.example.ticketmanagementsystem.Config;

import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.core.userdetails.UserDetailsService;

@org.springframework.context.annotation.Configuration
@EnableWebSecurity
public class Configuration {

    @Bean
    public PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }


    @Bean
    public AuthenticationManager authenticationManager(UserDetailsService userDetailsService, PasswordEncoder passwordEncoder) {

        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);

        provider.setPasswordEncoder(passwordEncoder);

        return new ProviderManager(provider);
    }


    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationConverter jwtAuthenticationConverter) throws Exception{
        return http.csrf(csrf -> csrf.disable())

                .sessionManagement(sm ->
                        sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth

                        .requestMatchers("/error").permitAll()

                        .requestMatchers(HttpMethod.PUT, "/api/v1/role/initialize-roles")
                        .hasAuthority("ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/refresh").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/logout").permitAll()

                        .requestMatchers(HttpMethod.POST, "/api/v1/user/initialize-admin")
                        .denyAll()

                        .requestMatchers(HttpMethod.GET, "/api/v1/user/me").authenticated()

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

                        .requestMatchers(HttpMethod.GET, "/api/v1/ticket-activity/get-ticket-activities/*").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/v1/ticket-activity/get-recent-activities").hasAuthority("ADMIN")

                        .anyRequest().denyAll())

                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt
                                .jwtAuthenticationConverter(jwtAuthenticationConverter)
                        )
                )

                .build();
    }
}
