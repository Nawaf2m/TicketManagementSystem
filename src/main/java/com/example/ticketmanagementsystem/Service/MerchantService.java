package com.example.ticketmanagementsystem.Service;

import com.example.ticketmanagementsystem.Api.ApiException;
import com.example.ticketmanagementsystem.DtoIn.MerchantDTO;
import com.example.ticketmanagementsystem.DtoIn.UpdateCityNameDTO;
import com.example.ticketmanagementsystem.DtoIn.UpdateMerchantNameDTO;
import com.example.ticketmanagementsystem.DtoOut.CityResponseDTO;
import com.example.ticketmanagementsystem.DtoOut.MerchantResponseDTO;
import com.example.ticketmanagementsystem.Model.City;
import com.example.ticketmanagementsystem.Model.Merchant;
import com.example.ticketmanagementsystem.Repository.CityRepository;
import com.example.ticketmanagementsystem.Repository.MerchantRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@AllArgsConstructor
public class MerchantService {
    private final MerchantRepository merchantRepository;
    private final CityRepository cityRepository;

    public List<MerchantResponseDTO> getAllMerchants(){
        List<Merchant> merchants = merchantRepository.findAll();

        if (merchants.isEmpty()){
            throw new ApiException("The list is empty");
        }

        List<MerchantResponseDTO> merchantResponseDTOS = new ArrayList<>();
        for (int i = 0; i < merchants.size(); i++){
            Merchant currentMerchant = merchants.get(i);
            List<City> currentMerchantCities = currentMerchant.getCities();
            List<CityResponseDTO> cityResponseDTOS = new ArrayList<>();
            for (int j = 0; j < currentMerchantCities.size(); j++){
                cityResponseDTOS.add(new CityResponseDTO(currentMerchantCities.get(j).getId(), currentMerchantCities.get(j).getName()));
            }
            merchantResponseDTOS.add(new MerchantResponseDTO(currentMerchant.getId(), currentMerchant.getName(), cityResponseDTOS));
        }

        return merchantResponseDTOS;
    }

    public void addMerchant(MerchantDTO newMerchant){
        Merchant oldMerchant = merchantRepository.findMerchantByName(newMerchant.getName());

        if (oldMerchant != null){
            throw new ApiException("Merchant name already exist");
        }

        List<Integer> merchantCitiesIds = newMerchant.getCityIds();

        if (merchantCitiesIds.isEmpty()){
            throw new ApiException("You should chose at least one city");
        }

        for (int i = 0; i < merchantCitiesIds.size(); i++){
            Integer currentCityId = merchantCitiesIds.get(i);
            for (int j = 0; j < merchantCitiesIds.size(); j++){
                if (i == j){
                    continue;
                }
                if (currentCityId.equals(merchantCitiesIds.get(j))){
                    throw new ApiException("There is duplicates cities");
                }
            }
        }

        City currentCity;
        List<City> cities = new ArrayList<>();
        for (int i = 0; i < merchantCitiesIds.size(); i++){
            currentCity = cityRepository.findCityById(merchantCitiesIds.get(i));
            if (currentCity == null){
                throw new ApiException("Wrong city id");
            }
            cities.add(currentCity);
        }

        oldMerchant = new Merchant();
        oldMerchant.setName(newMerchant.getName());
        oldMerchant.setCities(cities);
        merchantRepository.save(oldMerchant);
    }

    public MerchantResponseDTO getMerchantById(Integer id){
        Merchant targetMerchant = merchantRepository.findMerchantById(id);

        if (targetMerchant == null){
            throw new ApiException("Merchant not found");
        }

        List<CityResponseDTO> cityResponseDTOS = new ArrayList<>();
        List<City> merchantCities = targetMerchant.getCities();
        for (int j = 0; j < merchantCities.size(); j++){
            cityResponseDTOS.add(new CityResponseDTO(merchantCities.get(j).getId(), merchantCities.get(j).getName()));
        }

        return new MerchantResponseDTO(targetMerchant.getId(),
                targetMerchant.getName(),
                cityResponseDTOS);
    }

    public void updateMerchantName(Integer id, UpdateMerchantNameDTO updateMerchantNameDTO){
        Merchant targetMerchant = merchantRepository.findMerchantById(id);

        if (targetMerchant == null){
            throw new ApiException("Merchant not found");
        }

        String newName = updateMerchantNameDTO.getName();

        if (targetMerchant.getName().equals(newName)){
            throw new ApiException("You entered the same old name");
        }

        if (merchantRepository.existsByName(newName)){
            throw new ApiException("Merchant name already been used");
        }

        targetMerchant.setName(newName);

        merchantRepository.save(targetMerchant);
    }

    public void addCityToMerchant(Integer merchantId, Integer cityId){
        Merchant targetMerchant = merchantRepository.findMerchantById(merchantId);

        if (targetMerchant == null){
            throw new ApiException("Merchant not found");
        }

        City targetCity = cityRepository.findCityById(cityId);

        if (targetCity == null){
            throw new ApiException("City not found");
        }

        if (targetMerchant.getCities().contains(targetCity)){
            throw new ApiException("City already connect with merchant");
        }

        targetMerchant.getCities().add(targetCity);

        merchantRepository.save(targetMerchant);
    }

    public void removeCityFromMerchant(Integer merchantId, Integer cityId){
        Merchant targetMerchant = merchantRepository.findMerchantById(merchantId);

        if (targetMerchant == null){
            throw new ApiException("Merchant not found");
        }

        City targetCity = cityRepository.findCityById(cityId);

        if (targetCity == null){
            throw new ApiException("City not found");
        }

        if (!targetMerchant.getCities().contains(targetCity)){
            throw new ApiException("City is not connect with this merchant");
        }

        if (targetMerchant.getCities().size() == 1){
            throw new ApiException("Can't remove the last connected city");
        }

        targetMerchant.getCities().remove(targetCity);

        merchantRepository.save(targetMerchant);
    }

    @Transactional
    public void deleteMerchant(Integer id){
        Merchant targetMerchant = merchantRepository.findMerchantById(id);

        if (targetMerchant == null){
            throw new ApiException("Merchant not found");
        }

        if (!targetMerchant.getTerminals().isEmpty()){
            throw new ApiException("Can't delete merchant connected with terminals");
        }

        targetMerchant.getCities().clear();

        merchantRepository.delete(targetMerchant);
    }
}
