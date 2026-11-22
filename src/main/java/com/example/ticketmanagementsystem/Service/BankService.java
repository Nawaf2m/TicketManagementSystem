package com.example.ticketmanagementsystem.Service;

import com.example.ticketmanagementsystem.Api.ApiException;
import com.example.ticketmanagementsystem.DtoIn.BankDTOIn;
import com.example.ticketmanagementsystem.DtoIn.UpdateBankNameDTO;
import com.example.ticketmanagementsystem.DtoOut.BankDTOOut;
import com.example.ticketmanagementsystem.Model.Bank;
import com.example.ticketmanagementsystem.Repository.BankRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@AllArgsConstructor
public class BankService {
    private final BankRepository bankRepository;

    public List<BankDTOOut> getAllBanks(){
        List<Bank> banks = bankRepository.findAll();

        if (banks.isEmpty()){
            throw new ApiException("The list is empty.");
        }

        List<BankDTOOut> bankDTOOuts = new ArrayList<>();

        for (int i = 0; i < banks.size(); i++){
            Bank bank = banks.get(i);

            bankDTOOuts.add(new BankDTOOut(bank.getId(), bank.getName(), bank.getCode()));
        }

        return bankDTOOuts;
    }

    public void addBank(BankDTOIn newBank){
        if (bankRepository.existsByName(newBank.getName())){
            throw new ApiException("Bank name already been used.");
        }

        if (bankRepository.existsByCode(newBank.getCode())){
            throw new ApiException("Bank code already been used.");
        }

        Bank bank = new Bank();

        bank.setName(newBank.getName());
        bank.setCode(newBank.getCode());

        bankRepository.save(bank);
    }

    public BankDTOOut getBankById(Integer id){
        Bank bank = bankRepository.findBankById(id);

        if (bank == null){
            throw new ApiException("Bank not found");
        }

        return new BankDTOOut(bank.getId(),bank.getName(),bank.getCode());
    }

    public void updateName(Integer id, UpdateBankNameDTO updateBankNameDTO){
        Bank bank = bankRepository.findBankById(id);

        if (bank == null){
            throw new ApiException("Bank not found");
        }

        String newName = updateBankNameDTO.getName();

        if (bank.getName().equals(newName)){
            throw new ApiException("You entered the same old name");
        }

        Bank oldBank = bankRepository.findBankByName(newName);

        if (oldBank != null){
            throw new ApiException("Bank name already been used.");
        }

        bank.setName(newName);

        bankRepository.save(bank);
    }

    public void deleteBank(Integer id){
        Bank bank = bankRepository.findBankById(id);

        if (bank == null){
            throw new ApiException("Bank not found");
        }

        bankRepository.delete(bank);
    }
}
