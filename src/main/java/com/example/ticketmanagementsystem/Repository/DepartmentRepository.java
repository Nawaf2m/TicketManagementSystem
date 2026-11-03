package com.example.ticketmanagementsystem.Repository;

import com.example.ticketmanagementsystem.Model.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Integer> {
    Department findDepartmentById(Integer id);

    Department findDepartmentByName(String name);

    boolean existsByName(String name);
}
