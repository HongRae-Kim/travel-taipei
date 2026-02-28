package com.travel.taipei.weather.infrastructure;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.travel.taipei.global.exception.BusinessException;
import com.travel.taipei.global.exception.ErrorCode;
import com.travel.taipei.weather.interfaces.dto.WeatherForecastItem;
import com.travel.taipei.weather.interfaces.dto.WeatherResponse;
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
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeoutException;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class WeatherApiClient {

    private final WebClient webClient;

    @Value("${external.weather.api-key}")
    private String apiKey;

    @Value("${external.weather.url}")
    private String apiUrl;

    @Value("${external.weather.forecast-url:https://api.openweathermap.org/data/2.5/forecast}")
    private String forecastUrl;

    private static final double TAIPEI_LAT = 25.0330;
    private static final double TAIPEI_LON = 121.5654;
    private static final ZoneId TAIPEI_ZONE = ZoneId.of("Asia/Taipei");
    private static final DateTimeFormatter DT_TXT_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final Retry RETRY_SPEC = Retry.backoff(2, Duration.ofMillis(300))
            .maxBackoff(Duration.ofSeconds(2))
            .filter(WeatherApiClient::isRetryableError);

    public WeatherResponse fetchTaipeiWeather() {
        ApiResponse response = webClient.get()
                .uri(apiUrl + "?lat={lat}&lon={lon}&appid={key}&units=metric&lang=ko",
                        TAIPEI_LAT, TAIPEI_LON, apiKey)
                .retrieve()
                .onStatus(HttpStatusCode::isError, res ->
                        res.createException().flatMap(Mono::error))
                .bodyToMono(ApiResponse.class)
                .retryWhen(RETRY_SPEC)
                .onErrorMap(BusinessException.class, e -> e)
                .onErrorMap(e -> !(e instanceof BusinessException), e -> new BusinessException(ErrorCode.EXTERNAL_API_ERROR))
                .block();

        if (response == null) {
            throw new BusinessException(ErrorCode.EXTERNAL_API_ERROR);
        }

        return mapToResponse(response);
    }

    private WeatherResponse mapToResponse(ApiResponse res) {
        ApiResponse.WeatherCondition condition = res.weather() != null && !res.weather().isEmpty()
                ? res.weather().get(0)
                : new ApiResponse.WeatherCondition(null, "", "", "");

        String iconUrl = condition.icon() != null && !condition.icon().isBlank()
                ? "https://openweathermap.org/img/wn/" + condition.icon() + "@2x.png"
                : "";

        String description = toKorean(condition.id());
        if (description.isBlank()) description = condition.description();

        return new WeatherResponse(
                res.name(),
                res.main().temp(),
                res.main().feelsLike(),
                res.main().humidity(),
                description,
                iconUrl,
                res.wind() != null ? res.wind().speed() : 0.0
        );
    }

    public List<WeatherForecastItem> fetchTaipeiForecast() {
        ForecastApiResponse response = webClient.get()
                .uri(forecastUrl + "?lat={lat}&lon={lon}&appid={key}&units=metric&lang=ko",
                        TAIPEI_LAT, TAIPEI_LON, apiKey)
                .retrieve()
                .onStatus(HttpStatusCode::isError, res ->
                        res.createException().flatMap(Mono::error))
                .bodyToMono(ForecastApiResponse.class)
                .retryWhen(RETRY_SPEC)
                .onErrorMap(BusinessException.class, e -> e)
                .onErrorMap(e -> !(e instanceof BusinessException), e -> new BusinessException(ErrorCode.EXTERNAL_API_ERROR))
                .block();

        if (response == null || response.list() == null) {
            throw new BusinessException(ErrorCode.EXTERNAL_API_ERROR);
        }

        return mapToForecast(response.list());
    }

    private List<WeatherForecastItem> mapToForecast(List<ForecastSlot> slots) {
        Map<LocalDate, List<ForecastSlot>> byDay = slots.stream()
                .collect(Collectors.groupingBy(slot -> {
                    LocalDateTime utc = LocalDateTime.parse(slot.dtTxt(), DT_TXT_FORMAT);
                    return utc.atZone(ZoneOffset.UTC).withZoneSameInstant(TAIPEI_ZONE).toLocalDate();
                }));

        return byDay.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    List<ForecastSlot> day = entry.getValue();
                    double minTemp = day.stream().mapToDouble(s -> s.main().tempMin()).min().orElse(0);
                    double maxTemp = day.stream().mapToDouble(s -> s.main().tempMax()).max().orElse(0);

                    ForecastSlot repr = day.stream()
                            .min(Comparator.comparingInt(s -> {
                                LocalDateTime utc = LocalDateTime.parse(s.dtTxt(), DT_TXT_FORMAT);
                                int hour = utc.atZone(ZoneOffset.UTC).withZoneSameInstant(TAIPEI_ZONE).getHour();
                                return Math.abs(hour - 12);
                            }))
                            .orElse(day.get(0));

                    ForecastWeatherCondition reprCond = (repr.weather() != null && !repr.weather().isEmpty())
                            ? repr.weather().get(0) : null;
                    String translated = reprCond != null ? toKorean(reprCond.id()) : "";
                    String description = !translated.isBlank() ? translated
                            : (reprCond != null ? reprCond.description() : "");
                    String iconUrl = reprCond != null ? buildIconUrl(reprCond.icon()) : "";

                    return new WeatherForecastItem(entry.getKey().toString(), minTemp, maxTemp, description, iconUrl);
                })
                .toList();
    }

    private static String toKorean(Integer id) {
        if (id == null) return "";
        return switch (id) {
            case 200 -> "뇌우를 동반한 약한 비";
            case 201 -> "뇌우를 동반한 비";
            case 202 -> "뇌우를 동반한 강한 비";
            case 210 -> "약한 뇌우";
            case 211 -> "뇌우";
            case 212 -> "강한 뇌우";
            case 221 -> "산발적 뇌우";
            case 230 -> "뇌우를 동반한 약한 이슬비";
            case 231 -> "뇌우를 동반한 이슬비";
            case 232 -> "뇌우를 동반한 강한 이슬비";
            case 300 -> "약한 이슬비";
            case 301 -> "이슬비";
            case 302 -> "강한 이슬비";
            case 310, 311 -> "가랑비";
            case 312, 313, 314 -> "강한 가랑비";
            case 321 -> "소나기성 이슬비";
            case 500 -> "가벼운 비";
            case 501 -> "보통 비";
            case 502 -> "강한 비";
            case 503 -> "매우 강한 비";
            case 504 -> "폭우";
            case 511 -> "어는 비";
            case 520 -> "약한 소나기";
            case 521 -> "소나기";
            case 522 -> "강한 소나기";
            case 531 -> "산발적 소나기";
            case 600 -> "약한 눈";
            case 601 -> "눈";
            case 602 -> "강한 눈";
            case 611 -> "진눈깨비";
            case 612, 613 -> "소나기성 진눈깨비";
            case 615, 616 -> "비와 눈";
            case 620, 621 -> "소나기 눈";
            case 622 -> "강한 소나기 눈";
            case 701 -> "박무";
            case 711 -> "연무";
            case 721 -> "실안개";
            case 731, 761 -> "먼지";
            case 741 -> "안개";
            case 751 -> "모래";
            case 762 -> "화산재";
            case 771 -> "돌풍";
            case 781 -> "토네이도";
            case 800 -> "맑음";
            case 801 -> "구름 조금";
            case 802 -> "구름 약간";
            case 803 -> "구름 많음";
            case 804 -> "흐림";
            default -> "";
        };
    }

    private String buildIconUrl(String icon) {
        return icon != null && !icon.isBlank()
                ? "https://openweathermap.org/img/wn/" + icon + "@2x.png"
                : "";
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
    private record ForecastApiResponse(
            @JsonProperty("list") List<ForecastSlot> list
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record ForecastSlot(
            @JsonProperty("main") ForecastMain main,
            @JsonProperty("weather") List<ForecastWeatherCondition> weather,
            @JsonProperty("dt_txt") String dtTxt
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record ForecastMain(
            @JsonProperty("temp_min") double tempMin,
            @JsonProperty("temp_max") double tempMax
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record ForecastWeatherCondition(
            @JsonProperty("id") Integer id,
            @JsonProperty("description") String description,
            @JsonProperty("icon") String icon
    ) {}

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
                @JsonProperty("id") Integer id,
                @JsonProperty("main") String main,
                @JsonProperty("description") String description,
                @JsonProperty("icon") String icon
        ) {}

        @JsonIgnoreProperties(ignoreUnknown = true)
        record Wind(@JsonProperty("speed") double speed) {}
    }
}
