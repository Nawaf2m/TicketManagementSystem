
package com.example.ticketmanagementsystem.Controller;

import com.example.ticketmanagementsystem.Api.ApiResponse;
import com.example.ticketmanagementsystem.DtoIn.DeviceDTO;
import com.example.ticketmanagementsystem.Service.DeviceService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/device")
@AllArgsConstructor
public class DeviceController {
    private final DeviceService deviceService;

    @PreAuthorize("hasAuthority('DEVICE_VIEW')")
    @GetMapping("/get")
    public ResponseEntity<?> get(){
        return ResponseEntity.status(200).body(deviceService.getAllDevices());
    }

    @PreAuthorize("hasAuthority('DEVICE_CREATE')")
    @PostMapping("/add")
    public ResponseEntity<?> add(@RequestBody @Valid DeviceDTO deviceDTO){
        deviceService.addDevice(deviceDTO);
        return ResponseEntity.status(200).body(new ApiResponse("Device added successfully"));
    }

    @PreAuthorize("hasAuthority('DEVICE_VIEW')")
    @GetMapping("/get-device-by-id/{id}")
    public ResponseEntity<?> getDeviceById(@PathVariable Integer id){
        return ResponseEntity.status(200).body(deviceService.getDeviceById(id));
    }

    @PreAuthorize("hasAuthority('DEVICE_VIEW')")
    @GetMapping("/get-device-by-serial-number/{serialNumber}")
    public ResponseEntity<?> getDeviceBySerialNumber(@PathVariable String serialNumber){
        return ResponseEntity.status(200).body(deviceService.getDeviceBySerialNumber(serialNumber));
    }

    @PreAuthorize("hasAuthority('DEVICE_UPDATE')")
    @PutMapping("/update/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody @Valid DeviceDTO deviceDTO){
        deviceService.updateDevice(id, deviceDTO);
        return ResponseEntity.status(200).body(new ApiResponse("Device updated successfully"));
    }

    @PreAuthorize("hasAuthority('DEVICE_DELETE')")
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id){
        deviceService.deleteDevice(id);
        return ResponseEntity.status(200).body(new ApiResponse("Device deleted successfully"));
    }
}
