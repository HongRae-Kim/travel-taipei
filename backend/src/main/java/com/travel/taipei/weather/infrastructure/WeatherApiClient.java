package com.travel.taipei.weather.infrastructure;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.travel.taipei.global.exception.BusinessException;
import com.travel.taipei.global.exception.ErrorCode;
import com.travel.taipei.weather.interfaces.dto.WeatherResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
@RequiredArgsConstructor
public class WeatherApiClient {

    private final WebClient webClient;

    @Value("${external.weather.api-key}")
    private String apiKey;

    @Value("${external.weather.url}")
    private String apiUrl;

    private static final double TAIPEI_LAT = 25.0330;
    private static final double TAIPEI_LON = 121.5654;

    public WeatherResponse fetchTaipeiWeather() {
        ApiResponse response = webClient.get()
                .uri(apiUrl + "?lat={lat}&lon={lon}&appid={key}&units=metric&lang=ko",
                        TAIPEI_LAT, TAIPEI_LON, apiKey)
                .retrieve()
                .onStatus(HttpStatusCode::isError, res ->
                        Mono.error(new BusinessException(ErrorCode.EXTERNAL_API_ERROR)))
                .bodyToMono(ApiResponse.class)
                .onErrorMap(BusinessException.class, e -> e)
                .onErrorMap(Exception.class, e -> new BusinessException(ErrorCode.EXTERNAL_API_ERROR))
                .block();

        if (response == null) {
            throw new BusinessException(ErrorCode.EXTERNAL_API_ERROR);
        }

        return mapToResponse(response);
    }

    private WeatherResponse mapToResponse(ApiResponse res) {
        ApiResponse.WeatherCondition condition = res.weather() != null && !res.weather().isEmpty()
                ? res.weather().get(0)
                : new ApiResponse.WeatherCondition("", "", "");

        String iconUrl = condition.icon() != null && !condition.icon().isBlank()
                ? "https://openweathermap.org/img/wn/" + condition.icon() + "@2x.png"
                : "";

        return new WeatherResponse(
                res.name(),
                res.main().temp(),
                res.main().feelsLike(),
                res.main().humidity(),
                condition.description(),
                iconUrl,
                res.wind() != null ? res.wind().speed() : 0.0
        );
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record ApiResponse(
            @JsonProperty("name") String name,
            @JsonProperty("main") Main main,
            @JsonProperty("weather") List<WeatherCondition> weather,
            @JsonProperty("wind") Wind wind
    ) {
        @JsonIgnoreProperties(ignoreUnknown = true)
        record Main(
                @JsonProperty("temp") double temp,
                @JsonProperty("feels_like") double feelsLike,
                @JsonProperty("humidity") int humidity
        ) {}

        @JsonIgnoreProperties(ignoreUnknown = true)
        record WeatherCondition(
                @JsonProperty("main") String main,
                @JsonProperty("description") String description,
                @JsonProperty("icon") String icon
        ) {}

        @JsonIgnoreProperties(ignoreUnknown = true)
        record Wind(@JsonProperty("speed") double speed) {}
    }
}
