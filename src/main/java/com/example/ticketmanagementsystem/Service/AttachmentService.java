package com.example.ticketmanagementsystem.Service;

import com.example.ticketmanagementsystem.Api.ApiException;
import com.example.ticketmanagementsystem.DtoOut.AttachmentResponseDTO;
import com.example.ticketmanagementsystem.Model.Attachment;
import com.example.ticketmanagementsystem.Model.Auth;
import com.example.ticketmanagementsystem.Model.Ticket;
import com.example.ticketmanagementsystem.Repository.AttachmentRepository;
import com.example.ticketmanagementsystem.Repository.AuthRepository;
import com.example.ticketmanagementsystem.Repository.TicketRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
@AllArgsConstructor
public class AttachmentService {
    private final AttachmentRepository attachmentRepository;
    private final AuthRepository authRepository;
    private final TicketRepository ticketRepository;

    public void uploadAttachment(Integer currentUserId, Integer ticketId, MultipartFile file) {
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
            throw new ApiException("Can't add attachment to CLOSED ticket.");
        }

        // Check if the current user has permission to comment on this ticket.
        boolean isAdmin = currentUser.getRole().getName().equals("ADMIN");

        boolean isCreator = targetTicket.getCreatedBy().getId().equals(currentUserId);

        boolean isAssignedAgent = currentUser.getRole().getName().equals("AGENT")
                && targetTicket.getAssignedTo() != null
                && targetTicket.getAssignedTo().getId().equals(currentUserId);

        if (!isAdmin && !isCreator && !isAssignedAgent) {
            throw new ApiException("You are not allowed to add attachment to this ticket.");
        }

        // Check if the file is empty.
        if (file == null || file.isEmpty()) {
            throw new ApiException("File can't be empty");
        }

        // Check if file size exceeds 5MB.
        long maxFileSize = 5L * 1024 * 1024;

        if (file.getSize() > maxFileSize) {
            throw new ApiException("File size can't exceed 5MB");
        }

        // Check file type.
        String fileType = file.getContentType();

        if (fileType == null || !(fileType.equals("image/jpeg") ||
                fileType.equals("image/png") ||
                fileType.equals("application/pdf"))) {
            throw new ApiException("Only JPG, PNG and PDF files are allowed");
        }

        // Get the original file name.
        String originalFileName = file.getOriginalFilename();

        if (originalFileName == null || originalFileName.isBlank()) {
            throw new ApiException("Invalid file name");
        }

        if (originalFileName.length() > 255) {
            throw new ApiException("File name can't exceed 255 characters");
        }

        // Determine the extension from the allowed MIME type.
        String extension;

        switch (fileType) {
            case "image/jpeg":
                extension = ".jpg";
                break;
            case "image/png":
                extension = ".png";
                break;
            case "application/pdf":
                extension = ".pdf";
                break;
            default:
                throw new ApiException("Unsupported file type");
        }

        // Generate a unique file name.
        String uniqueFileName = UUID.randomUUID().toString() + extension;

        // Define the upload directory.
        Path uploadDirectory = Paths.get("uploads", "attachments");

        // Create the upload directory if it doesn't exist.
        try {
            Files.createDirectories(uploadDirectory);
        } catch (IOException e) {
            throw new ApiException("Failed to create upload directory");
        }

        // Define the full file path.
        Path filePath = uploadDirectory.resolve(uniqueFileName);

        // Read the file signature.
        byte[] header;

        try (var inputStream = file.getInputStream()) {
            header = inputStream.readNBytes(8);
        } catch (IOException e) {
            throw new ApiException("Failed to read attachment");
        }

        boolean validSignature = switch (fileType) {
            case "image/jpeg" -> header.length >= 3
                    && (header[0] & 0xFF) == 0xFF
                    && (header[1] & 0xFF) == 0xD8
                    && (header[2] & 0xFF) == 0xFF;

            case "image/png" -> header.length >= 8
                    && (header[0] & 0xFF) == 0x89
                    && header[1] == 0x50
                    && header[2] == 0x4E
                    && header[3] == 0x47
                    && header[4] == 0x0D
                    && header[5] == 0x0A
                    && header[6] == 0x1A
                    && header[7] == 0x0A;

            case "application/pdf" -> header.length >= 5
                    && header[0] == 0x25
                    && header[1] == 0x50
                    && header[2] == 0x44
                    && header[3] == 0x46
                    && header[4] == 0x2D;

            default -> false;
        };

