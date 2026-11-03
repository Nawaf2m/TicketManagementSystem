package com.example.ticketmanagementsystem.Api;

public class ApiException extends RuntimeException{
    public ApiException(String message){
        super(message);
    }
}
