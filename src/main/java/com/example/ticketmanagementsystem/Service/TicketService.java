package com.example.ticketmanagementsystem.Service;

import com.example.ticketmanagementsystem.Api.ApiException;
import com.example.ticketmanagementsystem.DtoIn.CreateTicketDTO;
import com.example.ticketmanagementsystem.DtoOut.TicketResponseDTO;
import com.example.ticketmanagementsystem.Model.Auth;
import com.example.ticketmanagementsystem.Model.Ticket;
import com.example.ticketmanagementsystem.Repository.AuthRepository;
import com.example.ticketmanagementsystem.Repository.TicketRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@AllArgsConstructor
public class TicketService {
    private final TicketRepository ticketRepository;
    private final AuthRepository authRepository;
    private final TicketActivityService ticketActivityService;

    public List<TicketResponseDTO> getAllTickets(Integer currentUserId) {
        //Check if the user who accesses this endpoint is existed and his role is admin.
        Auth currentUser = authRepository.findAuthById(currentUserId);

        if (currentUser == null){
            throw new ApiException("Wrong current user id");
        }

        if (!currentUser.isActive() || currentUser.getRole() == null || !currentUser.getRole().getName().equals("ADMIN")) {
            throw new ApiException("You are not allowed to access this endpoint");
        }

        List<Ticket> tickets = ticketRepository.findAll();

        if (tickets.isEmpty()){
            throw new ApiException("The list is empty");
        }

        List<TicketResponseDTO> ticketResponseDTOS = new ArrayList<>();
        for (int i = 0; i < tickets.size(); i++){
            Ticket currentTicket = tickets.get(i);

            Integer assignedToId = currentTicket.getAssignedTo() != null
                    ? currentTicket.getAssignedTo().getId() : null;

            String assignedToName = currentTicket.getAssignedTo() != null
                    ? currentTicket.getAssignedTo().getName() : null;

            ticketResponseDTOS.add(new TicketResponseDTO(
                    currentTicket.getId(),
                    currentTicket.getTitle(),
                    currentTicket.getDescription(),
                    currentTicket.getPriority(),
                    currentTicket.getStatus(),
                    currentTicket.getCreatedAt(),
                    currentTicket.getCreatedBy().getId(),
                    currentTicket.getCreatedBy().getName(),
                    assignedToId,
                    assignedToName
            ));
        }

        return ticketResponseDTOS;
    }

    public void addTicket(Integer currentUserId, CreateTicketDTO ticketDTO) {
        // Check if the current user exists and is active.
        Auth currentUser = authRepository.findAuthById(currentUserId);

        if (currentUser == null){
            throw new ApiException("Wrong current user id");
        }

        if (!currentUser.isActive()) {
            throw new ApiException("You are not allowed to access this endpoint because your account is not active");
        }

        Ticket newTicket = new Ticket();

        newTicket.setTitle(ticketDTO.getTitle());
        newTicket.setDescription(ticketDTO.getDescription());
        newTicket.setPriority(ticketDTO.getPriority());
        newTicket.setStatus("OPEN");
        newTicket.setCreatedBy(currentUser);

        ticketRepository.save(newTicket);
    }

    public List<TicketResponseDTO> getMyTickets(Integer currentUserId) {
        // Check if the current user exists and is active.
        Auth currentUser = authRepository.findAuthById(currentUserId);

        if (currentUser == null){
            throw new ApiException("Wrong current user id");
        }

        if (!currentUser.isActive()) {
            throw new ApiException("You are not allowed to access this endpoint because your account is not active");
        }

        List<Ticket> myTickets = ticketRepository.findAllByCreatedBy_Id(currentUserId);

        if (myTickets.isEmpty()){
            throw new ApiException("The list is empty");
        }

        List<TicketResponseDTO> ticketResponseDTOS = new ArrayList<>();
        for (int i = 0; i < myTickets.size(); i++){
            Ticket currentTicket = myTickets.get(i);

            Integer assignedToId = currentTicket.getAssignedTo() != null
                    ? currentTicket.getAssignedTo().getId() : null;

            String assignedToName = currentTicket.getAssignedTo() != null
                    ? currentTicket.getAssignedTo().getName() : null;

            ticketResponseDTOS.add(new TicketResponseDTO(
                    currentTicket.getId(),
                    currentTicket.getTitle(),
                    currentTicket.getDescription(),
                    currentTicket.getPriority(),
                    currentTicket.getStatus(),
                    currentTicket.getCreatedAt(),
                    currentUser.getId(),
                    currentUser.getName(),
                    assignedToId,
                    assignedToName
            ));
        }

        return ticketResponseDTOS;
    }

