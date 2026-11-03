package com.example.ticketmanagementsystem.Model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.validator.constraints.Length;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@NoArgsConstructor
public class Ticket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotEmpty(message = "Title can't be empty")
    @Length(min = 5, max = 30, message = "Title length must be between 5 and 30")
    @Column(columnDefinition = "varchar(30) not null")
    private String title;

    @NotEmpty(message = "Description can't be empty")
    @Length(max = 300, message = "Description can't be more than 300 characters")
    @Column(columnDefinition = "varchar(300) not null")
    private String description;

    @NotEmpty(message = "Priority can't be empty")
    @Pattern(regexp = "^(LOW|MEDIUM|HIGH)$", message = "Priority must be LOW, MEDIUM or HIGH")
    @Column(columnDefinition = "varchar(20) not null")
    private String priority;

    @NotEmpty(message = "Status can't be empty")
    @Pattern(regexp = "^(OPEN|IN_PROGRESS|RESOLVED|CLOSED)$", message = "Status must be OPEN, IN_PROGRESS, RESOLVED or CLOSED")
    @Column(columnDefinition = "varchar(20) not null")
    private String status;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime created_at;

    @UpdateTimestamp
    private LocalDateTime updated_at;

    @ManyToOne
    @JoinColumn(nullable = false)
    private Auth created_by;

    @ManyToOne
    private Auth assigned_to;

    @OneToMany(mappedBy = "ticket")
    @JsonIgnore
    private List<TicketActivity> ticketActivities = new ArrayList<>();

    @OneToMany(mappedBy = "ticket")
    @JsonIgnore
    private List<Comment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "ticket")
    @JsonIgnore
    private List<Attachment> attachments = new ArrayList<>();
}
