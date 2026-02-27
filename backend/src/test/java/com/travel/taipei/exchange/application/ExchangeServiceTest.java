package com.travel.taipei.exchange.application;

import com.travel.taipei.exchange.infrastructure.ExchangeApiClient;
import com.travel.taipei.exchange.interfaces.dto.ExchangeRateResponse;
import com.travel.taipei.global.exception.BusinessException;
import com.travel.taipei.global.exception.ErrorCode;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class ExchangeServiceTest {

    @Mock
    private ExchangeApiClient exchangeApiClient;

    @InjectMocks
    private ExchangeService exchangeService;

    @Test
    void getExchangeRate_whenApiReturnsData_returnsExchangeRate() {
        ExchangeRateResponse response = new ExchangeRateResponse("TWD", 43.24, 42.81, 43.68, "2026-02-27");
        given(exchangeApiClient.fetchTwdRate()).willReturn(response);

        ExchangeRateResponse result = exchangeService.getExchangeRate();

        assertThat(result.currency()).isEqualTo("TWD");
        assertThat(result.baseRate()).isEqualTo(43.24);
    }

    @Test
    void getExchangeRate_whenApiReturnsNull_throwsBusinessException() {
        given(exchangeApiClient.fetchTwdRate()).willReturn(null);

        assertThatThrownBy(() -> exchangeService.getExchangeRate())
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.EXCHANGE_DATA_NOT_FOUND.getMessage());
    }

    @Test
    void getExchangeRate_whenApiThrowsException_propagatesException() {
        given(exchangeApiClient.fetchTwdRate())
                .willThrow(new BusinessException(ErrorCode.EXTERNAL_API_ERROR));

        assertThatThrownBy(() -> exchangeService.getExchangeRate())
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.EXTERNAL_API_ERROR.getMessage());
    }
}
