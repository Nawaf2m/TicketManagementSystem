package com.example.ticketmanagementsystem.Service;

import com.example.ticketmanagementsystem.Api.ApiException;
import com.example.ticketmanagementsystem.DtoOut.TicketActivityResponseDTO;
import com.example.ticketmanagementsystem.Model.User;
import com.example.ticketmanagementsystem.Model.Ticket;
import com.example.ticketmanagementsystem.Model.TicketActivity;
import com.example.ticketmanagementsystem.Repository.AuthRepository;
import com.example.ticketmanagementsystem.Repository.TicketActivityRepository;
import com.example.ticketmanagementsystem.Repository.TicketRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class TicketActivityService {
    private final TicketActivityRepository ticketActivityRepository;
    private final TicketRepository ticketRepository;
    private final AuthRepository authRepository;

    public void logActivity(Ticket ticket, User user, String action, String oldValue, String newValue) {

        TicketActivity activity = new TicketActivity();
        activity.setTicket(ticket);
        activity.setUser(user);
        activity.setAction(action);
        activity.setOldValue(oldValue);
        activity.setNewValue(newValue);

        ticketActivityRepository.save(activity);
    }

    public List<TicketActivityResponseDTO> getTicketActivities(Integer ticketId, Integer userId) {

        User user = authRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found"));

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ApiException("Ticket not found"));

        if (!user.isActive()) {
            throw new ApiException("You are not allowed to access this endpoint because your account is not active");
        }

        boolean canViewAllTickets = user.getAuthorities().stream()
                .anyMatch(authority -> "TICKET_VIEW_ALL".equals(authority.getAuthority()));
        if (!canViewAllTickets) {

            boolean createdByUser = ticket.getCreatedBy() != null &&
                    ticket.getCreatedBy().getId().equals(userId);

            boolean assignedToUser = ticket.getAssignedTo() != null &&
                    ticket.getAssignedTo().getId().equals(userId);

            if (!createdByUser && !assignedToUser) {
                throw new ApiException("You are not allowed to view this ticket activity");
            }
        }

        return ticketActivityRepository.findByTicketIdOrderByCreatedAtDesc(ticketId)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<TicketActivityResponseDTO> getRecentActivities(Integer userId) {

        User user = authRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found"));

        if (!user.isActive()) {
            throw new ApiException("You are not allowed to access this endpoint because your account is not active");
        }

        return ticketActivityRepository.findTop10ByOrderByCreatedAtDesc()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    private TicketActivityResponseDTO convertToDTO(TicketActivity activity) {
        return new TicketActivityResponseDTO(
                activity.getId(),
                activity.getTicket().getId(),
                activity.getUser().getId(),
                activity.getUser().getName(),
                activity.getAction(),
                activity.getOldValue(),
                activity.getNewValue(),
                activity.getCreatedAt()
        );
    }
}
