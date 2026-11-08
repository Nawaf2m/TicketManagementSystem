package com.example.ticketmanagementsystem.Controller;

import com.example.ticketmanagementsystem.Api.ApiResponse;
import com.example.ticketmanagementsystem.DtoIn.DepartmentDTO;
import com.example.ticketmanagementsystem.DtoOut.DepartmentResponseDTO;
import com.example.ticketmanagementsystem.Model.Department;
import com.example.ticketmanagementsystem.Service.DepartmentService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
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

    @PostMapping("/add/{currentUserId}")
    public ResponseEntity<?> addDepartment(@PathVariable Integer currentUserId,@RequestBody @Valid DepartmentDTO departmentToAdd){
        departmentService.addDepartment(currentUserId, departmentToAdd);
        return ResponseEntity.status(200).body(new ApiResponse("Department added successfully"));
    }

    @PutMapping("/update/{currentUserId}/{departmentId}")
    public ResponseEntity<?> updateDepartment(@PathVariable Integer currentUserId, @PathVariable Integer departmentId, @RequestBody @Valid DepartmentDTO departmentDTO){
        departmentService.updateDepartment(currentUserId, departmentId, departmentDTO);
        return ResponseEntity.status(200).body(new ApiResponse("Department updated successfully"));
    }

    @DeleteMapping("/delete/{currentUserId}/{departmentId}")
    public ResponseEntity<?> deleteDepartment(@PathVariable Integer currentUserId, @PathVariable Integer departmentId){
        departmentService.deleteDepartment(currentUserId,departmentId);
        return ResponseEntity.status(200).body(new ApiResponse("Department deleted successfully"));
    }

    @GetMapping("/get-department-by-id/{departmentId}")
    public ResponseEntity<?> getDepartmentById(@PathVariable Integer departmentId){
        DepartmentResponseDTO departmentResponseDTO = departmentService.getDepartmentById(departmentId);
        return ResponseEntity.status(200).body(departmentResponseDTO);
    }
}
