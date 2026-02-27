package com.travel.taipei.exchange.application;

import com.travel.taipei.exchange.infrastructure.ExchangeApiClient;
import com.travel.taipei.exchange.interfaces.dto.ExchangeRateResponse;
import com.travel.taipei.global.exception.BusinessException;
import com.travel.taipei.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ExchangeService {

    private static final String CACHE_NAME = "exchange-rates";
    private static final String BACKUP_CACHE_NAME = "exchange-rates-backup";
    private static final String CACHE_KEY = "TWD";

    private final ExchangeApiClient exchangeApiClient;
    private final CacheManager cacheManager;

    public ExchangeRateResponse getExchangeRate() {
        Cache cache = cacheManager.getCache(CACHE_NAME);
        ExchangeRateResponse cached = getCached(cache, CACHE_KEY, ExchangeRateResponse.class);
        if (cached != null) {
            return cached;
        }

        try {
            ExchangeRateResponse response = exchangeApiClient.fetchTwdRate();
            if (response == null) {
                throw new BusinessException(ErrorCode.EXCHANGE_DATA_NOT_FOUND);
            }
            putCache(cache, CACHE_KEY, response);
            putCache(cacheManager.getCache(BACKUP_CACHE_NAME), CACHE_KEY, response);
            return response;
        } catch (BusinessException e) {
            ExchangeRateResponse backup = getCached(
                    cacheManager.getCache(BACKUP_CACHE_NAME),
                    CACHE_KEY,
                    ExchangeRateResponse.class
            );
            if (backup != null) {
                return backup;
            }
            throw e;
        }
    }

    private <T> T getCached(Cache cache, String key, Class<T> targetType) {
        return cache != null ? cache.get(key, targetType) : null;
    }

    private void putCache(Cache cache, String key, Object value) {
        if (cache != null) {
            cache.put(key, value);
        }
    }
}
