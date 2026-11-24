package com.example.ticketmanagementsystem.Repository;

import com.example.ticketmanagementsystem.Model.Bank;
import com.example.ticketmanagementsystem.Model.Terminal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TerminalRepository extends JpaRepository<Terminal, Integer> {
    Terminal findTerminalById(Integer id);

    boolean existsByTerminalNumber(String terminalNumber);

    Terminal findTerminalByTerminalNumber(String terminalNumber);

    boolean existsByFullTerminalNumber(String fullTerminalNumber);

    boolean existsByDevice_Id(Integer deviceId);

    Terminal findTerminalByFullTerminalNumber(String fullTerminalNumber);

    List<Terminal> findTerminalsByBank(Bank bank);

    List<Terminal> findTerminalsByStatus(String status);
}
