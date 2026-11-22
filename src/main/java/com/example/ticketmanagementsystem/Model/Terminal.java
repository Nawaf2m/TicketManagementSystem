package com.example.ticketmanagementsystem.Model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.validator.constraints.Length;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@Entity
public class Terminal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotEmpty(message = "Terminal number can't be empty.")
    @Pattern(regexp = "^\\d{8}$", message = "Terminal number should be exactly 8 numbers")
    @Column(columnDefinition = "varchar(8)", nullable = false, unique = true)
    private String terminalNumber;

    @Pattern(regexp = "^\\d{16}$", message = "Full terminal number must be exactly 16 digits")
    @Column(columnDefinition = "varchar(16)", unique = true)
    private String fullTerminalNumber;

    @NotEmpty(message = "Status can't be empty")
    @Pattern(regexp = "^(NEW|PROCESSING|INSTALLED|PULLED_OUT|BROKEN)$", message = "Status must be NEW, PROCESSING, INSTALLED, PULLED_OUT or BROKEN")
    @Column(columnDefinition = "varchar(20) not null")
    private String status;

    @ManyToOne
    @JoinColumn(nullable = false)
    private Bank bank;

    @ManyToOne
    private Merchant merchant;

    @OneToOne
    @JoinColumn(unique = true)
    private Device device;

    @OneToOne
    @JoinColumn(unique = true)
    private SimCard simCard;

    @OneToMany(mappedBy = "terminal")
    private List<Ticket> tickets = new ArrayList<>();
}
