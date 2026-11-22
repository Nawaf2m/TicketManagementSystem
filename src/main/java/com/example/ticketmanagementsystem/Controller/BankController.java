package com.example.ticketmanagementsystem.Controller;

import com.example.ticketmanagementsystem.Api.ApiResponse;
import com.example.ticketmanagementsystem.DtoIn.BankDTOIn;
import com.example.ticketmanagementsystem.DtoIn.UpdateBankNameDTO;
import com.example.ticketmanagementsystem.Service.BankService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/bank")
@AllArgsConstructor
public class BankController {
    private final BankService bankService;

    @PreAuthorize("hasAuthority('BANK_VIEW')")
    @GetMapping("/get")
    public ResponseEntity<?> get(){
        return ResponseEntity.status(200).body(bankService.getAllBanks());
    }

    @PreAuthorize("hasAuthority('BANK_CREATE')")
    @PostMapping("/add")
    public ResponseEntity<?> add(@RequestBody @Valid BankDTOIn bankDTOIn){
        bankService.addBank(bankDTOIn);
        return ResponseEntity.status(200).body(new ApiResponse("Bank added successfully"));
    }

    @PreAuthorize("hasAuthority('BANK_VIEW')")
    @GetMapping("/get-bank-by-id/{id}")
    public ResponseEntity<?> getBankById(@PathVariable Integer id){
        return ResponseEntity.status(200).body(bankService.getBankById(id));
    }

    @PreAuthorize("hasAuthority('BANK_UPDATE')")
    @PatchMapping("/update-name/{id}")
    public ResponseEntity<?> updateName(@PathVariable Integer id, @RequestBody @Valid UpdateBankNameDTO updateBankNameDTO){
        bankService.updateName(id, updateBankNameDTO);
        return ResponseEntity.status(200).body(new ApiResponse("Name updated successfully"));
    }

    @PreAuthorize("hasAuthority('BANK_DELETE')")
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id){
        bankService.deleteBank(id);
        return ResponseEntity.status(200).body(new ApiResponse("Bank deleted successfully"));
    }
}
