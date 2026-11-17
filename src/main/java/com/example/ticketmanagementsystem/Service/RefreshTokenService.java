
package com.example.ticketmanagementsystem.Service;

import com.example.ticketmanagementsystem.Model.RefreshToken;
import com.example.ticketmanagementsystem.Model.User;
import com.example.ticketmanagementsystem.Repository.RefreshTokenRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
@AllArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    private final SecureRandom secureRandom = new SecureRandom();

    public String createRefreshToken(User user) {

        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);

        String token = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);

        RefreshToken refreshToken = new RefreshToken();

        refreshToken.setTokenHash(hashToken(token));
        refreshToken.setFamilyId(UUID.randomUUID());
        refreshToken.setUser(user);
        refreshToken.setExpiresAt(Instant.now().plus(7, ChronoUnit.DAYS));
        refreshToken.setRevoked(false);

        refreshTokenRepository.save(refreshToken);

        return token;
    }

    private String hashToken(String token) {

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            byte[] hash = digest.digest(
                    token.getBytes(StandardCharsets.UTF_8)
            );

            return HexFormat.of().formatHex(hash);

        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }

    @Transactional(noRollbackFor = ResponseStatusException.class)
    public RefreshResult rotateRefreshToken(String oldToken) {

        if (oldToken == null || oldToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token is missing");
        }

        RefreshToken oldRefreshToken = refreshTokenRepository.findByTokenHash(hashToken(oldToken))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Invalid refresh token"
                ));


        if (oldRefreshToken.isRevoked()) {

            revokeTokenFamily(oldRefreshToken.getFamilyId());

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Refresh token reuse detected. Please login again"
            );
        }

        if (!oldRefreshToken.getExpiresAt().isAfter(Instant.now())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Refresh token is expired"
            );
        }


        User user = oldRefreshToken.getUser();

        if (!user.isActive()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User account is inactive");
        }

        oldRefreshToken.setRevoked(true);
        refreshTokenRepository.save(oldRefreshToken);

        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);

        String newToken = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);

        RefreshToken newRefreshToken = new RefreshToken();

        newRefreshToken.setTokenHash(hashToken(newToken));
        newRefreshToken.setFamilyId(oldRefreshToken.getFamilyId());
        newRefreshToken.setUser(user);
        newRefreshToken.setExpiresAt(oldRefreshToken.getExpiresAt());
        newRefreshToken.setRevoked(false);

        refreshTokenRepository.save(newRefreshToken);

        return new RefreshResult(user, newToken, newRefreshToken.getExpiresAt());
    }

    public record RefreshResult(User user, String token, Instant expiresAt) {}

    private void revokeTokenFamily(UUID familyId) {

        List<RefreshToken> tokens = refreshTokenRepository.findByFamilyId(familyId);

        for (RefreshToken token : tokens) {
            token.setRevoked(true);
        }

        refreshTokenRepository.saveAll(tokens);
    }


    @Transactional
    public void revokeRefreshToken(String token) {

        if (token == null || token.isBlank()) {
            return;
        }

        RefreshToken refreshToken = refreshTokenRepository
                .findByTokenHash(hashToken(token))
                .orElse(null);

        if (refreshToken == null) {
            return;
        }

        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);
    }

}
