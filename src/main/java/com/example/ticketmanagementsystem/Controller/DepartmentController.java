package com.example.ticketmanagementsystem.Controller;

import com.example.ticketmanagementsystem.Api.ApiResponse;
import com.example.ticketmanagementsystem.DtoIn.DepartmentDTO;
import com.example.ticketmanagementsystem.DtoOut.DepartmentResponseDTO;
import com.example.ticketmanagementsystem.Model.Department;
import com.example.ticketmanagementsystem.Model.User;
import com.example.ticketmanagementsystem.Service.DepartmentService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/department")
@AllArgsConstructor
public class DepartmentController {
    private final DepartmentService departmentService;

    @GetMapping("/get")
    public ResponseEntity<?> getAllDepartments(){
        return ResponseEntity.status(200).body(departmentService.getAllDepartments());
    }

    @PostMapping("/add")
    public ResponseEntity<?> addDepartment(@AuthenticationPrincipal User user, @RequestBody @Valid DepartmentDTO departmentToAdd){
        departmentService.addDepartment(user.getId(), departmentToAdd);
        return ResponseEntity.status(200).body(new ApiResponse("Department added successfully"));
    }

    @PutMapping("/update/{departmentId}")
    public ResponseEntity<?> updateDepartment(@AuthenticationPrincipal User user, @PathVariable Integer departmentId, @RequestBody @Valid DepartmentDTO departmentDTO){
        departmentService.updateDepartment(user.getId(), departmentId, departmentDTO);
        return ResponseEntity.status(200).body(new ApiResponse("Department updated successfully"));
    }

    @DeleteMapping("/delete/{departmentId}")
    public ResponseEntity<?> deleteDepartment(@AuthenticationPrincipal User user, @PathVariable Integer departmentId){
        departmentService.deleteDepartment(user.getId(),departmentId);
        return ResponseEntity.status(200).body(new ApiResponse("Department deleted successfully"));
    }

    @GetMapping("/get-department-by-id/{departmentId}")
    public ResponseEntity<?> getDepartmentById(@PathVariable Integer departmentId){
        DepartmentResponseDTO departmentResponseDTO = departmentService.getDepartmentById(departmentId);
        return ResponseEntity.status(200).body(departmentResponseDTO);
    }
}
