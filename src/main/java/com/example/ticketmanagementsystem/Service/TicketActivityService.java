package com.example.ticketmanagementsystem.Service;

import com.example.ticketmanagementsystem.Model.Auth;
import com.example.ticketmanagementsystem.Model.Ticket;
import com.example.ticketmanagementsystem.Model.TicketActivity;
import com.example.ticketmanagementsystem.Repository.TicketActivityRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class TicketActivityService {
    private final TicketActivityRepository ticketActivityRepository;

    public void logActivity(Ticket ticket, Auth user, String action, String oldValue, String newValue) {

        TicketActivity activity = new TicketActivity();
        activity.setTicket(ticket);
        activity.setUser(user);
        activity.setAction(action);
        activity.setOldValue(oldValue);
        activity.setNewValue(newValue);

        ticketActivityRepository.save(activity);
    }
}
