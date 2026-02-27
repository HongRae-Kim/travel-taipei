package com.travel.taipei.exchange.application;

import com.travel.taipei.exchange.infrastructure.ExchangeApiClient;
import com.travel.taipei.exchange.interfaces.dto.ExchangeRateResponse;
import com.travel.taipei.global.exception.BusinessException;
import com.travel.taipei.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ExchangeService {

    private final ExchangeApiClient exchangeApiClient;

    @Cacheable(value = "exchange-rates", key = "'TWD'")
    public ExchangeRateResponse getExchangeRate() {
        ExchangeRateResponse response = exchangeApiClient.fetchTwdRate();
        if (response == null) {
            throw new BusinessException(ErrorCode.EXCHANGE_DATA_NOT_FOUND);
        }
        return response;
    }
}
