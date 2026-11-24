package com.example.ticketmanagementsystem.DtoIn;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import org.hibernate.validator.constraints.Length;

@Data
public class UpdateMerchantNameDTO {
    @NotEmpty(message = "Merchant name can't be empty")
    @Length(max = 100, message = "Merchant name length can't be more 100 characters")
    private String name;
}
