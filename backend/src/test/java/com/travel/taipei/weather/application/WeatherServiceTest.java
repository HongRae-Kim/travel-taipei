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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class WeatherServiceTest {

    @Mock
    private WeatherApiClient weatherApiClient;

    @InjectMocks
    private WeatherService weatherService;

    @Test
    void getWeather_whenApiReturnsData_returnsWeatherResponse() {
        WeatherResponse response = new WeatherResponse("Taipei", 22.5, 23.1, 70, "맑음",
                "https://openweathermap.org/img/wn/01d@2x.png", 3.5);
        given(weatherApiClient.fetchTaipeiWeather()).willReturn(response);

        WeatherResponse result = weatherService.getWeather();

        assertThat(result.city()).isEqualTo("Taipei");
        assertThat(result.temperature()).isEqualTo(22.5);
        assertThat(result.humidity()).isEqualTo(70);
    }

    @Test
    void getWeather_whenApiThrowsException_propagatesException() {
        given(weatherApiClient.fetchTaipeiWeather())
                .willThrow(new BusinessException(ErrorCode.EXTERNAL_API_ERROR));

        assertThatThrownBy(() -> weatherService.getWeather())
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.EXTERNAL_API_ERROR.getMessage());
    }
}
