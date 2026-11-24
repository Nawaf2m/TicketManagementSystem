
package com.example.ticketmanagementsystem.Service;

import com.example.ticketmanagementsystem.Api.ApiException;
import com.example.ticketmanagementsystem.DtoIn.SimCardDTO;
import com.example.ticketmanagementsystem.DtoOut.SimCardResponseDTO;
import com.example.ticketmanagementsystem.Model.SimCard;
import com.example.ticketmanagementsystem.Repository.SimCardRepository;
import com.example.ticketmanagementsystem.Repository.TerminalRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@AllArgsConstructor
public class SimCardService {

    private final SimCardRepository simCardRepository;
    private final TerminalRepository terminalRepository;

    public void addSimCard(SimCardDTO newSimCard){
        if (simCardRepository.existsBySerialNumber(newSimCard.getSerialNumber())){
            throw new ApiException("SimCard serial number already exists");
        }

        SimCard simCard = new SimCard();
        simCard.setModel(newSimCard.getModel());
        simCard.setSerialNumber(newSimCard.getSerialNumber());

        simCardRepository.save(simCard);
    }

    public List<SimCardResponseDTO> getAllSimCards(){
        List<SimCard> simCards = simCardRepository.findAll();

        if (simCards.isEmpty()){
            throw new ApiException("The list is empty");
        }

        List<SimCardResponseDTO> simCardResponseDTOS = new ArrayList<>();

        for (int i = 0; i < simCards.size(); i++){
            SimCard currentSimCard = simCards.get(i);
            simCardResponseDTOS.add(createSimCardResponseDTO(currentSimCard));
        }

        return simCardResponseDTOS;
    }

    public SimCardResponseDTO getSimCardById(Integer id){
        SimCard targetSimCard = simCardRepository.findSimCardById(id);

        if (targetSimCard == null){
            throw new ApiException("SimCard not found");
        }

        return createSimCardResponseDTO(targetSimCard);
    }

    public SimCardResponseDTO getSimCardBySerialNumber(String serialNumber){
        SimCard targetSimCard = simCardRepository.findSimCardBySerialNumber(serialNumber);

        if (targetSimCard == null){
            throw new ApiException("SimCard not found");
        }

        return createSimCardResponseDTO(targetSimCard);
    }

    public void updateSimCard(Integer id, SimCardDTO updateSimCardDTO){
        SimCard targetSimCard = simCardRepository.findSimCardById(id);

        if (targetSimCard == null){
            throw new ApiException("SimCard not found");
        }

        String newModel = updateSimCardDTO.getModel();
        String newSerialNumber = updateSimCardDTO.getSerialNumber();

        if (targetSimCard.getModel().equals(newModel) &&
                targetSimCard.getSerialNumber().equals(newSerialNumber)){
            throw new ApiException("You entered the same old data");
        }

        if (!targetSimCard.getSerialNumber().equals(newSerialNumber)){
            if (simCardRepository.existsBySerialNumber(newSerialNumber)){
                throw new ApiException("SimCard serial number already been used");
            }
        }

        targetSimCard.setModel(newModel);
        targetSimCard.setSerialNumber(newSerialNumber);

        simCardRepository.save(targetSimCard);
    }

    public void deleteSimCard(Integer id){
        SimCard targetSimCard = simCardRepository.findSimCardById(id);

        if (targetSimCard == null){
            throw new ApiException("SimCard not found");
        }

        if (terminalRepository.existsBySimCard_Id(id)){
            throw new ApiException("Can't delete SimCard connected with terminal");
        }

        simCardRepository.delete(targetSimCard);
    }

    private SimCardResponseDTO createSimCardResponseDTO(SimCard simCard){
        return new SimCardResponseDTO(
                simCard.getId(),
                simCard.getModel(),
                simCard.getSerialNumber()
        );
    }
}
