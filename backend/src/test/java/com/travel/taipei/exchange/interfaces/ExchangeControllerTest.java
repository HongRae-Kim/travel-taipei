package com.travel.taipei.exchange.interfaces;

import com.travel.taipei.exchange.application.ExchangeService;
import com.travel.taipei.exchange.interfaces.dto.ExchangeRateResponse;
import com.travel.taipei.global.exception.BusinessException;
import com.travel.taipei.global.exception.ErrorCode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ExchangeController.class)
class ExchangeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ExchangeService exchangeService;

    @Test
    void getExchangeRate_whenSuccess_returnsOk() throws Exception {
        given(exchangeService.getExchangeRate()).willReturn(
                new ExchangeRateResponse("TWD", 43.24, 42.81, 43.68, "2026-02-27")
        );

        mockMvc.perform(get("/api/exchange-rates"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.currency").value("TWD"))
                .andExpect(jsonPath("$.data.baseRate").value(43.24));
    }

    @Test
    void getExchangeRate_whenDataNotFound_returnsNotFound() throws Exception {
        given(exchangeService.getExchangeRate())
                .willThrow(new BusinessException(ErrorCode.EXCHANGE_DATA_NOT_FOUND));

        mockMvc.perform(get("/api/exchange-rates"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(ErrorCode.EXCHANGE_DATA_NOT_FOUND.getMessage()));
    }

    @Test
    void getExchangeRate_whenExternalApiError_returnsBadGateway() throws Exception {
        given(exchangeService.getExchangeRate())
                .willThrow(new BusinessException(ErrorCode.EXTERNAL_API_ERROR));

        mockMvc.perform(get("/api/exchange-rates"))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.success").value(false));
    }
}
