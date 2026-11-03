package com.example.ticketmanagementsystem.Repository;

import com.example.ticketmanagementsystem.Model.Auth;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuthRepository extends JpaRepository<Auth, Integer> {
    Auth findAuthById(Integer id);

    Auth findAuthByEmail(String email);
}
