package com.example.ticketmanagementsystem.Repository;

import com.example.ticketmanagementsystem.Model.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, Integer> {

    Permission findPermissionByName(String name);
}