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

    @NotEmpty(message = "Name can't be empty")
    @Length(min = 2, max = 20, message = "Name length must be between 2 and 20 characters")
    @Column(columnDefinition = "varchar(20) not null")
    private String name;

    @NotEmpty(message = "Email can't be empty")
    @Email(message = "Email must be in the right format")
    @Column(columnDefinition = "varchar(50) not null", unique = true)
    private String email;

    @Column(columnDefinition = "varchar(100) not null")
    private String password;

    @ManyToMany
    @JoinTable
    @JsonIgnore
    private Set<Role> roles = new HashSet<>();

    @ManyToOne
    private Department department;

    @OneToMany(mappedBy = "created_by")
    @JsonIgnore
    private List<Ticket> createdTickets = new ArrayList<>();

    @OneToMany(mappedBy = "assigned_to")
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
