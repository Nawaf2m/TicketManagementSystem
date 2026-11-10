package com.example.ticketmanagementsystem.Service;

import com.example.ticketmanagementsystem.Api.ApiException;
import com.example.ticketmanagementsystem.DtoIn.CreateCommentDTO;
import com.example.ticketmanagementsystem.DtoOut.CommentResponseDTO;
import com.example.ticketmanagementsystem.Model.Auth;
import com.example.ticketmanagementsystem.Model.Comment;
import com.example.ticketmanagementsystem.Model.Ticket;
import com.example.ticketmanagementsystem.Repository.AuthRepository;
import com.example.ticketmanagementsystem.Repository.CommentRepository;
import com.example.ticketmanagementsystem.Repository.TicketActivityRepository;
import com.example.ticketmanagementsystem.Repository.TicketRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@AllArgsConstructor
public class CommentService {
    private final CommentRepository commentRepository;
    private final AuthRepository authRepository;
    private final TicketRepository ticketRepository;

    public void addComment(Integer currentUserId, Integer ticketId, CreateCommentDTO commentDTO) {
        // Check if the current user exists and is active.
        Auth currentUser = authRepository.findAuthById(currentUserId);

        //Check if user exist.
        if (currentUser == null){
            throw new ApiException("Wrong current user id");
        }

        //Check if user account is active.
        if (!currentUser.isActive()) {
            throw new ApiException("You are not allowed to access this endpoint because your account is not active");
        }

        Ticket targetTicket = ticketRepository.findTicketById(ticketId);

        //Check if the ticket exist.
        if (targetTicket == null){
            throw new ApiException("Ticket not found.");
        }

        //Prevent adding a comment to closed ticket.
        if (targetTicket.getStatus().equals("CLOSED")){
            throw new ApiException("Can't add comment to CLOSED ticket.");
        }

        // Check if the current user has permission to comment on this ticket.
        boolean isAdmin = currentUser.getRole().getName().equals("ADMIN");

        boolean isCreator = targetTicket.getCreatedBy().getId().equals(currentUserId);

        boolean isAssignedAgent = currentUser.getRole().getName().equals("AGENT")
                && targetTicket.getAssignedTo() != null
                && targetTicket.getAssignedTo().getId().equals(currentUserId);

        if (!isAdmin && !isCreator && !isAssignedAgent) {
            throw new ApiException("You are not allowed to add comment to this ticket.");
        }

        Comment newComment = new Comment();

        newComment.setComment(commentDTO.getComment());
        newComment.setTicket(targetTicket);
        newComment.setUser(currentUser);

        commentRepository.save(newComment);
    }

    public List<CommentResponseDTO> getTicketComments(Integer currentUserId, Integer ticketId) {
        // Check if the current user exists and is active.
        Auth currentUser = authRepository.findAuthById(currentUserId);

        //Check if user exist.
        if (currentUser == null){
            throw new ApiException("Wrong current user id");
        }

        //Check if user account is active.
        if (!currentUser.isActive()) {
            throw new ApiException("You are not allowed to access this endpoint because your account is not active");
        }

        Ticket targetTicket = ticketRepository.findTicketById(ticketId);

        //Check if the ticket exist.
        if (targetTicket == null){
            throw new ApiException("Ticket not found.");
        }

        // Check if the current user has permission to comment on this ticket.
        boolean isAdmin = currentUser.getRole().getName().equals("ADMIN");

        boolean isCreator = targetTicket.getCreatedBy().getId().equals(currentUserId);

        boolean isAssignedAgent = currentUser.getRole().getName().equals("AGENT")
                && targetTicket.getAssignedTo() != null
                && targetTicket.getAssignedTo().getId().equals(currentUserId);

        if (!isAdmin && !isCreator && !isAssignedAgent) {
            throw new ApiException("You are not allowed to see this ticket comments.");
        }

        List<Comment> commentList = commentRepository.findAllByTicket_IdOrderByCreatedAtAsc(ticketId);

        if (commentList.isEmpty()){
            throw new ApiException("The list is empty.");
        }

        List<CommentResponseDTO> commentResponseDTOS = new ArrayList<>();
        for (int i = 0; i < commentList.size(); i++){
            Comment currentComment = commentList.get(i);

            commentResponseDTOS.add(new CommentResponseDTO(currentComment.getId(),
                    currentComment.getUser().getId(), currentComment.getUser().getName(),
                    currentComment.getComment(), currentComment.getCreatedAt()));
        }

        return commentResponseDTOS;
    }

    public CommentResponseDTO getCommentById(Integer currentUserId, Integer commentId) {
        // Check if the current user exists and is active.
        Auth currentUser = authRepository.findAuthById(currentUserId);

        //Check if user exist.
        if (currentUser == null){
            throw new ApiException("Wrong current user id");
        }

        //Check if user account is active.
        if (!currentUser.isActive()) {
            throw new ApiException("You are not allowed to access this endpoint because your account is not active");
        }

        Comment targetComment = commentRepository.findCommentById(commentId);

        if (targetComment == null){
            throw new ApiException("Comment not found.");
        }

        Integer ticketId = targetComment.getTicket().getId();

        Ticket targetTicket = ticketRepository.findTicketById(ticketId);

        //Check if the ticket exist.
        if (targetTicket == null){
            throw new ApiException("Ticket not found.");
        }

        // Check if the current user has permission to comment on this ticket.
        boolean isAdmin = currentUser.getRole().getName().equals("ADMIN");

        boolean isCreator = targetTicket.getCreatedBy().getId().equals(currentUserId);

        boolean isAssignedAgent = currentUser.getRole().getName().equals("AGENT")
                && targetTicket.getAssignedTo() != null
                && targetTicket.getAssignedTo().getId().equals(currentUserId);

        if (!isAdmin && !isCreator && !isAssignedAgent) {
            throw new ApiException("You are not allowed to see this ticket comments.");
        }

        return new CommentResponseDTO(commentId, targetComment.getUser().getId(),
                targetComment.getUser().getName(), targetComment.getComment(),
                targetComment.getCreatedAt());
    }
}
