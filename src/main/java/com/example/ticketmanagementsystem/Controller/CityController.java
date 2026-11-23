
package com.example.ticketmanagementsystem.Controller;

import com.example.ticketmanagementsystem.Api.ApiResponse;
import com.example.ticketmanagementsystem.DtoIn.UpdateCityNameDTO;
import com.example.ticketmanagementsystem.Model.City;
import com.example.ticketmanagementsystem.Service.CityService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/city")
@AllArgsConstructor
public class CityController {
    private final CityService cityService;

    @PreAuthorize("hasAuthority('CITY_VIEW')")
    @GetMapping("/get")
    public ResponseEntity<?> get(){
        return ResponseEntity.status(200).body(cityService.getAllCities());
    }

    @PreAuthorize("hasAuthority('CITY_CREATE')")
    @PostMapping("/add")
    public ResponseEntity<?> add(@RequestBody @Valid City city){
        cityService.addCity(city);
        return ResponseEntity.status(200).body(new ApiResponse("City added successfully"));
    }

    @PreAuthorize("hasAuthority('CITY_VIEW')")
    @GetMapping("/get-city-by-id/{id}")
    public ResponseEntity<?> getCityById(@PathVariable Integer id){
        return ResponseEntity.status(200).body(cityService.getCityById(id));
    }

    @PreAuthorize("hasAuthority('CITY_UPDATE')")
    @PatchMapping("/update-name/{id}")
    public ResponseEntity<?> updateName(@PathVariable Integer id, @RequestBody @Valid UpdateCityNameDTO updateCityNameDTO){
        cityService.updateCityName(id, updateCityNameDTO);
        return ResponseEntity.status(200).body(new ApiResponse("Name updated successfully"));
    }

    @PreAuthorize("hasAuthority('CITY_DELETE')")
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id){
        cityService.deleteCity(id);
        return ResponseEntity.status(200).body(new ApiResponse("City deleted successfully"));
    }
}
