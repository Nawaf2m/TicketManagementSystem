package com.example.ticketmanagementsystem.Repository;

import com.example.ticketmanagementsystem.Model.SimCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SimCardRepository extends JpaRepository<SimCard, Integer> {
    SimCard findSimCardById(Integer id);

    boolean existsBySerialNumber(String serialNumber);

    SimCard findSimCardBySerialNumber(String serialNumber);
}