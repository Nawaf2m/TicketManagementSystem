package com.example.ticketmanagementsystem.Repository;

import com.example.ticketmanagementsystem.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuthRepository extends JpaRepository<User, Integer> {
    User findUserById(Integer id);

    User findUserByEmail(String email);

    long countByRole_Name(String roleName);

    long countByRole_NameAndActiveTrue(String roleName);

    boolean existsByDepartment_Id(Integer departmentId);
}
