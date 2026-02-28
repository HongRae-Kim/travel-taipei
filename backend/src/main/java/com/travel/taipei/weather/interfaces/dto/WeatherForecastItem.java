package com.travel.taipei.weather.interfaces.dto;

public record WeatherForecastItem(
        String date,
        double minTemp,
        double maxTemp,
        String description,
        String iconUrl
) {}
