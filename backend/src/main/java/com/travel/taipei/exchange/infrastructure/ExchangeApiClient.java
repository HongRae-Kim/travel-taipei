package com.travel.taipei.exchange.infrastructure;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.travel.taipei.exchange.interfaces.dto.ExchangeRateResponse;
import com.travel.taipei.global.exception.BusinessException;
import com.travel.taipei.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeoutException;

@Component
@RequiredArgsConstructor
public class ExchangeApiClient {

    private final WebClient webClient;

    @Value("${external.exchange.api-key}")
    private String apiKey;

    @Value("${external.exchange.url}")
    private String apiUrl;

    @Value("${external.exchange.fallback-url:https://open.er-api.com/v6/latest/KRW}")
    private String fallbackApiUrl;

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final String TARGET_CURRENCY = "TWD";
    private static final Retry RETRY_SPEC = Retry.backoff(2, Duration.ofMillis(300))
            .maxBackoff(Duration.ofSeconds(2))
            .filter(ExchangeApiClient::isRetryableError);

    public ExchangeRateResponse fetchTwdRate() {
        for (int daysBack = 0; daysBack <= 3; daysBack++) {
            LocalDate targetDate = LocalDate.now().minusDays(daysBack);
            String date = targetDate.format(DATE_FORMAT);
            List<ApiItem> items = callApi(date);

            ExchangeRateResponse response = items.stream()
                    .filter(item -> TARGET_CURRENCY.equals(item.curUnit()) && item.result() == 1)
                    .findFirst()
                    .map(item -> mapToResponse(item, targetDate.toString()))
                    .orElse(null);
            if (response != null) {
                return response;
            }
        }

        return callFallbackApi();
    }

    private List<ApiItem> callApi(String date) {
        List<ApiItem> items = webClient.get()
                .uri(apiUrl + "?authkey={key}&searchdate={date}&data=AP01", apiKey, date)
                .retrieve()
                .onStatus(HttpStatusCode::isError, response ->
                        response.createException().flatMap(Mono::error))
                .bodyToFlux(ApiItem.class)
                .collectList()
                .retryWhen(RETRY_SPEC)
                .onErrorMap(BusinessException.class, e -> e)
                .onErrorMap(e -> !(e instanceof BusinessException), e -> new BusinessException(ErrorCode.EXTERNAL_API_ERROR))
                .block();

        return items != null ? items : List.of();
    }

    private ExchangeRateResponse mapToResponse(ApiItem item, String date) {
        return new ExchangeRateResponse(
                TARGET_CURRENCY,
                parseRate(item.dealBasR()),
                parseRate(item.ttb()),
                parseRate(item.tts()),
                date
        );
    }

    private double parseRate(String value) {
        if (value == null || value.isBlank()) return 0.0;
        return Double.parseDouble(value.replace(",", ""));
    }

    private ExchangeRateResponse callFallbackApi() {
        FallbackApiResponse response = webClient.get()
                .uri(fallbackApiUrl)
                .retrieve()
                .onStatus(HttpStatusCode::isError, res ->
                        res.createException().flatMap(Mono::error))
                .bodyToMono(FallbackApiResponse.class)
                .retryWhen(RETRY_SPEC)
                .onErrorMap(BusinessException.class, e -> e)
                .onErrorMap(e -> !(e instanceof BusinessException), e -> new BusinessException(ErrorCode.EXTERNAL_API_ERROR))
                .block();

        if (response == null || response.rates() == null) {
            throw new BusinessException(ErrorCode.EXCHANGE_DATA_NOT_FOUND);
        }

        Double twdPerKrw = response.rates().get(TARGET_CURRENCY);
        if (twdPerKrw == null || twdPerKrw <= 0.0) {
            throw new BusinessException(ErrorCode.EXCHANGE_DATA_NOT_FOUND);
        }

        double krwPerTwd = roundToTwoDigits(1.0 / twdPerKrw);
        return new ExchangeRateResponse(
                TARGET_CURRENCY,
                krwPerTwd,
                krwPerTwd,
                krwPerTwd,
                LocalDate.now().toString()
        );
    }

    private double roundToTwoDigits(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private static boolean isRetryableError(Throwable throwable) {
        if (throwable instanceof WebClientResponseException responseException) {
            return responseException.getStatusCode().value() == 429
                    || responseException.getStatusCode().is5xxServerError();
        }

        return throwable instanceof WebClientRequestException
                || throwable instanceof TimeoutException;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record ApiItem(
            @JsonProperty("result") Integer result,
            @JsonProperty("cur_unit") String curUnit,
            @JsonProperty("deal_bas_r") String dealBasR,
            @JsonProperty("ttb") String ttb,
            @JsonProperty("tts") String tts
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record FallbackApiResponse(
            @JsonProperty("result") String result,
            @JsonProperty("base_code") String baseCode,
            @JsonProperty("rates") Map<String, Double> rates
    ) {}
}
