
package com.example.ticketmanagementsystem.DtoIn;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.Length;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DeviceDTO {

    @NotEmpty(message = "Device model can't be empty")
    @Length(max = 50, message = "Device model length can't be more than 50 characters")
    private String model;

    @NotEmpty(message = "Device serial number can't be empty")
    @Length(max = 50, message = "Device serial number length can't be more than 50 characters")
    private String serialNumber;
}
