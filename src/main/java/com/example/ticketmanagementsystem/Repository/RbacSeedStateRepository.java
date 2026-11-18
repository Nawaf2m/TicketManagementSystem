package com.example.ticketmanagementsystem.Repository;

import com.example.ticketmanagementsystem.Model.RbacSeedState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RbacSeedStateRepository
        extends JpaRepository<RbacSeedState, Integer> {
}