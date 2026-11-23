package com.example.ticketmanagementsystem.Repository;

import com.example.ticketmanagementsystem.Model.City;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CityRepository extends JpaRepository<City, Integer> {
    City findCityById(Integer id);

    boolean existsByName(String name);

    City findCityByName(String name);
}
