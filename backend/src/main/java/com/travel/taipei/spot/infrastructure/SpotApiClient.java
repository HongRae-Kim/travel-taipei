package com.travel.taipei.spot.infrastructure;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.travel.taipei.global.exception.BusinessException;
import com.travel.taipei.global.exception.ErrorCode;
import com.travel.taipei.spot.domain.SpotType;
import com.travel.taipei.spot.interfaces.dto.SpotDetailResponse;
import com.travel.taipei.spot.interfaces.dto.SpotResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
@RequiredArgsConstructor
public class SpotApiClient {

    private final WebClient webClient;

    @Value("${external.google.places-api-key}")
    private String apiKey;

    @Value("${external.google.places-url}")
    private String placesUrl;

    private static final double TAIPEI_LAT = 25.0330;
    private static final double TAIPEI_LON = 121.5654;
    private static final int SEARCH_RADIUS = 5000;

    public List<SpotResponse> searchNearby(SpotType spotType) {
        NearbySearchResponse response = webClient.get()
                .uri(placesUrl + "/nearbysearch/json?location={lat},{lon}&radius={radius}&type={type}&key={key}&language=ko",
                        TAIPEI_LAT, TAIPEI_LON, SEARCH_RADIUS, spotType.toGooglePlacesType(), apiKey)
                .retrieve()
                .onStatus(HttpStatusCode::isError, res ->
                        Mono.error(new BusinessException(ErrorCode.EXTERNAL_API_ERROR)))
                .bodyToMono(NearbySearchResponse.class)
                .onErrorMap(BusinessException.class, e -> e)
                .onErrorMap(Exception.class, e -> new BusinessException(ErrorCode.EXTERNAL_API_ERROR))
                .block();

        if (response == null || response.results() == null) {
            return List.of();
        }

        return response.results().stream()
                .map(result -> mapToSpotResponse(result, spotType))
                .toList();
    }

    public SpotDetailResponse getDetails(String placeId, String type) {
        PlaceDetailsResponse response = webClient.get()
                .uri(placesUrl + "/details/json?place_id={id}&key={key}&language=ko&fields=place_id,name,rating,formatted_address,formatted_phone_number,website,opening_hours,photos,geometry",
                        placeId, apiKey)
                .retrieve()
                .onStatus(HttpStatusCode::isError, res ->
                        Mono.error(new BusinessException(ErrorCode.EXTERNAL_API_ERROR)))
                .bodyToMono(PlaceDetailsResponse.class)
                .onErrorMap(BusinessException.class, e -> e)
                .onErrorMap(Exception.class, e -> new BusinessException(ErrorCode.EXTERNAL_API_ERROR))
                .block();

        if (response == null || response.result() == null
                || "NOT_FOUND".equals(response.status()) || "INVALID_REQUEST".equals(response.status())) {
            throw new BusinessException(ErrorCode.SPOT_NOT_FOUND);
        }

        return mapToSpotDetailResponse(response.result(), type);
    }

    private SpotResponse mapToSpotResponse(PlaceResult result, SpotType spotType) {
        String photoUrl = buildPhotoUrl(result.photos());
        double lat = result.geometry() != null ? result.geometry().location().lat() : 0.0;
        double lng = result.geometry() != null ? result.geometry().location().lng() : 0.0;

        return new SpotResponse(
                result.placeId(),
                result.name(),
                spotType.name().toLowerCase(),
                result.rating(),
                result.vicinity(),
                photoUrl,
                lat,
                lng
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
