package com.example.ticketmanagementsystem.DtoOut;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class TicketResponseDTO {
    private Integer id;

    private String title;

    private String description;

    private String priority;

    private String status;

    private LocalDateTime createdAt;

    private Integer createdById;

    private String createdByName;

    private Integer assignedToId;

    private String assignedToName;
}
