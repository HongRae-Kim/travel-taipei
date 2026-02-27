package com.travel.taipei.spot.application;

import com.travel.taipei.spot.domain.SpotType;
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

    @Cacheable(value = "spots", key = "#rawType.toUpperCase()")
    public List<SpotResponse> getSpots(String rawType) {
        SpotType spotType = SpotType.from(rawType);
        return spotApiClient.searchNearby(spotType);
    }

    @Cacheable(value = "spot-details", key = "#placeId")
    public SpotDetailResponse getSpotDetail(String placeId, String type) {
        return spotApiClient.getDetails(placeId, type);
    }
}
