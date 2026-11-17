
package com.example.ticketmanagementsystem.DtoOut;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponseDTO {

    private String accessToken;
    private String tokenType;
    private Integer expiresIn;
}
