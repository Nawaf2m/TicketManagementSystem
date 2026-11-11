package com.example.ticketmanagementsystem.Model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.validator.constraints.Length;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@NoArgsConstructor
public class Attachment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(nullable = false)
    private Ticket ticket;

    @ManyToOne
    @JoinColumn(nullable = false)
    private User uploadedBy;

    @NotBlank(message = "File name can't be empty")
    @Length(max = 255, message = "File name can't be more than 255 characters")
    @Column(length = 255, nullable = false)
    private String fileName;

    @NotBlank(message = "File path can't be empty")
    @Length(max = 300, message = "File path can't be more than 300 characters")
    @Column(length = 300, nullable = false)
    private String filePath;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
