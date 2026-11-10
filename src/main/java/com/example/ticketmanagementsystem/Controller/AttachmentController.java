package com.example.ticketmanagementsystem.Controller;

import com.example.ticketmanagementsystem.Api.ApiResponse;
import com.example.ticketmanagementsystem.Repository.AttachmentRepository;
import com.example.ticketmanagementsystem.Service.AttachmentService;
import lombok.AllArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/v1/attachment")
@AllArgsConstructor
public class AttachmentController {
    private final AttachmentService attachmentService;
    private final AttachmentRepository attachmentRepository;

    @PostMapping(value = "/upload/{currentUserId}/{ticketId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadAttachment(@PathVariable Integer currentUserId, @PathVariable Integer ticketId, @RequestParam("file") MultipartFile file){
        attachmentService.uploadAttachment(currentUserId, ticketId, file);
        return ResponseEntity.status(201).body(new ApiResponse("Attachment uploaded successfully"));
    }

    @GetMapping("/get-ticket-attachments/{currentUserId}/{ticketId}")
    public ResponseEntity<?> getTicketAttachments(@PathVariable Integer currentUserId, @PathVariable Integer ticketId){
        return ResponseEntity.status(200).body(attachmentService.getTicketAttachments(currentUserId, ticketId));
    }

    @GetMapping("/get-attachment-by-id/{currentUserId}/{attachmentId}")
    public ResponseEntity<?> getAttachmentById(@PathVariable Integer currentUserId, @PathVariable Integer attachmentId){
        return ResponseEntity.status(200).body(attachmentService.getAttachmentById(currentUserId, attachmentId));
    }

    @GetMapping("/download/{currentUserId}/{attachmentId}")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable Integer currentUserId,
                                                       @PathVariable Integer attachmentId) {

        Resource resource = attachmentService.downloadAttachment(currentUserId, attachmentId);

        String fileName = attachmentRepository.findAttachmentById(attachmentId).getFileName();

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(fileName)
                                .build().toString())
                .body(resource);
    }
}
