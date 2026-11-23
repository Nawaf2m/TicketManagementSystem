package com.example.ticketmanagementsystem.Repository;

import com.example.ticketmanagementsystem.Model.Merchant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MerchantRepository extends JpaRepository<Merchant, Integer> {
    Merchant findMerchantById(Integer id);

    boolean existsByName(String name);

    Merchant findMerchantByName(String name);
}
