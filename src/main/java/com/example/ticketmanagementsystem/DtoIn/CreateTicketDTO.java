package com.example.ticketmanagementsystem.DtoIn;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.validator.constraints.Length;

@Getter
@Setter
@NoArgsConstructor
public class CreateTicketDTO {
    @NotEmpty(message = "Title can't be empty")
    @Length(min = 5, max = 30, message = "Title length must be between 5 and 30")
    private String title;

    @NotEmpty(message = "Description can't be empty")
    @Length(max = 300, message = "Description can't be more than 300 characters")
    private String description;

    @NotEmpty(message = "Priority can't be empty")
    @Pattern(regexp = "^(LOW|MEDIUM|HIGH)$", message = "Priority must be LOW, MEDIUM or HIGH")
    private String priority;
}
