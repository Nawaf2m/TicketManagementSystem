package com.example.ticketmanagementsystem.Controller;

import com.example.ticketmanagementsystem.DtoOut.TicketActivityResponseDTO;
import com.example.ticketmanagementsystem.Model.User;
import com.example.ticketmanagementsystem.Service.TicketActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ticket-activity")
@RequiredArgsConstructor
public class TicketActivityController {

    private final TicketActivityService ticketActivityService;

    @GetMapping("/get-ticket-activities/{ticketId}")
    public List<TicketActivityResponseDTO> getTicketActivities(@PathVariable Integer ticketId, @AuthenticationPrincipal User user) {
        return ticketActivityService.getTicketActivities(ticketId, user.getId());
    }

    @GetMapping("/get-recent-activities")
    public List<TicketActivityResponseDTO> getRecentActivities(@AuthenticationPrincipal User user) {
        return ticketActivityService.getRecentActivities(user.getId());
    }
}