package com.travel.taipei.weather.interfaces;

import com.travel.taipei.global.exception.BusinessException;
import com.travel.taipei.global.exception.ErrorCode;
import com.travel.taipei.weather.application.WeatherService;
import com.travel.taipei.weather.interfaces.dto.WeatherResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(WeatherController.class)
class WeatherControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private WeatherService weatherService;

    @Test
    void getWeather_whenSuccess_returnsOk() throws Exception {
        given(weatherService.getWeather()).willReturn(
                new WeatherResponse("Taipei", 22.5, 23.1, 70, "맑음",
                        "https://openweathermap.org/img/wn/01d@2x.png", 3.5)
        );

        mockMvc.perform(get("/api/weather"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.city").value("Taipei"))
                .andExpect(jsonPath("$.data.temperature").value(22.5));
    }

    @Test
    void getWeather_whenExternalApiError_returnsBadGateway() throws Exception {
        given(weatherService.getWeather())
                .willThrow(new BusinessException(ErrorCode.EXTERNAL_API_ERROR));

        mockMvc.perform(get("/api/weather"))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.success").value(false));
    }
}
