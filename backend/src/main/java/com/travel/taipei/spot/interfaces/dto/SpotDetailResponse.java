package com.travel.taipei.spot.interfaces.dto;

import java.util.List;

public record SpotDetailResponse(
        String id,
        String name,
        String type,
        Double rating,
        String address,
        String phone,
        String website,
        List<String> openingHours,
        List<String> photoUrls,
        double lat,
        double lng
) {}
