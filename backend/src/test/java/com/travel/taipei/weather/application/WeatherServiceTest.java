package com.travel.taipei.weather.application;

import com.travel.taipei.global.exception.BusinessException;
import com.travel.taipei.global.exception.ErrorCode;
import com.travel.taipei.weather.infrastructure.WeatherApiClient;
import com.travel.taipei.weather.interfaces.dto.WeatherResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class WeatherServiceTest {

    @Mock
    private WeatherApiClient weatherApiClient;

    @Mock
    private CacheManager cacheManager;

    @Mock
    private Cache weatherCache;

    @Mock
    private Cache weatherBackupCache;

    @InjectMocks
    private WeatherService weatherService;

    @Test
    void getWeather_whenPrimaryCacheHasValue_returnsCached() {
        WeatherResponse cached = new WeatherResponse("Taipei", 21.0, 21.5, 68, "구름",
                "https://openweathermap.org/img/wn/02d@2x.png", 2.5);
        given(cacheManager.getCache("weather")).willReturn(weatherCache);
        given(weatherCache.get("taipei", WeatherResponse.class)).willReturn(cached);

        WeatherResponse result = weatherService.getWeather();

        assertThat(result).isEqualTo(cached);
        verifyNoInteractions(weatherApiClient);
    }

    @Test
    void getWeather_whenApiReturnsData_returnsWeatherResponseAndCaches() {
        WeatherResponse response = new WeatherResponse("Taipei", 22.5, 23.1, 70, "맑음",
                "https://openweathermap.org/img/wn/01d@2x.png", 3.5);
        given(cacheManager.getCache("weather")).willReturn(weatherCache);
        given(cacheManager.getCache("weather-backup")).willReturn(weatherBackupCache);
        given(weatherCache.get("taipei", WeatherResponse.class)).willReturn(null);
        given(weatherApiClient.fetchTaipeiWeather()).willReturn(response);

        WeatherResponse result = weatherService.getWeather();

        assertThat(result.city()).isEqualTo("Taipei");
        assertThat(result.temperature()).isEqualTo(22.5);
        assertThat(result.humidity()).isEqualTo(70);
        verify(weatherCache).put("taipei", response);
        verify(weatherBackupCache).put("taipei", response);
    }

    @Test
    void getWeather_whenApiFailsAndBackupExists_returnsBackup() {
        WeatherResponse backup = new WeatherResponse("Taipei", 20.0, 20.2, 72, "비",
                "https://openweathermap.org/img/wn/10d@2x.png", 4.2);
        given(cacheManager.getCache("weather")).willReturn(weatherCache);
        given(cacheManager.getCache("weather-backup")).willReturn(weatherBackupCache);
        given(weatherCache.get("taipei", WeatherResponse.class)).willReturn(null);
        given(weatherBackupCache.get("taipei", WeatherResponse.class)).willReturn(backup);
        given(weatherApiClient.fetchTaipeiWeather())
                .willThrow(new BusinessException(ErrorCode.EXTERNAL_API_ERROR));

        WeatherResponse result = weatherService.getWeather();

        assertThat(result).isEqualTo(backup);
    }

    @Test
    void getWeather_whenApiThrowsExceptionAndNoBackup_propagatesException() {
        given(cacheManager.getCache("weather")).willReturn(weatherCache);
        given(cacheManager.getCache("weather-backup")).willReturn(weatherBackupCache);
        given(weatherCache.get("taipei", WeatherResponse.class)).willReturn(null);
        given(weatherBackupCache.get("taipei", WeatherResponse.class)).willReturn(null);
        given(weatherApiClient.fetchTaipeiWeather())
                .willThrow(new BusinessException(ErrorCode.EXTERNAL_API_ERROR));

        assertThatThrownBy(weatherService::getWeather)
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.EXTERNAL_API_ERROR.getMessage());
    }
}
