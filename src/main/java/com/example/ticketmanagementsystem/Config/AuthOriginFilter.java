
package com.example.ticketmanagementsystem.Config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class AuthOriginFilter extends OncePerRequestFilter {

    @Value("${app.frontend.origin}")
    private String allowedOrigin;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String path = request.getServletPath();

        boolean protectedRequest = request.getMethod().equals("POST")
                && (path.equals("/api/v1/auth/login")
                || path.equals("/api/v1/auth/refresh")
                || path.equals("/api/v1/auth/logout"));

        if (protectedRequest) {

            String origin = request.getHeader("Origin");

            if (!allowedOrigin.equals(origin)) {

                response.setStatus(403);
                response.setContentType("application/json");
                response.getWriter().write(
                        "{\"message\":\"Request origin is not allowed\"}"
                );
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}