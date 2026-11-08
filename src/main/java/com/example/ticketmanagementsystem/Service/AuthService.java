package com.example.ticketmanagementsystem.Service;

import com.example.ticketmanagementsystem.Api.ApiException;
import com.example.ticketmanagementsystem.Model.Auth;
import com.example.ticketmanagementsystem.Repository.AuthRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@AllArgsConstructor
public class AuthService {
    private final AuthRepository authRepository;

    public List<Auth> get(){
        List<Auth> users = authRepository.findAll();

        if (users.isEmpty()){
            throw new ApiException("The list is empty");
        }

        return users;
    }
}
