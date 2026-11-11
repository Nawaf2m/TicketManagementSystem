package com.example.ticketmanagementsystem.Service;

import com.example.ticketmanagementsystem.Api.ApiException;
import com.example.ticketmanagementsystem.DtoIn.CreateUserDTO;
import com.example.ticketmanagementsystem.DtoIn.UpdateUserDTO;
import com.example.ticketmanagementsystem.DtoIn.UpdateUserRoleDTO;
import com.example.ticketmanagementsystem.DtoOut.UserResponseDTO;
import com.example.ticketmanagementsystem.Model.User;
import com.example.ticketmanagementsystem.Model.Department;
import com.example.ticketmanagementsystem.Model.Role;
import com.example.ticketmanagementsystem.Repository.AuthRepository;
import com.example.ticketmanagementsystem.Repository.DepartmentRepository;
import com.example.ticketmanagementsystem.Repository.RoleRepository;
import lombok.AllArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@AllArgsConstructor
public class UserService {
    private final AuthRepository authRepository;
    private final RoleRepository roleRepository;
    private final DepartmentRepository departmentRepository;

    public void initializeAdmin(CreateUserDTO newUser){
        //check if email already used.
        if (authRepository.findUserByEmail(newUser.getEmail()) != null) {
            throw new ApiException("Email already exists");
        }

        //if role admin not exist then create it.
        Role adminRole = roleRepository.findRoleByName("ADMIN");

        if (adminRole == null){
            adminRole = new Role();
            adminRole.setName("ADMIN");
            roleRepository.save(adminRole);
        }

        //if there is at least one admin the system then this method no one can use it to create an admin.
        if (authRepository.countByRole_Name("ADMIN") >= 1){
            throw new ApiException("There is already admin in the system.");
        }

        Department departmentIT = departmentRepository.findDepartmentByName("IT");

        //if IT department not exist then create it.
        if (departmentIT == null){
            departmentIT = new Department();
            departmentIT.setName("IT");
            departmentRepository.save(departmentIT);
        }

        User admin = new User();

        admin.setName(newUser.getName());
        admin.setEmail(newUser.getEmail());
        String hash = new BCryptPasswordEncoder().encode(newUser.getPassword());
        admin.setPassword(hash);
        admin.setDepartment(departmentIT);
        admin.setRole(adminRole);
        admin.setActive(true);

        authRepository.save(admin);
    }

    public List<UserResponseDTO> getAllUsers(Integer currentUserId){
        //Check if the user who accesses this endpoint is existed and his role is admin.
        User currentUser = authRepository.findUserById(currentUserId);

        if (currentUser == null){
            throw new ApiException("Wrong current user id");
        }

        if (!currentUser.isActive() || currentUser.getRole() == null || !currentUser.getRole().getName().equals("ADMIN")) {

            throw new ApiException("You are not allowed to access this endpoint");
        }

        List<User> users = authRepository.findAll();

        if (users.isEmpty()){
            throw new ApiException("The list is empty");
        }

        List<UserResponseDTO> targetUsers = new ArrayList<>();

        for (int i = 0; i < users.size(); i++){
            targetUsers.add(new UserResponseDTO(users.get(i).getId(), users.get(i).getName(),
                    users.get(i).getEmail(), users.get(i).getDepartment().getName(),
                    users.get(i).getRole().getName()));
        }

        return targetUsers;
    }

    public void addUser(Integer currentUserId, CreateUserDTO newUser){
        //Check if the user who accesses this endpoint is exist and his role is admin.
        User currentUser = authRepository.findUserById(currentUserId);

        if (currentUser == null){
            throw new ApiException("Wrong current user id");
        }

        if (!currentUser.isActive()
                || currentUser.getRole() == null
                || !currentUser.getRole().getName().equals("ADMIN")) {

            throw new ApiException("You are not allowed to access this endpoint");
        }

        //check if the email have been used by another user or not.
        User checkUserEmailExist = authRepository.findUserByEmail(newUser.getEmail());

        if (checkUserEmailExist != null){
            throw new ApiException("Email already have been used.");
        }

        //check if the department exist.
        Department department = departmentRepository.findDepartmentById(newUser.getDepartmentId());

        if (department == null){
            throw new ApiException("Department not exist");
        }

        //check if the role exist.
        Role role = roleRepository.findRoleByName(newUser.getRoleName());

        if (role == null){
            throw new ApiException("Role not exist");
        }

        //After we have checked that the one who is add a new user is the admin and the email
        //have not been used by another user and we have checked that the role and the department exist
        //now we can add the user to our system safely.
        User createNewUser = new User();

        createNewUser.setName(newUser.getName());
        createNewUser.setEmail(newUser.getEmail());
        String hash = new BCryptPasswordEncoder().encode(newUser.getPassword());
        createNewUser.setPassword(hash);
        createNewUser.setDepartment(department);
        createNewUser.setRole(role);

        authRepository.save(createNewUser);
    }

