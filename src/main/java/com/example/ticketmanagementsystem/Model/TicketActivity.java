package com.example.ticketmanagementsystem.Model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@NoArgsConstructor
public class TicketActivity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotEmpty(message = "Action can't be empty")
    @Pattern(regexp = "^(ASSIGNED|PRIORITY|STATUS)$", message = "Action must be ASSIGNED, PRIORITY or STATUS")
    @Column(columnDefinition = "varchar(10)", nullable = false)
    private String action;

    @ManyToOne
    @JoinColumn(nullable = false)
    private Ticket ticket;

    @ManyToOne
    @JoinColumn(nullable = false)
    private Auth user;

    @Column(columnDefinition = "varchar(100)")
    private String old_value;

    @NotEmpty(message = "New_value can't be empty")
    @Column(columnDefinition = "varchar(100) not null")
    private String new_value;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
