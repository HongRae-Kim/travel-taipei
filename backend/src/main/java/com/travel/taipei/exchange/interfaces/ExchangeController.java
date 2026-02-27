package com.travel.taipei.exchange.interfaces;

import com.travel.taipei.exchange.application.ExchangeService;
import com.travel.taipei.exchange.interfaces.dto.ExchangeRateResponse;
import com.travel.taipei.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/exchange-rates")
@RequiredArgsConstructor
public class ExchangeController {

    private final ExchangeService exchangeService;

    @GetMapping
    public ApiResponse<ExchangeRateResponse> getExchangeRate() {
        return ApiResponse.ok(exchangeService.getExchangeRate());
    }
}
