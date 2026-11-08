package com.example.ticketmanagementsystem.Model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.validator.constraints.Length;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@Entity
@NoArgsConstructor
public class Auth {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(columnDefinition = "varchar(20) not null")
    private String name;

    @Column(columnDefinition = "varchar(50) not null", unique = true)
    private String email;

    @Column(columnDefinition = "varchar(100) not null")
    private String password;

    @Column(nullable = false)
    private boolean active = true;

    @ManyToOne
    @JoinColumn(nullable = false)
    private Role role;

    @ManyToOne
    @JoinColumn(nullable = false)
    private Department department;

    @OneToMany(mappedBy = "createdBy")
    @JsonIgnore
    private List<Ticket> createdTickets = new ArrayList<>();

    @OneToMany(mappedBy = "assignedTo")
    @JsonIgnore
    private List<Ticket> assignedTickets = new ArrayList<>();

    @OneToMany(mappedBy = "user")
    @JsonIgnore
    private List<TicketActivity> ticketActivities = new ArrayList<>();

    @OneToMany(mappedBy = "user")
    @JsonIgnore
    private List<Comment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "uploaded_by")
    @JsonIgnore
    private List<Attachment> attachments = new ArrayList<>();
}
