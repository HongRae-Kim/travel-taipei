package com.travel.taipei.weather.application;

import com.travel.taipei.weather.infrastructure.WeatherApiClient;
import com.travel.taipei.weather.interfaces.dto.WeatherForecastItem;
import com.travel.taipei.weather.interfaces.dto.WeatherResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WeatherService {

    private static final String CACHE_NAME = "weather";
    private static final String BACKUP_CACHE_NAME = "weather-backup";
    private static final String CACHE_KEY = "taipei";

    private final WeatherApiClient weatherApiClient;
    private final CacheManager cacheManager;

    public WeatherResponse getWeather() {
        Cache cache = cacheManager.getCache(CACHE_NAME);
        WeatherResponse cached = getCached(cache, CACHE_KEY, WeatherResponse.class);
        if (cached != null) {
            return cached;
        }

        try {
            WeatherResponse response = weatherApiClient.fetchTaipeiWeather();
            putCache(cache, CACHE_KEY, response);
            putCache(cacheManager.getCache(BACKUP_CACHE_NAME), CACHE_KEY, response);
            return response;
        } catch (RuntimeException e) {
            WeatherResponse backup = getCached(cacheManager.getCache(BACKUP_CACHE_NAME), CACHE_KEY, WeatherResponse.class);
            if (backup != null) {
                return backup;
            }
            throw e;
        }
    }

    @Cacheable(value = "weather-forecast", key = "'taipei'")
    public List<WeatherForecastItem> getForecast() {
        return weatherApiClient.fetchTaipeiForecast();
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
