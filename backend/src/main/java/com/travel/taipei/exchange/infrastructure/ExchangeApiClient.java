package com.travel.taipei.exchange.infrastructure;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.travel.taipei.exchange.interfaces.dto.ExchangeRateResponse;
import com.travel.taipei.global.exception.BusinessException;
import com.travel.taipei.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ExchangeApiClient {

    private final WebClient webClient;

    @Value("${external.exchange.api-key}")
    private String apiKey;

    @Value("${external.exchange.url}")
    private String apiUrl;

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final String TARGET_CURRENCY = "TWD";

    public ExchangeRateResponse fetchTwdRate() {
        for (int daysBack = 0; daysBack <= 3; daysBack++) {
            String date = LocalDate.now().minusDays(daysBack).format(DATE_FORMAT);
            List<ApiItem> items = callApi(date);

            return items.stream()
                    .filter(item -> TARGET_CURRENCY.equals(item.curUnit()) && item.result() == 1)
                    .findFirst()
                    .map(item -> mapToResponse(item, LocalDate.now().minusDays(daysBack).toString()))
                    .orElse(null);
        }

        throw new BusinessException(ErrorCode.EXCHANGE_DATA_NOT_FOUND);
    }

    private List<ApiItem> callApi(String date) {
        List<ApiItem> items = webClient.get()
                .uri(apiUrl + "?authkey={key}&searchdate={date}&data=AP01", apiKey, date)
                .retrieve()
                .onStatus(HttpStatusCode::isError, response ->
                        Mono.error(new BusinessException(ErrorCode.EXTERNAL_API_ERROR)))
                .bodyToFlux(ApiItem.class)
                .collectList()
                .onErrorMap(BusinessException.class, e -> e)
                .onErrorMap(Exception.class, e -> new BusinessException(ErrorCode.EXTERNAL_API_ERROR))
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

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record ApiItem(
            @JsonProperty("result") Integer result,
            @JsonProperty("cur_unit") String curUnit,
            @JsonProperty("deal_bas_r") String dealBasR,
            @JsonProperty("ttb") String ttb,
            @JsonProperty("tts") String tts
    ) {}
}
