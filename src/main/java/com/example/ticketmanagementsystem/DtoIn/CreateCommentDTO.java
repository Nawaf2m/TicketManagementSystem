package com.example.ticketmanagementsystem.DtoIn;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CreateCommentDTO {
    @NotBlank(message = "Comment can't be empty")
    @Size(max = 1000, message = "Comment can't be more than 1000 characters")
    private String comment;
}
