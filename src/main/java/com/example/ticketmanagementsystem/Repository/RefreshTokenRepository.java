
package com.example.ticketmanagementsystem.Repository;

import com.example.ticketmanagementsystem.Model.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Integer> {

    @Query(value = "SELECT * FROM refresh_token WHERE token_hash = :tokenHash FOR UPDATE", nativeQuery = true)
    Optional<RefreshToken> findByTokenHash(@Param("tokenHash") String tokenHash);

    void deleteByFamilyId(UUID familyId);

    List<RefreshToken> findByFamilyId(UUID familyId);
}
