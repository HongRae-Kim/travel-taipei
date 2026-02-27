package com.travel.taipei.weather.application;

import com.travel.taipei.weather.infrastructure.WeatherApiClient;
import com.travel.taipei.weather.interfaces.dto.WeatherResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class WeatherService {

    private final WeatherApiClient weatherApiClient;

    @Cacheable(value = "weather", key = "'taipei'")
    public WeatherResponse getWeather() {
        return weatherApiClient.fetchTaipeiWeather();
    }
}
