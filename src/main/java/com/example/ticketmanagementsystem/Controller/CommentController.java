package com.example.ticketmanagementsystem.Controller;

import com.example.ticketmanagementsystem.Api.ApiResponse;
import com.example.ticketmanagementsystem.DtoIn.CreateCommentDTO;
import com.example.ticketmanagementsystem.Service.CommentService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/comment")
@AllArgsConstructor
public class CommentController {
    private final CommentService commentService;

    @PostMapping("/add/{currentUserId}/{ticketId}")
    public ResponseEntity<?> addComment(@PathVariable Integer currentUserId, @PathVariable Integer ticketId, @RequestBody @Valid CreateCommentDTO commentDTO){
        commentService.addComment(currentUserId, ticketId, commentDTO);
        return ResponseEntity.status(200).body(new ApiResponse("Comment added successfully"));
    }

    @GetMapping("/get-ticket-comments/{currentUserId}/{ticketId}")
    public ResponseEntity<?> getTicketComments(@PathVariable Integer currentUserId, @PathVariable Integer ticketId){
        return ResponseEntity.status(200).body(commentService.getTicketComments(currentUserId, ticketId));
    }

    @GetMapping("/get-comment-by-id/{currentUserId}/{commentId}")
    public ResponseEntity<?> getCommentById(@PathVariable Integer currentUserId, @PathVariable Integer commentId){
        return ResponseEntity.status(200).body(commentService.getCommentById(currentUserId, commentId));
    }
}
