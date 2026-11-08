package com.example.ticketmanagementsystem.Repository;

import com.example.ticketmanagementsystem.Model.Auth;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;

@Repository
public interface AuthRepository extends JpaRepository<Auth, Integer> {
    Auth findAuthById(Integer id);

    Auth findAuthByEmail(String email);

    Auth getAuthById(Integer id);

    long countByRole_Name(String roleName);

    long countByRole_NameAndActiveTrue(String roleName);

    boolean existsByDepartment_Id(Integer departmentId);
}
