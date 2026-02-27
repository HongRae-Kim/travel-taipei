package com.travel.taipei.spot.application;

import com.travel.taipei.spot.domain.SpotType;
import com.travel.taipei.spot.domain.SpotSearchCriteria;
import com.travel.taipei.spot.infrastructure.SpotApiClient;
import com.travel.taipei.spot.interfaces.dto.SpotDetailResponse;
import com.travel.taipei.spot.interfaces.dto.SpotResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SpotService {

    private final SpotApiClient spotApiClient;

    @Cacheable(
            value = "spots",
            key = "#rawType.toUpperCase() + ':' + (#lat == null ? 25.0330 : #lat) + ':' + (#lng == null ? 121.5654 : #lng) + ':' + (#radius == null ? 5000 : #radius) + ':' + #openNow + ':' + (#minRating == null ? 'all' : #minRating)"
    )
    public List<SpotResponse> getSpots(
            String rawType,
            Double lat,
            Double lng,
            Integer radius,
            boolean openNow,
            Double minRating
    ) {
        SpotType spotType = SpotType.from(rawType);
        SpotSearchCriteria criteria = SpotSearchCriteria.from(lat, lng, radius, openNow, minRating);
        return spotApiClient.searchNearby(spotType, criteria);
    }

    @Cacheable(value = "spot-details", key = "#placeId + ':' + #type")
    public SpotDetailResponse getSpotDetail(String placeId, String type) {
        return spotApiClient.getDetails(placeId, type);
    }
}
