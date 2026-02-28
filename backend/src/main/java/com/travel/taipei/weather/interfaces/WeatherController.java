package com.travel.taipei.weather.interfaces;

import com.travel.taipei.global.response.ApiResponse;
import com.travel.taipei.weather.application.WeatherService;
import com.travel.taipei.weather.interfaces.dto.WeatherForecastItem;
import com.travel.taipei.weather.interfaces.dto.WeatherResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/weather")
@RequiredArgsConstructor
public class WeatherController {

    private final WeatherService weatherService;

    @GetMapping
    public ApiResponse<WeatherResponse> getWeather() {
        return ApiResponse.ok(weatherService.getWeather());
    }

    @GetMapping("/forecast")
    public ApiResponse<List<WeatherForecastItem>> getForecast() {
        return ApiResponse.ok(weatherService.getForecast());
    }
}
