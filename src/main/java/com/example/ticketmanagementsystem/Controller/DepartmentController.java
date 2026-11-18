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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/department")
@AllArgsConstructor
public class DepartmentController {
    private final DepartmentService departmentService;

    @PreAuthorize("hasAuthority('DEPARTMENT_VIEW')")
    @GetMapping("/get")
    public ResponseEntity<?> getAllDepartments(){
        return ResponseEntity.status(200).body(departmentService.getAllDepartments());
    }

    @PreAuthorize("hasAuthority('DEPARTMENT_CREATE')")
    @PostMapping("/add")
    public ResponseEntity<?> addDepartment(@AuthenticationPrincipal User user, @RequestBody @Valid DepartmentDTO departmentToAdd){
        departmentService.addDepartment(user.getId(), departmentToAdd);
        return ResponseEntity.status(200).body(new ApiResponse("Department added successfully"));
    }

    @PreAuthorize("hasAuthority('DEPARTMENT_UPDATE')")
    @PutMapping("/update/{departmentId}")
    public ResponseEntity<?> updateDepartment(@AuthenticationPrincipal User user, @PathVariable Integer departmentId, @RequestBody @Valid DepartmentDTO departmentDTO){
        departmentService.updateDepartment(user.getId(), departmentId, departmentDTO);
        return ResponseEntity.status(200).body(new ApiResponse("Department updated successfully"));
    }

    @PreAuthorize("hasAuthority('DEPARTMENT_DELETE')")
    @DeleteMapping("/delete/{departmentId}")
    public ResponseEntity<?> deleteDepartment(@AuthenticationPrincipal User user, @PathVariable Integer departmentId){
        departmentService.deleteDepartment(user.getId(),departmentId);
        return ResponseEntity.status(200).body(new ApiResponse("Department deleted successfully"));
    }

    @PreAuthorize("hasAuthority('DEPARTMENT_VIEW')")
    @GetMapping("/get-department-by-id/{departmentId}")
    public ResponseEntity<?> getDepartmentById(@PathVariable Integer departmentId){
        DepartmentResponseDTO departmentResponseDTO = departmentService.getDepartmentById(departmentId);
        return ResponseEntity.status(200).body(departmentResponseDTO);
    }
}
