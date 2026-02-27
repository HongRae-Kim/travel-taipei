package com.travel.taipei.exchange.interfaces.dto;

public record ExchangeRateResponse(
        String currency,
        double baseRate,
        double buyRate,
        double sellRate,
        String date
) {}
