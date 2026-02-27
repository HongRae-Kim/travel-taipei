package com.travel.taipei.spot.interfaces.dto;

public record SpotResponse(
        String id,
        String name,
        String type,
        Double rating,
        String address,
        String photoUrl,
        double lat,
        double lng
) {}
