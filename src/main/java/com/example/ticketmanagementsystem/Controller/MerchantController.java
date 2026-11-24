
package com.example.ticketmanagementsystem.Controller;

import com.example.ticketmanagementsystem.Api.ApiResponse;
import com.example.ticketmanagementsystem.DtoIn.MerchantDTO;
import com.example.ticketmanagementsystem.DtoIn.UpdateMerchantNameDTO;
import com.example.ticketmanagementsystem.Service.MerchantService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/merchant")
@AllArgsConstructor
public class MerchantController {
    private final MerchantService merchantService;

    @PreAuthorize("hasAuthority('MERCHANT_VIEW')")
    @GetMapping("/get")
    public ResponseEntity<?> get(){
        return ResponseEntity.status(200).body(merchantService.getAllMerchants());
    }

    @PreAuthorize("hasAuthority('MERCHANT_CREATE')")
    @PostMapping("/add")
    public ResponseEntity<?> add(@RequestBody @Valid MerchantDTO merchantDTO){
        merchantService.addMerchant(merchantDTO);
        return ResponseEntity.status(200).body(new ApiResponse("Merchant added successfully"));
    }

    @PreAuthorize("hasAuthority('MERCHANT_VIEW')")
    @GetMapping("/get-merchant-by-id/{id}")
    public ResponseEntity<?> getMerchantById(@PathVariable Integer id){
        return ResponseEntity.status(200).body(merchantService.getMerchantById(id));
    }

    @PreAuthorize("hasAuthority('MERCHANT_UPDATE')")
    @PatchMapping("/update-name/{id}")
    public ResponseEntity<?> updateName(@PathVariable Integer id, @RequestBody @Valid UpdateMerchantNameDTO updateMerchantNameDTO){
        merchantService.updateMerchantName(id, updateMerchantNameDTO);
        return ResponseEntity.status(200).body(new ApiResponse("Merchant name updated successfully"));
    }

    @PreAuthorize("hasAuthority('MERCHANT_UPDATE')")
    @PatchMapping("/add-city/{merchantId}/{cityId}")
    public ResponseEntity<?> addCity(@PathVariable Integer merchantId, @PathVariable Integer cityId){
        merchantService.addCityToMerchant(merchantId, cityId);
        return ResponseEntity.status(200).body(new ApiResponse("City added to merchant successfully"));
    }

    @PreAuthorize("hasAuthority('MERCHANT_UPDATE')")
    @PatchMapping("/remove-city/{merchantId}/{cityId}")
    public ResponseEntity<?> removeCity(@PathVariable Integer merchantId, @PathVariable Integer cityId){
        merchantService.removeCityFromMerchant(merchantId, cityId);
        return ResponseEntity.status(200).body(new ApiResponse("City removed from merchant successfully"));
    }

    @PreAuthorize("hasAuthority('MERCHANT_DELETE')")
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id){
        merchantService.deleteMerchant(id);
        return ResponseEntity.status(200).body(new ApiResponse("Merchant deleted successfully"));
    }
}
