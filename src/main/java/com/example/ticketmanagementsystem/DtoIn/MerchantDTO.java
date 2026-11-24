package com.example.ticketmanagementsystem.DtoIn;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.Length;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MerchantDTO {
    @NotEmpty(message = "Merchant name can't be empty")
    @Length(max = 100, message = "Merchant name length can't be more 100 characters")
    private String name;

    @NotEmpty(message = "Cities can't be empty")
    private List<Integer> cityIds = new ArrayList<>();
}
