package com.example.ticketmanagementsystem.Service;

import com.example.ticketmanagementsystem.Api.ApiException;
import com.example.ticketmanagementsystem.DtoIn.DepartmentDTO;
import com.example.ticketmanagementsystem.DtoOut.DepartmentResponseDTO;
import com.example.ticketmanagementsystem.Model.User;
import com.example.ticketmanagementsystem.Model.Department;
import com.example.ticketmanagementsystem.Repository.AuthRepository;
import com.example.ticketmanagementsystem.Repository.DepartmentRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@AllArgsConstructor
public class DepartmentService {
    private final DepartmentRepository departmentRepository;
    private final AuthRepository authRepository;

    public List<DepartmentResponseDTO> getAllDepartments(){
        List<Department> departments = departmentRepository.findAll();

        if (departments.isEmpty()){
            throw new ApiException("The list is empty");
        }

        List<DepartmentResponseDTO> departmentsToReturn = new ArrayList<>();
        for (int i = 0; i < departments.size(); i++){
            departmentsToReturn.add(new DepartmentResponseDTO(departments.get(i).getId(), departments.get(i).getName()));
        }

        return departmentsToReturn;
    }

    public void addDepartment(Integer currentUserId, DepartmentDTO departmentToAdd){
        //Check if the user who accesses this endpoint is existed and his role is admin.
        User currentUser = authRepository.findUserById(currentUserId);

        if (currentUser == null){
            throw new ApiException("Wrong current user id");
        }

        if (!currentUser.isActive()
                || currentUser.getRole() == null
                || !currentUser.getRole().getName().equals("ADMIN")) {

            throw new ApiException("You are not allowed to access this endpoint");
        }

        String departmentName = departmentToAdd.getName().trim();

        if (departmentRepository.existsByNameIgnoreCase(departmentName)){
            throw new ApiException("Department name already exist");
        }

        Department department = new Department();

        department.setName(departmentName);

        departmentRepository.save(department);
    }

    public void updateDepartment(Integer currentUserId, Integer departmentId, DepartmentDTO departmentDTO) {
        //Check if the user who accesses this endpoint is existed and his role is admin.
        User currentUser = authRepository.findUserById(currentUserId);

        if (currentUser == null){
            throw new ApiException("Wrong current user id");
        }

        if (!currentUser.isActive()
                || currentUser.getRole() == null
                || !currentUser.getRole().getName().equals("ADMIN")) {

            throw new ApiException("You are not allowed to access this endpoint");
        }


        Department departmentToUpdate = departmentRepository.findDepartmentById(departmentId);

        //check if the department exist.
        if (departmentToUpdate == null){
            throw new ApiException("Department not found.");
        }

        String newDepartmentName = departmentDTO.getName().trim();

        if (departmentRepository.existsByNameIgnoreCaseAndIdNot(newDepartmentName, departmentId)){
            throw new ApiException("Department name '" + newDepartmentName + "' already exists.");
        }

        departmentToUpdate.setName(newDepartmentName);

        departmentRepository.save(departmentToUpdate);
    }

    public DepartmentResponseDTO getDepartmentById(Integer departmentId) {
        Department targetDepartment = departmentRepository.findDepartmentById(departmentId);

        if (targetDepartment == null){
            throw new ApiException("Department not found");
        }

        return new DepartmentResponseDTO(targetDepartment.getId(), targetDepartment.getName());
    }

    public void deleteDepartment(Integer currentUserId, Integer departmentId) {
        //Check if the user who accesses this endpoint is existed and his role is admin.
        User currentUser = authRepository.findUserById(currentUserId);

        if (currentUser == null){
            throw new ApiException("Wrong current user id");
        }

        if (!currentUser.isActive()
                || currentUser.getRole() == null
                || !currentUser.getRole().getName().equals("ADMIN")) {

            throw new ApiException("You are not allowed to access this endpoint");
        }

        Department departmentToDelete = departmentRepository.findDepartmentById(departmentId);

        //check if the department exist.
        if (departmentToDelete == null){
            throw new ApiException("Department not found.");
        }

        if (authRepository.existsByDepartment_Id(departmentId)){
            throw new ApiException("Cannot delete department because it has assigned users.");
        }

        departmentRepository.delete(departmentToDelete);
    }
}
