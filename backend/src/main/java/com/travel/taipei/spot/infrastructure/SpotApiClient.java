package com.travel.taipei.spot.infrastructure;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.travel.taipei.global.exception.BusinessException;
import com.travel.taipei.global.exception.ErrorCode;
import com.travel.taipei.spot.domain.SpotSearchCriteria;
import com.travel.taipei.spot.domain.SpotType;
import com.travel.taipei.spot.interfaces.dto.SpotDetailResponse;
import com.travel.taipei.spot.interfaces.dto.SpotResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.TimeoutException;

@Component
@RequiredArgsConstructor
public class SpotApiClient {

    private final WebClient webClient;

    @Value("${external.google.places-api-key}")
    private String apiKey;

    @Value("${external.google.places-url}")
    private String placesUrl;

    private static final double EARTH_RADIUS_KM = 6371.0;
    private static final Retry RETRY_SPEC = Retry.backoff(2, Duration.ofMillis(300))
            .maxBackoff(Duration.ofSeconds(2))
            .filter(SpotApiClient::isRetryableError);
    private static final Comparator<SpotResponse> DISTANCE_RATING_COMPARATOR = Comparator
            .comparingDouble(SpotResponse::distanceKm)
            .thenComparing(SpotResponse::rating, Comparator.nullsLast(Comparator.reverseOrder()));

    public List<SpotResponse> searchNearby(SpotType spotType, SpotSearchCriteria criteria) {
        String uri = buildNearbySearchUri(spotType, criteria);

        NearbySearchResponse response = webClient.get()
                .uri(uri)
                .retrieve()
                .onStatus(HttpStatusCode::isError, res ->
                        res.createException().flatMap(Mono::error))
                .bodyToMono(NearbySearchResponse.class)
                .retryWhen(RETRY_SPEC)
                .onErrorMap(BusinessException.class, e -> e)
                .onErrorMap(e -> !(e instanceof BusinessException), e -> new BusinessException(ErrorCode.EXTERNAL_API_ERROR))
                .block();

        if (response == null || response.results() == null) {
            return List.of();
        }

        return response.results().stream()
                .map(result -> mapToSpotResponse(result, spotType, criteria))
                .filter(spot -> matchesMinRating(spot, criteria.minRating()))
                .sorted(DISTANCE_RATING_COMPARATOR)
                .toList();
    }

    public SpotDetailResponse getDetails(String placeId, String type) {
        PlaceDetailsResponse response = webClient.get()
                .uri(placesUrl + "/details/json?place_id={id}&key={key}&language=ko&fields=place_id,name,rating,formatted_address,formatted_phone_number,website,opening_hours,photos,geometry",
                        placeId, apiKey)
                .retrieve()
                .onStatus(HttpStatusCode::isError, res ->
                        res.createException().flatMap(Mono::error))
                .bodyToMono(PlaceDetailsResponse.class)
                .retryWhen(RETRY_SPEC)
                .onErrorMap(BusinessException.class, e -> e)
                .onErrorMap(e -> !(e instanceof BusinessException), e -> new BusinessException(ErrorCode.EXTERNAL_API_ERROR))
                .block();

        if (response == null || response.result() == null
                || "NOT_FOUND".equals(response.status()) || "INVALID_REQUEST".equals(response.status())) {
            throw new BusinessException(ErrorCode.SPOT_NOT_FOUND);
        }

        return mapToSpotDetailResponse(response.result(), type);
    }

    private SpotResponse mapToSpotResponse(PlaceResult result, SpotType spotType, SpotSearchCriteria criteria) {
        String photoUrl = buildPhotoUrl(result.photos());
        double lat = result.geometry() != null ? result.geometry().location().lat() : 0.0;
        double lng = result.geometry() != null ? result.geometry().location().lng() : 0.0;
        double distanceKm = roundDistance(calculateDistanceKm(criteria.lat(), criteria.lng(), lat, lng));
        String reason = buildReason(result.rating(), distanceKm, criteria.openNow());

        return new SpotResponse(
                result.placeId(),
                result.name(),
                spotType.name().toLowerCase(),
                result.rating(),
                result.vicinity(),
                photoUrl,
                lat,
                lng,
                distanceKm,
                reason
        );
    }

