
package com.example.ticketmanagementsystem.DtoIn;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.Length;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SimCardDTO {

    @NotEmpty(message = "SimCard model can't be empty")
    @Length(max = 50, message = "SimCard model length can't be more than 50 characters")
    private String model;

    @NotEmpty(message = "SimCard serial number can't be empty")
    @Length(max = 50, message = "SimCard serial number length can't be more than 50 characters")
    private String serialNumber;
}