        if (!validSignature) {
            throw new ApiException("File content does not match the allowed file type");
        }

        // Save the file and its information.
        try {
            try (var inputStream = file.getInputStream()) {
                Files.copy(inputStream, filePath);
            }

            Attachment newAttachment = new Attachment();

            newAttachment.setFileName(originalFileName);
            newAttachment.setFilePath(filePath.toString());
            newAttachment.setTicket(targetTicket);
            newAttachment.setUploadedBy(currentUser);

            attachmentRepository.saveAndFlush(newAttachment);

        } catch (Exception e) {

            try {
                Files.deleteIfExists(filePath);
            } catch (IOException cleanupException) {
                e.addSuppressed(cleanupException);
            }

            throw new ApiException("Failed to save attachment");
        }
    }

    public List<AttachmentResponseDTO> getTicketAttachments(Integer currentUserId, Integer ticketId) {
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
            throw new ApiException("You are not allowed to see this ticket attachment.");
        }

        List<Attachment> attachments = attachmentRepository.findAllByTicket_Id(ticketId);

        if (attachments.isEmpty()){
            throw new ApiException("The list is empty.");
        }

        List<AttachmentResponseDTO> attachmentResponseDTOS = new ArrayList<>();

        for (int i = 0; i < attachments.size(); i++){
            Attachment currentAttachment = attachments.get(i);
            attachmentResponseDTOS.add(new AttachmentResponseDTO(
                    currentAttachment.getId(),
                    currentAttachment.getFileName(),
                    currentAttachment.getUploadedBy().getId(),
                    currentAttachment.getUploadedBy().getName(),
                    currentAttachment.getCreatedAt()
            ));
        }

        return attachmentResponseDTOS;
    }

    public AttachmentResponseDTO getAttachmentById(Integer currentUserId, Integer attachmentId) {
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

        Attachment targetAttachment = attachmentRepository.findAttachmentById(attachmentId);

        if (targetAttachment == null){
            throw new ApiException("Attachment not found");
        }

        Ticket targetTicket = targetAttachment.getTicket();

        // Check if the current user has permission to comment on this ticket.
        boolean isAdmin = currentUser.getRole().getName().equals("ADMIN");

        boolean isCreator = targetTicket.getCreatedBy().getId().equals(currentUserId);

        boolean isAssignedAgent = currentUser.getRole().getName().equals("AGENT")
                && targetTicket.getAssignedTo() != null
                && targetTicket.getAssignedTo().getId().equals(currentUserId);

        if (!isAdmin && !isCreator && !isAssignedAgent) {
            throw new ApiException("You are not allowed to see this ticket attachment.");
        }

        return new AttachmentResponseDTO(targetAttachment.getId(),
                targetAttachment.getFileName(),
                targetAttachment.getUploadedBy().getId(),
                targetAttachment.getUploadedBy().getName(),
                targetAttachment.getCreatedAt());
    }

    public Resource downloadAttachment(Integer currentUserId, Integer attachmentId) {
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

        Attachment targetAttachment = attachmentRepository.findAttachmentById(attachmentId);

        if (targetAttachment == null){
            throw new ApiException("Attachment not found");
        }

        Ticket targetTicket = targetAttachment.getTicket();

        // Check if the current user has permission to comment on this ticket.
        boolean isAdmin = currentUser.getRole().getName().equals("ADMIN");

        boolean isCreator = targetTicket.getCreatedBy().getId().equals(currentUserId);

        boolean isAssignedAgent = currentUser.getRole().getName().equals("AGENT")
                && targetTicket.getAssignedTo() != null
                && targetTicket.getAssignedTo().getId().equals(currentUserId);

        if (!isAdmin && !isCreator && !isAssignedAgent) {
            throw new ApiException("You are not allowed to see this ticket attachment.");
        }

        try {
            Path uploadDirectory = Paths.get("uploads", "attachments")
                    .toRealPath();

            Path filePath = Paths.get(targetAttachment.getFilePath())
                    .toRealPath();

            if (!filePath.startsWith(uploadDirectory)) {
                throw new ApiException("Invalid attachment path");
            }

            if (!Files.isRegularFile(filePath) || !Files.isReadable(filePath)) {
                throw new ApiException("Attachment file not found or not readable");
            }

            return new UrlResource(filePath.toUri());

        } catch (IOException e) {
            throw new ApiException("Attachment file not found or not readable");
        }
    }
}
