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
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class ExchangeServiceTest {

    @Mock
    private ExchangeApiClient exchangeApiClient;

    @Mock
    private CacheManager cacheManager;

    @Mock
    private Cache exchangeCache;

    @Mock
    private Cache exchangeBackupCache;

    @InjectMocks
    private ExchangeService exchangeService;

    @Test
    void getExchangeRate_whenPrimaryCacheHasValue_returnsCached() {
        ExchangeRateResponse cached = new ExchangeRateResponse("TWD", 43.24, 42.81, 43.68, "2026-02-27");
        given(cacheManager.getCache("exchange-rates")).willReturn(exchangeCache);
        given(exchangeCache.get("TWD", ExchangeRateResponse.class)).willReturn(cached);

        ExchangeRateResponse result = exchangeService.getExchangeRate();

        assertThat(result).isEqualTo(cached);
        verifyNoInteractions(exchangeApiClient);
    }

    @Test
    void getExchangeRate_whenApiReturnsData_returnsExchangeRateAndCaches() {
        ExchangeRateResponse response = new ExchangeRateResponse("TWD", 43.24, 42.81, 43.68, "2026-02-27");
        given(cacheManager.getCache("exchange-rates")).willReturn(exchangeCache);
        given(cacheManager.getCache("exchange-rates-backup")).willReturn(exchangeBackupCache);
        given(exchangeCache.get("TWD", ExchangeRateResponse.class)).willReturn(null);
        given(exchangeApiClient.fetchTwdRate()).willReturn(response);

        ExchangeRateResponse result = exchangeService.getExchangeRate();

        assertThat(result.currency()).isEqualTo("TWD");
        assertThat(result.baseRate()).isEqualTo(43.24);
        verify(exchangeCache).put("TWD", response);
        verify(exchangeBackupCache).put("TWD", response);
    }

    @Test
    void getExchangeRate_whenApiReturnsNull_throwsBusinessException() {
        given(cacheManager.getCache("exchange-rates")).willReturn(exchangeCache);
        given(cacheManager.getCache("exchange-rates-backup")).willReturn(exchangeBackupCache);
        given(exchangeCache.get("TWD", ExchangeRateResponse.class)).willReturn(null);
        given(exchangeBackupCache.get("TWD", ExchangeRateResponse.class)).willReturn(null);
        given(exchangeApiClient.fetchTwdRate()).willReturn(null);

        assertThatThrownBy(() -> exchangeService.getExchangeRate())
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.EXCHANGE_DATA_NOT_FOUND.getMessage());
    }

    @Test
    void getExchangeRate_whenApiFailsAndBackupExists_returnsBackup() {
        ExchangeRateResponse backup = new ExchangeRateResponse("TWD", 43.10, 42.70, 43.50, "2026-02-26");
        given(cacheManager.getCache("exchange-rates")).willReturn(exchangeCache);
        given(cacheManager.getCache("exchange-rates-backup")).willReturn(exchangeBackupCache);
        given(exchangeCache.get("TWD", ExchangeRateResponse.class)).willReturn(null);
        given(exchangeBackupCache.get("TWD", ExchangeRateResponse.class)).willReturn(backup);
        given(exchangeApiClient.fetchTwdRate())
                .willThrow(new BusinessException(ErrorCode.EXTERNAL_API_ERROR));

        ExchangeRateResponse result = exchangeService.getExchangeRate();

        assertThat(result).isEqualTo(backup);
    }

    @Test
    void getExchangeRate_whenApiThrowsExceptionAndNoBackup_propagatesException() {
        given(cacheManager.getCache("exchange-rates")).willReturn(exchangeCache);
        given(cacheManager.getCache("exchange-rates-backup")).willReturn(exchangeBackupCache);
        given(exchangeCache.get("TWD", ExchangeRateResponse.class)).willReturn(null);
        given(exchangeBackupCache.get("TWD", ExchangeRateResponse.class)).willReturn(null);
        given(exchangeApiClient.fetchTwdRate())
                .willThrow(new BusinessException(ErrorCode.EXTERNAL_API_ERROR));

        assertThatThrownBy(exchangeService::getExchangeRate)
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.EXTERNAL_API_ERROR.getMessage());
    }
}
