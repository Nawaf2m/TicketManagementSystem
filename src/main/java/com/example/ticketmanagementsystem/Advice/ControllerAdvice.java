package com.example.ticketmanagementsystem.Advice;

import com.example.ticketmanagementsystem.Api.ApiException;
import com.example.ticketmanagementsystem.Api.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.InvalidDataAccessResourceUsageException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;
import java.sql.SQLIntegrityConstraintViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.http.HttpStatus;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class ControllerAdvice {
    // Our Exception
    @ExceptionHandler(value = ApiException.class)
    public ResponseEntity<?> ApiException(ApiException e) {
        String message = e.getMessage();
        return ResponseEntity.status(400).body(new ApiResponse(message));
    }

    // Server Validation Exception
    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse> MethodArgumentNotValidException(MethodArgumentNotValidException e) {
        return ResponseEntity.status(400).body(new ApiResponse(e.getFieldError().getDefaultMessage()));
    }

    // Server Validation Exception
    @ExceptionHandler(value = ConstraintViolationException.class)
    public ResponseEntity<ApiResponse> ConstraintViolationException(ConstraintViolationException e) {

        return ResponseEntity.status(400).body(new ApiResponse(e.getMessage()));
    }

    // SQL Constraint Ex:(Duplicate) Exception
    @ExceptionHandler(value = SQLIntegrityConstraintViolationException.class)
    public ResponseEntity<ApiResponse> SQLIntegrityConstraintViolationException(SQLIntegrityConstraintViolationException e) {
        log.error("Database constraint violation", e);
        return ResponseEntity.status(400).body(new ApiResponse("The operation conflicts with existing data."));
    }

    // wrong write SQL in @column Exception
    @ExceptionHandler(value = InvalidDataAccessResourceUsageException.class)
    public ResponseEntity<ApiResponse> InvalidDataAccessResourceUsageException(InvalidDataAccessResourceUsageException e) {
        log.error("Database resource usage error", e);
        return ResponseEntity.status(500).body(new ApiResponse("Unable to complete the operation. Please try again later."));
    }

    // Database Constraint Exception
    @ExceptionHandler(value = DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse> DataIntegrityViolationException(DataIntegrityViolationException e) {
        log.error("Data integrity violation", e);
        return ResponseEntity.status(400).body(new ApiResponse("The operation conflicts with existing data."));
    }

    // Method not allowed Exception
    @ExceptionHandler(value = HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse> HttpRequestMethodNotSupportedException(HttpRequestMethodNotSupportedException e) {

        return ResponseEntity.status(400).body(new ApiResponse(e.getMessage()));
    }

    // Json parse Exception
    @ExceptionHandler(value = HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse> HttpMessageNotReadableException(HttpMessageNotReadableException e) {

        return ResponseEntity.status(400).body(new ApiResponse(e.getMessage()));
    }

    // TypesMisMatch Exception
    @ExceptionHandler(value = MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse> MethodArgumentTypeMismatchException(MethodArgumentTypeMismatchException e) {
        return ResponseEntity.status(400).body(new ApiResponse(e.getMessage()));
    }

    @ExceptionHandler(value = ResponseStatusException.class)
    public ResponseEntity<ApiResponse> ResponseStatusException(ResponseStatusException e) {

        return ResponseEntity.status(e.getStatusCode())
                .body(new ApiResponse(e.getReason() != null
                        ? e.getReason()
                        : "Request failed"));
    }

    @ExceptionHandler(value = RuntimeException.class)
    public ResponseEntity<ApiResponse> RuntimeException(RuntimeException e) {
        log.error("Unexpected server error", e);
        return ResponseEntity.status(500).body(new ApiResponse("An unexpected error occurred. Please try again later."));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDenied(
            AccessDeniedException e) {

        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", "Access denied"));
    }
}
