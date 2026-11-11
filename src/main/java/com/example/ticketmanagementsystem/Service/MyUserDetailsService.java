package com.example.ticketmanagementsystem.Service;

import com.example.ticketmanagementsystem.Api.ApiException;
import com.example.ticketmanagementsystem.Model.User;
import com.example.ticketmanagementsystem.Repository.AuthRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MyUserDetailsService implements UserDetailsService {

    private final AuthRepository authRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

        User user = authRepository.findUserByEmail(email);

        if (user == null) {
            throw new UsernameNotFoundException("Wrong email or password");
        }

        return user;
    }
}