    private SpotDetailResponse mapToSpotDetailResponse(PlaceDetail detail, String type) {
        List<String> photoUrls = detail.photos() != null
                ? detail.photos().stream().limit(5).map(p -> buildPhotoUrl(List.of(p))).toList()
                : List.of();

        List<String> openingHours = detail.openingHours() != null && detail.openingHours().weekdayText() != null
                ? detail.openingHours().weekdayText()
                : List.of();

        double lat = detail.geometry() != null ? detail.geometry().location().lat() : 0.0;
        double lng = detail.geometry() != null ? detail.geometry().location().lng() : 0.0;

        return new SpotDetailResponse(
                detail.placeId(),
                detail.name(),
                type,
                detail.rating(),
                detail.formattedAddress(),
                detail.formattedPhoneNumber(),
                detail.website(),
                openingHours,
                photoUrls,
                lat,
                lng
        );
    }

    private String buildPhotoUrl(List<Photo> photos) {
        if (photos == null || photos.isEmpty()) return null;
        return placesUrl + "/photo?maxwidth=800&photo_reference=" + photos.get(0).photoReference() + "&key=" + apiKey;
    }

    private String buildNearbySearchUri(SpotType spotType, SpotSearchCriteria criteria) {
        UriComponentsBuilder uriBuilder = UriComponentsBuilder
                .fromHttpUrl(placesUrl + "/nearbysearch/json")
                .queryParam("location", criteria.lat() + "," + criteria.lng())
                .queryParam("radius", criteria.radius())
                .queryParam("type", spotType.toGooglePlacesType())
                .queryParam("key", apiKey)
                .queryParam("language", "ko");

        if (criteria.openNow()) {
            uriBuilder.queryParam("opennow", "true");
        }

        return uriBuilder.build(true).toUriString();
    }

    private boolean matchesMinRating(SpotResponse spot, Double minRating) {
        if (minRating == null) {
            return true;
        }
        return spot.rating() != null && spot.rating() >= minRating;
    }

    private double calculateDistanceKm(double fromLat, double fromLng, double toLat, double toLng) {
        double latDistance = Math.toRadians(toLat - fromLat);
        double lngDistance = Math.toRadians(toLng - fromLng);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(fromLat)) * Math.cos(Math.toRadians(toLat))
                * Math.sin(lngDistance / 2) * Math.sin(lngDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }

    private double roundDistance(double distanceKm) {
        return Math.round(distanceKm * 100.0) / 100.0;
    }

    private String buildReason(Double rating, double distanceKm, boolean openNow) {
        if (rating != null && rating >= 4.5 && distanceKm <= 1.5) {
            return "가깝고 평점이 높아 추천해요.";
        }
        if (rating != null && rating >= 4.5) {
            return "평점이 높아 추천해요.";
        }
        if (distanceKm <= 1.5) {
            return "현재 위치에서 가까워 추천해요.";
        }
        if (openNow) {
            return "현재 영업 중인 장소예요.";
        }
        return "접근성과 평점을 기준으로 추천해요.";
    }

    private static boolean isRetryableError(Throwable throwable) {
        if (throwable instanceof WebClientResponseException responseException) {
            return responseException.getStatusCode().value() == 429
                    || responseException.getStatusCode().is5xxServerError();
        }

        return throwable instanceof WebClientRequestException
                || throwable instanceof TimeoutException;
    }

    // ── Internal API DTOs ──────────────────────────────────────────────

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record NearbySearchResponse(
            @JsonProperty("results") List<PlaceResult> results,
            @JsonProperty("status") String status
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record PlaceDetailsResponse(
            @JsonProperty("result") PlaceDetail result,
            @JsonProperty("status") String status
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record PlaceResult(
            @JsonProperty("place_id") String placeId,
            @JsonProperty("name") String name,
            @JsonProperty("rating") Double rating,
            @JsonProperty("vicinity") String vicinity,
            @JsonProperty("geometry") Geometry geometry,
            @JsonProperty("photos") List<Photo> photos
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record PlaceDetail(
            @JsonProperty("place_id") String placeId,
            @JsonProperty("name") String name,
            @JsonProperty("rating") Double rating,
            @JsonProperty("formatted_address") String formattedAddress,
            @JsonProperty("formatted_phone_number") String formattedPhoneNumber,
            @JsonProperty("website") String website,
            @JsonProperty("opening_hours") OpeningHours openingHours,
            @JsonProperty("photos") List<Photo> photos,
            @JsonProperty("geometry") Geometry geometry
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record OpeningHours(
            @JsonProperty("weekday_text") List<String> weekdayText
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record Photo(
            @JsonProperty("photo_reference") String photoReference
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record Geometry(
            @JsonProperty("location") Location location
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record Location(
            @JsonProperty("lat") double lat,
            @JsonProperty("lng") double lng
    ) {}
}
