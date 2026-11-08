package com.example.ticketmanagementsystem.Repository;

import com.example.ticketmanagementsystem.Model.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Integer> {
    Ticket findTicketById(Integer id);

    List<Ticket> findAllByCreatedBy_Id(Integer userId);

    List<Ticket> findAllByAssignedTo_Id(Integer userId);

    List<Ticket> findAllByStatus(String status);

    List<Ticket> findAllByPriority(String priority);
}
