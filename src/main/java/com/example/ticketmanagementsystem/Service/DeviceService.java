
package com.example.ticketmanagementsystem.Service;

import com.example.ticketmanagementsystem.Api.ApiException;
import com.example.ticketmanagementsystem.DtoIn.DeviceDTO;
import com.example.ticketmanagementsystem.DtoOut.DeviceResponseDTO;
import com.example.ticketmanagementsystem.Model.Device;
import com.example.ticketmanagementsystem.Repository.DeviceRepository;
import com.example.ticketmanagementsystem.Repository.TerminalRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@AllArgsConstructor
public class DeviceService {
    private final DeviceRepository deviceRepository;
    private final TerminalRepository terminalRepository;

    public void addDevice(DeviceDTO newDevice){
        Device oldDevice = deviceRepository.findDeviceBySerialNumber(newDevice.getSerialNumber());

        if (oldDevice != null){
            throw new ApiException("Device serial number already exist");
        }

        Device device = new Device();
        device.setModel(newDevice.getModel());
        device.setSerialNumber(newDevice.getSerialNumber());

        deviceRepository.save(device);
    }

    public List<DeviceResponseDTO> getAllDevices(){
        List<Device> devices = deviceRepository.findAll();

        if (devices.isEmpty()){
            throw new ApiException("The list is empty");
        }

        List<DeviceResponseDTO> deviceResponseDTOS = new ArrayList<>();

        for (int i = 0; i < devices.size(); i++){
            Device currentDevice = devices.get(i);
            deviceResponseDTOS.add(createDeviceResponseDTO(currentDevice));
        }

        return deviceResponseDTOS;
    }

    public DeviceResponseDTO getDeviceById(Integer id){
        Device targetDevice = deviceRepository.findDeviceById(id);

        if (targetDevice == null){
            throw new ApiException("Device not found");
        }

        return createDeviceResponseDTO(targetDevice);
    }

    public DeviceResponseDTO getDeviceBySerialNumber(String serialNumber){
        Device targetDevice = deviceRepository.findDeviceBySerialNumber(serialNumber);

        if (targetDevice == null){
            throw new ApiException("Device not found");
        }

        return createDeviceResponseDTO(targetDevice);
    }

    public void updateDevice(Integer id, DeviceDTO updateDeviceDTO){
        Device targetDevice = deviceRepository.findDeviceById(id);

        if (targetDevice == null){
            throw new ApiException("Device not found");
        }

        String newModel = updateDeviceDTO.getModel();
        String newSerialNumber = updateDeviceDTO.getSerialNumber();

        if (targetDevice.getModel().equals(newModel) && targetDevice.getSerialNumber().equals(newSerialNumber)){
            throw new ApiException("You entered the same old data");
        }

        if (!targetDevice.getSerialNumber().equals(newSerialNumber)){
            if (deviceRepository.existsBySerialNumber(newSerialNumber)){
                throw new ApiException("Device serial number already been used");
            }
        }

        targetDevice.setModel(newModel);
        targetDevice.setSerialNumber(newSerialNumber);

        deviceRepository.save(targetDevice);
    }

    public void deleteDevice(Integer id){
        Device targetDevice = deviceRepository.findDeviceById(id);

        if (targetDevice == null){
            throw new ApiException("Device not found");
        }

        if (terminalRepository.existsByDevice_Id(id)){
            throw new ApiException("Can't delete device connected with terminal");
        }

        deviceRepository.delete(targetDevice);
    }

    private DeviceResponseDTO createDeviceResponseDTO(Device device){
        return new DeviceResponseDTO(
                device.getId(),
                device.getModel(),
                device.getSerialNumber()
        );
    }
}
