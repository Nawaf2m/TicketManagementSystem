package com.example.ticketmanagementsystem.Controller;

import com.example.ticketmanagementsystem.Api.ApiResponse;
import com.example.ticketmanagementsystem.DtoIn.CreateUserDTO;
import com.example.ticketmanagementsystem.DtoIn.UpdateUserDTO;
import com.example.ticketmanagementsystem.DtoIn.UpdateUserRoleDTO;
import com.example.ticketmanagementsystem.Service.UserService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/user")
@AllArgsConstructor
public class UserController {
    private final UserService userService;

    @GetMapping("/get/{currentUserId}")
    public ResponseEntity<?> getAllUsers(@PathVariable Integer currentUserId){
        return ResponseEntity.status(200).body(userService.getAllUsers(currentUserId));
    }

    @PostMapping("/add/{currentUserId}")
    public ResponseEntity<?> addUser(@PathVariable Integer currentUserId, @RequestBody @Valid CreateUserDTO newUser){
        userService.addUser(currentUserId, newUser);
        return ResponseEntity.status(200).body(new ApiResponse("User added successfully"));
    }

    @PutMapping("/update/{currentUserId}/{targetUserId}")
    public ResponseEntity<?> updateUser(@PathVariable Integer currentUserId,@PathVariable Integer targetUserId,@RequestBody @Valid UpdateUserDTO updateUser){
        userService.updateUser(currentUserId,targetUserId, updateUser);
        return ResponseEntity.status(200).body(new ApiResponse("User updated successfully"));
    }

    @PutMapping("/update-user-role/{currentUserId}/{targetUserId}")
    public ResponseEntity<?> updateUserRole(@PathVariable Integer currentUserId, @PathVariable Integer targetUserId, @RequestBody @Valid UpdateUserRoleDTO newRole){
        userService.updateUserRole(currentUserId, targetUserId, newRole);
        return ResponseEntity.status(200).body(new ApiResponse("User role updated successfully"));
    }

    @GetMapping("/get-user-by-id/{currentUserId}/{targetUserId}")
    public ResponseEntity<?> getUserById(@PathVariable Integer currentUserId,@PathVariable Integer targetUserId){
        return ResponseEntity.status(200).body(userService.getUserById(currentUserId, targetUserId));
    }

    @PatchMapping("/deactivate-user/{currentUserId}/{targetUserId}")
    public ResponseEntity<?> deactivateUser(@PathVariable Integer currentUserId,@PathVariable Integer targetUserId){
        userService.deactivateUser(currentUserId,targetUserId);
        return ResponseEntity.status(200).body(new ApiResponse("User account has been deactivated successfully"));
    }

    @PatchMapping("/activate-user/{currentUserId}/{targetUserId}")
    public ResponseEntity<?> activateUser(@PathVariable Integer currentUserId,@PathVariable Integer targetUserId){
        userService.activateUser(currentUserId, targetUserId);
        return ResponseEntity.status(200).body(new ApiResponse("User account has been activated successfully"));
    }
}
