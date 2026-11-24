package com.example.ticketmanagementsystem.Service;

import com.example.ticketmanagementsystem.Api.ApiException;
import com.example.ticketmanagementsystem.DtoOut.TerminalResponseDTO;
import com.example.ticketmanagementsystem.Model.Bank;
import com.example.ticketmanagementsystem.Model.Terminal;
import com.example.ticketmanagementsystem.Repository.BankRepository;
import com.example.ticketmanagementsystem.Repository.TerminalRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@AllArgsConstructor
public class TerminalService {
    private final TerminalRepository terminalRepository;
    private final BankRepository bankRepository;


    public List<TerminalResponseDTO> getAllTerminals(){
        return createTerminalResponseDTOList(terminalRepository.findAll());
    }


    @Transactional
    public void createTerminals(Integer bankId, Integer quantity){
        Bank bank = bankRepository.findBankById(bankId);

        if (bank == null){
            throw new ApiException("Bank not found");
        }

        if (bank.getLastTerminalSequence() + quantity > 99999){
            throw new ApiException("Bank can't have more than 99999 terminals");
        }

        if (quantity < 1 || quantity > 1000){
            throw new ApiException("Quantity should be between 1 and 1000");
        }

        Integer lastTerminalSequence = bank.getLastTerminalSequence() + 1;

        String  bankCode = bank.getCode();
        for (int i = 0; i < quantity; i++){
            Terminal terminal = new Terminal();
            terminal.setBank(bank);
            terminal.setStatus("NEW");
            terminal.setTerminalNumber(createTerminalNumber(bankCode, lastTerminalSequence));
            terminalRepository.save(terminal);
            lastTerminalSequence++;
        }

        bank.setLastTerminalSequence(lastTerminalSequence - 1);
        bankRepository.save(bank);
    }

    public TerminalResponseDTO getTerminalById(Integer id){
        Terminal targetTerminal = terminalRepository.findTerminalById(id);

        if (targetTerminal == null){
            throw new ApiException("Terminal not found");
        }

        return createTerminalResponseDTO(targetTerminal);
    }

    public TerminalResponseDTO getTerminalByTerminalNumber(String terminalNumber){
        Terminal targetTerminal = terminalRepository.findTerminalByTerminalNumber(terminalNumber);

        if (targetTerminal == null){
            throw new ApiException("Terminal not found");
        }

        return createTerminalResponseDTO(targetTerminal);
    }

    public List<TerminalResponseDTO> getTerminalsByBank(Integer bankId){
        Bank targetBank = bankRepository.findBankById(bankId);

        if (targetBank == null){
            throw new ApiException("Bank not found");
        }

        return createTerminalResponseDTOList(terminalRepository.findTerminalsByBank(targetBank));
    }

    public List<TerminalResponseDTO> getTerminalsByStatus(String status){
        if (!status.equals("NEW") && !status.equals("PROCESSING") && !status.equals("INSTALLED") && !status.equals("PULLED_OUT") && !status.equals("BROKEN")){
            throw new ApiException("Wrong status");
        }

        return createTerminalResponseDTOList(terminalRepository.findTerminalsByStatus(status));
    }

    public TerminalResponseDTO getTerminalByFullTerminalNumber(String fullTerminalNumber){
        Terminal targetTerminal = terminalRepository.findTerminalByFullTerminalNumber(fullTerminalNumber);

        if (targetTerminal == null){
            throw new ApiException("Terminal not found");
        }

        return createTerminalResponseDTO(targetTerminal);
    }

    public void deleteTerminal(Integer id){
        Terminal targetTerminal = terminalRepository.findTerminalById(id);

        if (targetTerminal == null){
            throw new ApiException("Terminal not found");
        }

        if (!targetTerminal.getStatus().equals("NEW")){
            throw new ApiException("Can only delete terminal with new status");
        }

        if (!targetTerminal.getTickets().isEmpty()){
            throw new ApiException("Can only delete terminal with no tickets list");
        }

        terminalRepository.delete(targetTerminal);
    }

    private String createTerminalNumber(String  bankCode, Integer lastTerminalSequence){
        if (lastTerminalSequence < 10){
            return "21" + bankCode + "0000" + lastTerminalSequence;
        } else if (lastTerminalSequence < 100) {
            return "21" + bankCode + "000" + lastTerminalSequence;
        } else if (lastTerminalSequence < 1000) {
            return "21" + bankCode + "00" + lastTerminalSequence;
        } else if (lastTerminalSequence < 10000) {
            return "21" + bankCode + "0" + lastTerminalSequence;
        }
        else {
            return "21" + bankCode + lastTerminalSequence;
        }
    }

    private List<TerminalResponseDTO> createTerminalResponseDTOList(List<Terminal> terminals){
        if (terminals.isEmpty()){
            throw new ApiException("The list is empty");
        }

        List<TerminalResponseDTO> terminalResponseDTOS = new ArrayList<>();

        for (int i = 0; i < terminals.size(); i++){
            Terminal currentTerminal = terminals.get(i);

            terminalResponseDTOS.add(createTerminalResponseDTO(currentTerminal));
        }

        return terminalResponseDTOS;
    }

    private TerminalResponseDTO createTerminalResponseDTO(Terminal terminal){
        return new TerminalResponseDTO(
                terminal.getId(),
                terminal.getTerminalNumber(),
                terminal.getFullTerminalNumber(),
                terminal.getStatus(),
                terminal.getBank().getName(),

                terminal.getMerchant() != null ? terminal.getMerchant().getName() : null,

                terminal.getDevice() != null ? terminal.getDevice().getModel() : null,
                terminal.getDevice() != null ? terminal.getDevice().getSerialNumber() : null,

                terminal.getSimCard() != null ? terminal.getSimCard().getModel() : null,
                terminal.getSimCard() != null ? terminal.getSimCard().getSerialNumber() : null
        );
    }
}