    public TicketResponseDTO getTicketById(Integer currentUserId, Integer ticketId) {
        // Check if the current user exists and is active.
        Auth currentUser = authRepository.findAuthById(currentUserId);

        if (currentUser == null){
            throw new ApiException("Wrong current user id");
        }

        if (!currentUser.isActive()) {
            throw new ApiException("You are not allowed to access this endpoint because your account is not active");
        }

        Ticket targetTicket = ticketRepository.findTicketById(ticketId);

        if (targetTicket == null){
            throw new ApiException("Ticket not found.");
        }

        Integer assignedToId = targetTicket.getAssignedTo() != null
                ? targetTicket.getAssignedTo().getId() : null;

        String assignedToName = targetTicket.getAssignedTo() != null
                ? targetTicket.getAssignedTo().getName() : null;

        TicketResponseDTO ticketResponseDTO = new TicketResponseDTO(
                targetTicket.getId(),
                targetTicket.getTitle(),
                targetTicket.getDescription(),
                targetTicket.getPriority(),
                targetTicket.getStatus(),
                targetTicket.getCreatedAt(),
                targetTicket.getCreatedBy().getId(),
                targetTicket.getCreatedBy().getName(),
                assignedToId,
                assignedToName
        );

        String currentUserRole = currentUser.getRole().getName();

        if (currentUserRole.equals("ADMIN")){
            return ticketResponseDTO;
        } else if (currentUserRole.equals("AGENT")) {
            if ((targetTicket.getAssignedTo() != null &&
                    targetTicket.getAssignedTo().getId().equals(currentUserId))
                    || targetTicket.getCreatedBy().getId().equals(currentUserId)) {

                return ticketResponseDTO;
            }
        }
        else {
            if (targetTicket.getCreatedBy().getId().equals(currentUserId)){
                return ticketResponseDTO;
            }
        }

        throw new ApiException("You are not allowed to access this ticket");
    }

    @Transactional
    public void assignTicket(Integer currentUserId, Integer ticketId, Integer agentId) {
        //Check if the user who accesses this endpoint is existed and his role is admin.
        Auth currentUser = authRepository.findAuthById(currentUserId);

        if (currentUser == null){
            throw new ApiException("Wrong current user id");
        }

        if (!currentUser.isActive() || currentUser.getRole() == null || !currentUser.getRole().getName().equals("ADMIN")) {
            throw new ApiException("You are not allowed to access this endpoint");
        }

        Ticket targetTicket = ticketRepository.findTicketById(ticketId);

        //check if the ticket exist.
        if (targetTicket == null){
            throw new ApiException("Ticket not found.");
        }

        Auth agent = authRepository.findAuthById(agentId);

        //check if agent account exist.
        if (agent == null){
            throw new ApiException("Agent not found");
        }

        //check if agent account is active.
        if (!agent.isActive()){
            throw new ApiException("Agent account is not active");
        }

        //check if the assign account role is agent.
        if (!agent.getRole().getName().equals("AGENT")){
            throw new ApiException("The selected user must have the AGENT role");
        }

        //check if the ticket is resolved or closed.
        if (targetTicket.getStatus().equals("RESOLVED") || targetTicket.getStatus().equals("CLOSED")){
            throw new ApiException("Can't assign resolved or closed ticket.");
        }

        //avoid assign the ticket to the same agent.
        if (targetTicket.getAssignedTo() != null && targetTicket.getAssignedTo().getId().equals(agentId)){
            throw new ApiException("You are trying to assign a ticket to the same old agent");
        }

        String oldAgentId = targetTicket.getAssignedTo() != null
                ? targetTicket.getAssignedTo().getId().toString()
                : "NONE";

        targetTicket.setAssignedTo(agent);

        ticketRepository.save(targetTicket);

        ticketActivityService.logActivity(targetTicket, currentUser, "ASSIGNED", oldAgentId, agentId.toString());
    }

