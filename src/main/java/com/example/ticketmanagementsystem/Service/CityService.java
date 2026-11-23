package com.example.ticketmanagementsystem.Service;

import com.example.ticketmanagementsystem.Api.ApiException;
import com.example.ticketmanagementsystem.DtoIn.UpdateCityNameDTO;
import com.example.ticketmanagementsystem.DtoOut.CityResponseDTO;
import com.example.ticketmanagementsystem.Model.City;
import com.example.ticketmanagementsystem.Repository.CityRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@AllArgsConstructor
public class CityService {
    private final CityRepository cityRepository;

    public List<CityResponseDTO> getAllCities(){
        List<City> cities = cityRepository.findAll();

        if (cities.isEmpty()){
            throw new ApiException("The list is empty.");
        }

        List<CityResponseDTO> cityResponseDTOS = new ArrayList<>();
        for (int i = 0; i < cities.size(); i++){
            City city = cities.get(i);
            cityResponseDTOS.add(new CityResponseDTO(city.getId(), city.getName()));
        }

        return cityResponseDTOS;
    }

    public void addCity(City newCity){
        City oldCity = cityRepository.findCityByName(newCity.getName());

        if (oldCity != null){
            throw new ApiException("City name already have been used.");
        }

        oldCity = new City();

        oldCity.setName(newCity.getName());

        cityRepository.save(oldCity);
    }

    public CityResponseDTO getCityById(Integer id){
        City targetCity = cityRepository.findCityById(id);

        if (targetCity == null){
            throw new ApiException("City not found");
        }

        return new CityResponseDTO(targetCity.getId(), targetCity.getName());
    }

    public void updateCityName(Integer id, UpdateCityNameDTO updateCityNameDTO){
        City targetCity = cityRepository.findCityById(id);

        if (targetCity == null){
            throw new ApiException("City not found");
        }

        String newName = updateCityNameDTO.getName();

        if (targetCity.getName().equals(newName)){
            throw new ApiException("You entered the same old name");
        }

        if (cityRepository.existsByName(newName)){
            throw new ApiException("City name already been used");
        }

        targetCity.setName(newName);

        cityRepository.save(targetCity);
    }

    public void deleteCity(Integer id){
        City targetCity = cityRepository.findCityById(id);

        if (targetCity == null){
            throw new ApiException("City not found");
        }

        if (!targetCity.getMerchants().isEmpty()){
            throw new ApiException("Can't delete city with merchants conect to it");
        }

        cityRepository.delete(targetCity);
    }
}
