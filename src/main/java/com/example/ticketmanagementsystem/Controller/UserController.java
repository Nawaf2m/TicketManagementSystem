package com.example.ticketmanagementsystem.Controller;

import com.example.ticketmanagementsystem.Api.ApiException;
import com.example.ticketmanagementsystem.Api.ApiResponse;
import com.example.ticketmanagementsystem.DtoIn.CreateUserDTO;
import com.example.ticketmanagementsystem.DtoIn.UpdateUserDTO;
import com.example.ticketmanagementsystem.DtoIn.UpdateUserRoleDTO;
import com.example.ticketmanagementsystem.Model.User;
import com.example.ticketmanagementsystem.Service.UserService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @Value("${app.admin.setup-key}")
    private String adminSetupKey;

    @PostMapping("/initialize-admin")
    public ResponseEntity<?> initializeAdmin(@RequestHeader("X-Setup-Key") String setupKey, @RequestBody @Valid CreateUserDTO newUser) {

        if (!setupKey.equals(adminSetupKey)) {
            throw new ApiException("Invalid admin setup key");
        }

        userService.initializeAdmin(newUser);

        return ResponseEntity.status(201)
                .body(new ApiResponse("Admin initialized successfully"));
    }

    @GetMapping("/get")
    public ResponseEntity<?> getAllUsers(@AuthenticationPrincipal User user){
        return ResponseEntity.status(200).body(userService.getAllUsers(user.getId()));
    }

    @PostMapping("/add")
    public ResponseEntity<?> addUser(@AuthenticationPrincipal User user, @RequestBody @Valid CreateUserDTO newUser){
        userService.addUser(user.getId(), newUser);
        return ResponseEntity.status(200).body(new ApiResponse("User added successfully"));
    }

    @PutMapping("/update/{targetUserId}")
    public ResponseEntity<?> updateUser(@AuthenticationPrincipal User user,@PathVariable Integer targetUserId,@RequestBody @Valid UpdateUserDTO updateUser){
        userService.updateUser(user.getId(),targetUserId, updateUser);
        return ResponseEntity.status(200).body(new ApiResponse("User updated successfully"));
    }

    @PutMapping("/update-user-role/{targetUserId}")
    public ResponseEntity<?> updateUserRole(@AuthenticationPrincipal User user, @PathVariable Integer targetUserId, @RequestBody @Valid UpdateUserRoleDTO newRole){
        userService.updateUserRole(user.getId(), targetUserId, newRole);
        return ResponseEntity.status(200).body(new ApiResponse("User role updated successfully"));
    }

    @GetMapping("/get-user-by-id/{targetUserId}")
    public ResponseEntity<?> getUserById(@AuthenticationPrincipal User user, @PathVariable Integer targetUserId){
        return ResponseEntity.status(200).body(userService.getUserById(user.getId(), targetUserId));
    }

    @PatchMapping("/deactivate-user/{targetUserId}")
    public ResponseEntity<?> deactivateUser(@AuthenticationPrincipal User user, @PathVariable Integer targetUserId){
        userService.deactivateUser(user.getId(),targetUserId);
        return ResponseEntity.status(200).body(new ApiResponse("User account has been deactivated successfully"));
    }

    @PatchMapping("/activate-user/{targetUserId}")
    public ResponseEntity<?> activateUser(@AuthenticationPrincipal User user,@PathVariable Integer targetUserId){
        userService.activateUser(user.getId(), targetUserId);
        return ResponseEntity.status(200).body(new ApiResponse("User account has been activated successfully"));
    }
}
