
package com.example.ticketmanagementsystem.Controller;

import com.example.ticketmanagementsystem.Api.ApiResponse;
import com.example.ticketmanagementsystem.DtoIn.SimCardDTO;
import com.example.ticketmanagementsystem.Service.SimCardService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/simcard")
@AllArgsConstructor
public class SimCardController {

    private final SimCardService simCardService;

    @PreAuthorize("hasAuthority('SIMCARD_VIEW')")
    @GetMapping("/get")
    public ResponseEntity<?> get(){
        return ResponseEntity.status(200).body(simCardService.getAllSimCards());
    }

    @PreAuthorize("hasAuthority('SIMCARD_CREATE')")
    @PostMapping("/add")
    public ResponseEntity<?> add(@RequestBody @Valid SimCardDTO simCardDTO){
        simCardService.addSimCard(simCardDTO);
        return ResponseEntity.status(200).body(new ApiResponse("SimCard added successfully"));
    }

    @PreAuthorize("hasAuthority('SIMCARD_VIEW')")
    @GetMapping("/get-simcard-by-id/{id}")
    public ResponseEntity<?> getSimCardById(@PathVariable Integer id){
        return ResponseEntity.status(200).body(simCardService.getSimCardById(id));
    }

    @PreAuthorize("hasAuthority('SIMCARD_VIEW')")
    @GetMapping("/get-simcard-by-serial-number/{serialNumber}")
    public ResponseEntity<?> getSimCardBySerialNumber(@PathVariable String serialNumber){
        return ResponseEntity.status(200).body(simCardService.getSimCardBySerialNumber(serialNumber));
    }

    @PreAuthorize("hasAuthority('SIMCARD_UPDATE')")
    @PutMapping("/update/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody @Valid SimCardDTO simCardDTO){
        simCardService.updateSimCard(id, simCardDTO);
        return ResponseEntity.status(200).body(new ApiResponse("SimCard updated successfully"));
    }

    @PreAuthorize("hasAuthority('SIMCARD_DELETE')")
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id){
        simCardService.deleteSimCard(id);
        return ResponseEntity.status(200).body(new ApiResponse("SimCard deleted successfully"));
    }
}