    @Transactional
    public void advanceTicketStatus(Integer currentUserId, Integer ticketId) {
        // Check if the current user exists and is active.
        Auth currentUser = authRepository.findAuthById(currentUserId);

        if (currentUser == null){
            throw new ApiException("Wrong current user id");
        }

        //check if the account is active.
        if (!currentUser.isActive()) {
            throw new ApiException("You are not allowed to access this endpoint because your account is not active");
        }

        Ticket targetTicket = ticketRepository.findTicketById(ticketId);

        //check if the ticket exist.
        if (targetTicket == null){
            throw new ApiException("Ticket not found.");
        }

        String currentUserRole = currentUser.getRole().getName();

        //check if user role is agent or admin.
        if (!(currentUserRole.equals("AGENT") || currentUserRole.equals("ADMIN"))){
            throw new ApiException("To advance a ticket status your role must be AGENT or ADMIN");
        }

        //check if the agent is assign to this ticket.
        if (currentUserRole.equals("AGENT") && (targetTicket.getAssignedTo() == null || !targetTicket.getAssignedTo().getId().equals(currentUserId))) {
            throw new ApiException("You are not assigned to this ticket");
        }

        String oldTicketStatus = targetTicket.getStatus();

        String newTicketStatus;
        if (oldTicketStatus.equals("OPEN")){
            newTicketStatus = "IN_PROGRESS";
        } else if (oldTicketStatus.equals("IN_PROGRESS")) {
            newTicketStatus = "RESOLVED";
        } else if (oldTicketStatus.equals("RESOLVED")) {
            newTicketStatus = "CLOSED";
            targetTicket.setClosedAt(LocalDateTime.now());
            targetTicket.setClosedBy(currentUser);
        } else if (oldTicketStatus.equals("CLOSED")) {
            throw new ApiException("Closed tickets cannot be modified");
        } else {
            throw new ApiException("Invalid ticket status");
        }

        targetTicket.setStatus(newTicketStatus);

        ticketRepository.save(targetTicket);

        ticketActivityService.logActivity(targetTicket, currentUser,
                "STATUS", oldTicketStatus, newTicketStatus);
    }

    @Transactional
    public void updateTicketPriority(Integer currentUserId, Integer ticketId, String newPriority) {
        //Check if the user who accesses this endpoint is existed and his role is admin.
        Auth currentUser = authRepository.findAuthById(currentUserId);

        if (currentUser == null){
            throw new ApiException("Wrong current user id");
        }

        if (!currentUser.isActive() || currentUser.getRole() == null || !currentUser.getRole().getName().equals("ADMIN")) {
            throw new ApiException("You are not allowed to access this endpoint");
        }

        if (newPriority == null || !(newPriority.equals("LOW") || newPriority.equals("MEDIUM") || newPriority.equals("HIGH"))) {
            throw new ApiException("Priority must be LOW, MEDIUM or HIGH");
        }

        Ticket targetTicket = ticketRepository.findTicketById(ticketId);

        //check if the ticket exist.
        if (targetTicket == null){
            throw new ApiException("Ticket not found.");
        }

        //check if the ticket is resolved or closed.
        if (targetTicket.getStatus().equals("RESOLVED") || targetTicket.getStatus().equals("CLOSED")){
            throw new ApiException("Can't update resolved or closed ticket.");
        }

        String oldPriority = targetTicket.getPriority();

        //prevent changing the ticket priority to the same priority.
        if (oldPriority.equals(newPriority)){
            throw new ApiException("The priority is already " + newPriority);
        }

        targetTicket.setPriority(newPriority);

        ticketRepository.save(targetTicket);

        ticketActivityService.logActivity(targetTicket, currentUser, "PRIORITY", oldPriority, newPriority);
    }

    public List<TicketResponseDTO> getAssignedTickets(Integer currentUserId) {
        // Check if the current user exists and is active.
        Auth currentUser = authRepository.findAuthById(currentUserId);

        if (currentUser == null){
            throw new ApiException("Wrong current user id");
        }

        //check if the account is active.
        if (!currentUser.isActive()) {
            throw new ApiException("You are not allowed to access this endpoint because your account is not active");
        }

        String currentUserRole = currentUser.getRole().getName();

        if (!currentUserRole.equals("AGENT")){
            throw new ApiException("Your role must be agent to access this endpoint");
        }

        List<Ticket> tickets = ticketRepository.findAllByAssignedTo_Id(currentUserId);

        if (tickets.isEmpty()){
            throw new ApiException("The list is empty");
        }

        List<TicketResponseDTO> ticketResponseDTOS = new ArrayList<>();
        for (int i = 0; i < tickets.size(); i++){
            Ticket currentTicket = tickets.get(i);

            Integer assignedToId = currentTicket.getAssignedTo() != null
                    ? currentTicket.getAssignedTo().getId() : null;

            String assignedToName = currentTicket.getAssignedTo() != null
                    ? currentTicket.getAssignedTo().getName() : null;

            ticketResponseDTOS.add(new TicketResponseDTO(
                    currentTicket.getId(),
                    currentTicket.getTitle(),
                    currentTicket.getDescription(),
                    currentTicket.getPriority(),
                    currentTicket.getStatus(),
                    currentTicket.getCreatedAt(),
                    currentTicket.getCreatedBy().getId(),
                    currentTicket.getCreatedBy().getName(),
                    assignedToId,
                    assignedToName
            ));
        }

        return ticketResponseDTOS;
    }
}
