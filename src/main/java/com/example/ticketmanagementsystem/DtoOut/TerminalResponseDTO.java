package com.example.ticketmanagementsystem.DtoOut;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TerminalResponseDTO {
    private Integer id;
    private String terminalNumber;
    private String fullTerminalNumber;
    private String status;

    private String bankName;

    private String merchantName;

    private String deviceModel;
    private String deviceSerialNumber;

    private String simCardModel;
    private String simCardSerialNumber;
}
