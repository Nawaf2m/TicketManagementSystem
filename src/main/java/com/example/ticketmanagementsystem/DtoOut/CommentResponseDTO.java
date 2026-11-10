package com.example.ticketmanagementsystem.DtoOut;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class CommentResponseDTO {
    private Integer commentId;

    private Integer userId;

    private String userName;

    private String comment;

    private LocalDateTime createdAt;
}
