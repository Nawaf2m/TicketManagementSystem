package com.example.ticketmanagementsystem.DtoOut;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MerchantResponseDTO {
    private Integer id;

    private String name;

    private List<CityResponseDTO> merchantCities;
}
