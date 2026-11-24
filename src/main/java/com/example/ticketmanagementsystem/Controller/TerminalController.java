
package com.example.ticketmanagementsystem.Controller;

import com.example.ticketmanagementsystem.Api.ApiResponse;
import com.example.ticketmanagementsystem.Service.TerminalService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/terminal")
@AllArgsConstructor
public class TerminalController {
    private final TerminalService terminalService;

    @PreAuthorize("hasAuthority('TERMINAL_VIEW')")
    @GetMapping("/get")
    public ResponseEntity<?> get(){
        return ResponseEntity.status(200).body(terminalService.getAllTerminals());
    }

    @PreAuthorize("hasAuthority('TERMINAL_CREATE')")
    @PostMapping("/create/{bankId}/{quantity}")
    public ResponseEntity<?> create(@PathVariable Integer bankId, @PathVariable Integer quantity){
        terminalService.createTerminals(bankId, quantity);
        return ResponseEntity.status(200).body(new ApiResponse("Terminals created successfully"));
    }

    @PreAuthorize("hasAuthority('TERMINAL_VIEW')")
    @GetMapping("/get-terminal-by-id/{id}")
    public ResponseEntity<?> getTerminalById(@PathVariable Integer id){
        return ResponseEntity.status(200).body(terminalService.getTerminalById(id));
    }

    @PreAuthorize("hasAuthority('TERMINAL_VIEW')")
    @GetMapping("/get-terminal-by-number/{terminalNumber}")
    public ResponseEntity<?> getTerminalByTerminalNumber(@PathVariable String terminalNumber){
        return ResponseEntity.status(200).body(terminalService.getTerminalByTerminalNumber(terminalNumber));
    }

    @PreAuthorize("hasAuthority('TERMINAL_VIEW')")
    @GetMapping("/get-terminal-by-full-number/{fullTerminalNumber}")
    public ResponseEntity<?> getTerminalByFullTerminalNumber(@PathVariable String fullTerminalNumber){
        return ResponseEntity.status(200).body(terminalService.getTerminalByFullTerminalNumber(fullTerminalNumber));
    }

    @PreAuthorize("hasAuthority('TERMINAL_VIEW')")
    @GetMapping("/get-terminals-by-bank/{bankId}")
    public ResponseEntity<?> getTerminalsByBank(@PathVariable Integer bankId){
        return ResponseEntity.status(200).body(terminalService.getTerminalsByBank(bankId));
    }

    @PreAuthorize("hasAuthority('TERMINAL_VIEW')")
    @GetMapping("/get-terminals-by-status/{status}")
    public ResponseEntity<?> getTerminalsByStatus(@PathVariable String status){
        return ResponseEntity.status(200).body(terminalService.getTerminalsByStatus(status));
    }

    @PreAuthorize("hasAuthority('TERMINAL_DELETE')")
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id){
        terminalService.deleteTerminal(id);
        return ResponseEntity.status(200).body(new ApiResponse("Terminal deleted successfully"));
    }
}
