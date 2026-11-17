package com.example.ticketmanagementsystem.DtoOut;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class TicketActivityResponseDTO {

    private Integer id;
    private Integer ticketId;
    private Integer userId;
    private String userName;
    private String action;
    private String oldValue;
    private String newValue;
    private LocalDateTime createdAt;
}