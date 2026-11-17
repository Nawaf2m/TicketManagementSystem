
package com.example.ticketmanagementsystem.Controller;

import com.example.ticketmanagementsystem.Api.ApiResponse;
import com.example.ticketmanagementsystem.DtoIn.LoginDTO;
import com.example.ticketmanagementsystem.DtoOut.LoginResponseDTO;
import com.example.ticketmanagementsystem.Model.User;
import com.example.ticketmanagementsystem.Service.JwtService;
import com.example.ticketmanagementsystem.Service.RefreshTokenService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.time.Duration;

@RestController
@RequestMapping("/api/v1/auth")
@AllArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    @PostMapping("/login")
    public LoginResponseDTO login(@RequestBody @Valid LoginDTO loginDTO,
                                  HttpServletResponse response) {

        try {
            Authentication authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(
                            loginDTO.getEmail(),
                            loginDTO.getPassword()
                    )
            );

            User user = (User) authentication.getPrincipal();

            String accessToken = jwtService.generateToken(user);
            String refreshToken = refreshTokenService.createRefreshToken(user);

            ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshToken)
                    .httpOnly(true)
                    .secure(false)
                    .sameSite("Lax")
                    .path("/api/v1/auth")
                    .maxAge(Duration.ofDays(7))
                    .build();

            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

            return new LoginResponseDTO(accessToken, "Bearer", 900);

        } catch (AuthenticationException e) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid email or password"
            );
        }
    }


    @PostMapping("/refresh")
    public LoginResponseDTO refresh(@CookieValue(name = "refreshToken", required = false) String oldToken, HttpServletResponse response) {
        RefreshTokenService.RefreshResult result = refreshTokenService.rotateRefreshToken(oldToken);

        String accessToken = jwtService.generateToken(result.user());

        Duration remainingTime = Duration.between(
                Instant.now(),
                result.expiresAt()
        );

        ResponseCookie cookie = ResponseCookie.from("refreshToken", result.token())
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/api/v1/auth")
                .maxAge(remainingTime)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return new LoginResponseDTO(accessToken, "Bearer", 900);
    }


    @PostMapping("/logout")
    public ResponseEntity<ApiResponse> logout(
            @CookieValue(name = "refreshToken", required = false) String refreshToken,
            HttpServletResponse response) {

        refreshTokenService.revokeRefreshToken(refreshToken);

        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/api/v1/auth")
                .maxAge(0)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok(new ApiResponse("Logged out successfully"));
    }

}
