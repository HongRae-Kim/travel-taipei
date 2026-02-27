package com.travel.taipei.spot.interfaces;

import com.travel.taipei.global.response.ApiResponse;
import com.travel.taipei.spot.application.SpotService;
import com.travel.taipei.spot.interfaces.dto.SpotDetailResponse;
import com.travel.taipei.spot.interfaces.dto.SpotResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/spots")
@RequiredArgsConstructor
public class SpotController {

    private final SpotService spotService;

    @GetMapping
    public ApiResponse<List<SpotResponse>> getSpots(
            @RequestParam String type,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(defaultValue = "5000") Integer radius,
            @RequestParam(defaultValue = "false") boolean openNow,
            @RequestParam(required = false) Double minRating
    ) {
        return ApiResponse.ok(spotService.getSpots(type, lat, lng, radius, openNow, minRating));
    }

    @GetMapping("/{placeId}")
    public ApiResponse<SpotDetailResponse> getSpotDetail(
            @PathVariable String placeId,
            @RequestParam(defaultValue = "restaurant") String type) {
        return ApiResponse.ok(spotService.getSpotDetail(placeId, type));
    }
}
