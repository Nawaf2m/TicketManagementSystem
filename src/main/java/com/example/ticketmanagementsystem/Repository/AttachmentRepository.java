package com.example.ticketmanagementsystem.Repository;

import com.example.ticketmanagementsystem.Model.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, Integer> {
    Attachment findAttachmentById(Integer id);

    List<Attachment> findAllByTicket_Id(Integer ticketId);
}
