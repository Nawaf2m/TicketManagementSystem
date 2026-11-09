package com.example.ticketmanagementsystem.Controller;

import com.example.ticketmanagementsystem.Api.ApiResponse;
import com.example.ticketmanagementsystem.DtoIn.CreateTicketDTO;
import com.example.ticketmanagementsystem.Service.TicketService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ticket")
@AllArgsConstructor
public class TicketController {
    private final TicketService ticketService;

    @GetMapping("/get/{currentUserId}")
    public ResponseEntity<?> getAllTickets(@PathVariable Integer currentUserId){
        return ResponseEntity.status(200).body(ticketService.getAllTickets(currentUserId));
    }

    @PostMapping("/add/{currentUserId}")
    public ResponseEntity<?> addTicket(@PathVariable Integer currentUserId, @RequestBody @Valid CreateTicketDTO ticketDTO){
        ticketService.addTicket(currentUserId, ticketDTO);
        return ResponseEntity.status(200).body(new ApiResponse("Ticket Added successfully."));
    }

    @GetMapping("/get-my-tickets/{currentUserId}")
    public ResponseEntity<?> getMyTickets(@PathVariable Integer currentUserId){
        return ResponseEntity.status(200).body(ticketService.getMyTickets(currentUserId));
    }

    @GetMapping("/get-ticket-by-id/{currentUserId}/{ticketId}")
    public ResponseEntity<?> getTicketById(@PathVariable Integer currentUserId, @PathVariable Integer ticketId){
        return ResponseEntity.status(200).body(ticketService.getTicketById(currentUserId, ticketId));
    }

    @PatchMapping("/assign-ticket/{currentUserId}/{ticketId}/{agentId}")
    public ResponseEntity<?> assignTicket(@PathVariable Integer currentUserId, @PathVariable Integer ticketId, @PathVariable Integer agentId){
        ticketService.assignTicket(currentUserId, ticketId, agentId);
        return ResponseEntity.status(200).body(new ApiResponse("Ticket assigned successfully"));
    }

    @PatchMapping("/advance-ticket-status/{currentUserId}/{ticketId}")
    public ResponseEntity<?> advanceTicketStatus(@PathVariable Integer currentUserId,@PathVariable Integer ticketId){
        ticketService.advanceTicketStatus(currentUserId, ticketId);
        return ResponseEntity.status(200).body(new ApiResponse("Ticket status updated successfully."));
    }

    @PatchMapping("/update-ticket-priority/{currentUserId}/{ticketId}/{newPriority}")
    public ResponseEntity<?> updateTicketPriority(@PathVariable Integer currentUserId, @PathVariable Integer ticketId, @PathVariable String newPriority){
        ticketService.updateTicketPriority(currentUserId, ticketId, newPriority);
        return ResponseEntity.status(200).body(new ApiResponse("Ticket priority updated successfully."));
    }

    @GetMapping("/get-assigned-tickets/{currentUserId}")
    public ResponseEntity<?> getAssignedTickets(@PathVariable Integer currentUserId){
        return ResponseEntity.status(200).body(ticketService.getAssignedTickets(currentUserId));
    }
}
