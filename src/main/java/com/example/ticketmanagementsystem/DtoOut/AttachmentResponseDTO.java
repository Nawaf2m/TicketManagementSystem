package com.example.ticketmanagementsystem.DtoOut;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AttachmentResponseDTO {
    private Integer id;
    private String fileName;
    private Integer uploadedById;
    private String uploadedByName;
    private LocalDateTime createdAt;
}
