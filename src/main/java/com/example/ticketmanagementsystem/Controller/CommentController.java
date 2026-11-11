package com.example.ticketmanagementsystem.Controller;

import com.example.ticketmanagementsystem.Api.ApiResponse;
import com.example.ticketmanagementsystem.DtoIn.CreateCommentDTO;
import com.example.ticketmanagementsystem.Model.User;
import com.example.ticketmanagementsystem.Service.CommentService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/comment")
@AllArgsConstructor
public class CommentController {
    private final CommentService commentService;

    @PostMapping("/add/{ticketId}")
    public ResponseEntity<?> addComment(@AuthenticationPrincipal User user, @PathVariable Integer ticketId, @RequestBody @Valid CreateCommentDTO commentDTO){
        commentService.addComment(user.getId(), ticketId, commentDTO);
        return ResponseEntity.status(200).body(new ApiResponse("Comment added successfully"));
    }

    @GetMapping("/get-ticket-comments/{ticketId}")
    public ResponseEntity<?> getTicketComments(@AuthenticationPrincipal User user, @PathVariable Integer ticketId){
        return ResponseEntity.status(200).body(commentService.getTicketComments(user.getId(), ticketId));
    }

    @GetMapping("/get-comment-by-id/{commentId}")
    public ResponseEntity<?> getCommentById(@AuthenticationPrincipal User user, @PathVariable Integer commentId){
        return ResponseEntity.status(200).body(commentService.getCommentById(user.getId(), commentId));
    }
}
