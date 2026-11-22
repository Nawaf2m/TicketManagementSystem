package com.example.ticketmanagementsystem.Repository;

import com.example.ticketmanagementsystem.Model.Bank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BankRepository extends JpaRepository<Bank, Integer> {
    Bank findBankById(Integer id);

    Bank findBankByName(String name);
    
    boolean existsByName(String name);
    
    boolean existsByCode(String code);
}
