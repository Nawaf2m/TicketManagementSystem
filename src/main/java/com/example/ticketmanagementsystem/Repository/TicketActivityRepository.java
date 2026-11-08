package com.example.ticketmanagementsystem.Repository;

import com.example.ticketmanagementsystem.Model.TicketActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketActivityRepository extends JpaRepository<TicketActivity, Integer> {
    TicketActivity findTicketActivityById(Integer id);

    List<TicketActivity> findAllByTicket_IdOrderByCreatedAtAsc(Integer ticketId);
}
