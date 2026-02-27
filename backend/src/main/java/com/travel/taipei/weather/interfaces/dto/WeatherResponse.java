package com.travel.taipei.weather.interfaces.dto;

public record WeatherResponse(
        String city,
        double temperature,
        double feelsLike,
        int humidity,
        String description,
        String icon,
        double windSpeed
) {}
