package com.example.ticketmanagementsystem.Model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

@Getter
@Setter
@Entity
@NoArgsConstructor
public class User implements UserDetails {
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

    @OneToMany(mappedBy = "uploadedBy")
    @JsonIgnore
    private List<Attachment> attachments = new ArrayList<>();

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singleton(new SimpleGrantedAuthority(this.role.getName()));
    }

    @Override
    public String getUsername() {
        return this.email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return this.active;
    }
}
