package com.example.ticketmanagementsystem.Controller;

import com.example.ticketmanagementsystem.Api.ApiResponse;
import com.example.ticketmanagementsystem.DtoIn.CreateTicketDTO;
import com.example.ticketmanagementsystem.Model.User;
import com.example.ticketmanagementsystem.Service.TicketService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ticket")
@AllArgsConstructor
public class TicketController {
    private final TicketService ticketService;

    @GetMapping("/get")
    public ResponseEntity<?> getAllTickets(@AuthenticationPrincipal User user){
        return ResponseEntity.status(200).body(ticketService.getAllTickets(user.getId()));
    }

    @PostMapping("/add")
    public ResponseEntity<?> addTicket(@AuthenticationPrincipal User user, @RequestBody @Valid CreateTicketDTO ticketDTO){
        ticketService.addTicket(user.getId(), ticketDTO);
        return ResponseEntity.status(200).body(new ApiResponse("Ticket Added successfully."));
    }

    @GetMapping("/get-my-tickets")
    public ResponseEntity<?> getMyTickets(@AuthenticationPrincipal User user){
        return ResponseEntity.status(200).body(ticketService.getMyTickets(user.getId()));
    }

    @GetMapping("/get-ticket-by-id/{ticketId}")
    public ResponseEntity<?> getTicketById(@AuthenticationPrincipal User user, @PathVariable Integer ticketId){
        return ResponseEntity.status(200).body(ticketService.getTicketById(user.getId(), ticketId));
    }

    @PatchMapping("/assign-ticket/{ticketId}/{agentId}")
    public ResponseEntity<?> assignTicket(@AuthenticationPrincipal User user, @PathVariable Integer ticketId, @PathVariable Integer agentId){
        ticketService.assignTicket(user.getId(), ticketId, agentId);
        return ResponseEntity.status(200).body(new ApiResponse("Ticket assigned successfully"));
    }

    @PatchMapping("/advance-ticket-status/{ticketId}")
    public ResponseEntity<?> advanceTicketStatus(@AuthenticationPrincipal User user,@PathVariable Integer ticketId){
        ticketService.advanceTicketStatus(user.getId(), ticketId);
        return ResponseEntity.status(200).body(new ApiResponse("Ticket status updated successfully."));
    }

    @PatchMapping("/update-ticket-priority/{ticketId}/{newPriority}")
    public ResponseEntity<?> updateTicketPriority(@AuthenticationPrincipal User user, @PathVariable Integer ticketId, @PathVariable String newPriority){
        ticketService.updateTicketPriority(user.getId(), ticketId, newPriority);
        return ResponseEntity.status(200).body(new ApiResponse("Ticket priority updated successfully."));
    }

    @GetMapping("/get-assigned-tickets")
    public ResponseEntity<?> getAssignedTickets(@AuthenticationPrincipal User user){
        return ResponseEntity.status(200).body(ticketService.getAssignedTickets(user.getId()));
    }
}
