package com.example.ticketmanagementsystem.Repository;

import com.example.ticketmanagementsystem.Model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RoleRepository extends JpaRepository<Role, Integer> {
    Role findRoleById(Integer id);

    Role findRoleByName(String name);
}
