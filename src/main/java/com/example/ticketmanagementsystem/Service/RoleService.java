package com.example.ticketmanagementsystem.Service;

import com.example.ticketmanagementsystem.Model.Role;
import com.example.ticketmanagementsystem.Repository.RoleRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class RoleService {
    private final RoleRepository roleRepository;

    @Transactional
    public String initializeRoles(){
        List<Role> allRoles = roleRepository.findAll();

        boolean adminExist = false, agentExist = false, employeeExist = false;
        for (int i = 0; i < allRoles.size(); i++){
            if (allRoles.get(i).getName().equals("ADMIN")){
                adminExist = true;
            } else if (allRoles.get(i).getName().equals("AGENT")){
                agentExist = true;
            } else if (allRoles.get(i).getName().equals("EMPLOYEE")) {
                employeeExist = true;
            }
        }

        if (adminExist && agentExist && employeeExist){
            return "Roles are already initialized";
        }

        if (!adminExist){
            Role adminRole = new Role();
            adminRole.setName("ADMIN");
            roleRepository.save(adminRole);
        }

        if (!agentExist){
            Role agentRole = new Role();
            agentRole.setName("AGENT");
            roleRepository.save(agentRole);
        }

        if (!employeeExist){
            Role employeeRole = new Role();
            employeeRole.setName("EMPLOYEE");
            roleRepository.save(employeeRole);
        }

        return "Missing roles initialized successfully";
    }
}