    public void updateUser(Integer currentUserId, Integer targetUserId, UpdateUserDTO updateUser){
        //Check if the user who accesses this endpoint is exist and his role is admin.
        User currentUser = authRepository.findUserById(currentUserId);

        if (currentUser == null){
            throw new ApiException("Wrong current user id");
        }

        if (!currentUser.isActive()
                || currentUser.getRole() == null
                || !currentUser.getRole().getName().equals("ADMIN")) {

            throw new ApiException("You are not allowed to access this endpoint");
        }

        //check if user to update is exist.
        User userToUpdate = authRepository.findUserById(targetUserId);

        if (userToUpdate == null){
            throw new ApiException("Wrong target user id.");
        }

        //check if the department exist.
        Department department = departmentRepository.findDepartmentById(updateUser.getDepartmentId());

        if (department == null){
            throw new ApiException("Department not exist");
        }

        User emailOwner = authRepository.findUserByEmail(updateUser.getEmail());

        if (emailOwner != null && !emailOwner.getId().equals(targetUserId)) {
            throw new ApiException("Email already used by another user");
        }

        //After we have checked that the one who is update the user is the admin and the email
        //have not been used by another user and we have checked that the department exist
        //now we can update the user safely.
        userToUpdate.setName(updateUser.getName());
        userToUpdate.setEmail(updateUser.getEmail());
        userToUpdate.setDepartment(department);

        authRepository.save(userToUpdate);
    }

    public void updateUserRole(Integer currentUserId, Integer targetUserId, UpdateUserRoleDTO newRole){
        //Check if the user who accesses this endpoint is exist and his role is admin.
        User currentUser = authRepository.findUserById(currentUserId);

        if (currentUser == null){
            throw new ApiException("Wrong current user id");
        }

        if (!currentUser.isActive()
                || currentUser.getRole() == null
                || !currentUser.getRole().getName().equals("ADMIN")) {

            throw new ApiException("You are not allowed to access this endpoint");
        }

        //check if user to update is exist.
        User userToUpdate = authRepository.findUserById(targetUserId);

        if (userToUpdate == null){
            throw new ApiException("Wrong target user id.");
        }

        //check if the role exist.
        Role role = roleRepository.findRoleByName(newRole.getRoleName());

        if (role == null){
            throw new ApiException("Role not exist");
        }

        //if the count of role admin is one and the target user to update is the admin
        //then we will not make him change the role.
        if (userToUpdate.getRole() != null && userToUpdate.getRole().getName().equals("ADMIN") && !role.getName().equals("ADMIN") && authRepository.countByRole_Name("ADMIN") == 1) {
            throw new ApiException("Can't change the role because the target is the last admin in the system");
        }

        //now update the user role.
        userToUpdate.setRole(role);

        authRepository.save(userToUpdate);
    }

    public UserResponseDTO getUserById(Integer currentUserId, Integer targetUserId){
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

        User targetUser = authRepository.findUserById(targetUserId);

        if (targetUser == null){
            throw new ApiException("User not found");
        }

        return new UserResponseDTO(targetUser.getId(), targetUser.getName(), targetUser.getEmail(),
                targetUser.getDepartment().getName(), targetUser.getRole().getName());
    }

    public void deactivateUser(Integer currentUserId, Integer targetUserId){
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

        User targetUser = authRepository.findUserById(targetUserId);

        if (targetUser == null){
            throw new ApiException("User not found");
        }

        if (!targetUser.isActive()) {
            throw new ApiException("User is already deactivated");
        }

        if (targetUser.getRole().getName().equals("ADMIN")
                && authRepository.countByRole_NameAndActiveTrue("ADMIN") == 1) {

            throw new ApiException("Can't deactivate the last active admin in the system");
        }

        targetUser.setActive(false);

        authRepository.save(targetUser);
    }

    public void activateUser(Integer currentUserId, Integer targetUserId){
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

        User targetUser = authRepository.findUserById(targetUserId);

        if (targetUser == null){
            throw new ApiException("User not found");
        }

        if (targetUser.isActive()) {
            throw new ApiException("User is already activat");
        }

        targetUser.setActive(true);

        authRepository.save(targetUser);
    }
}
