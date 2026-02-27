package com.travel.taipei.spot.domain;

import com.travel.taipei.global.exception.BusinessException;
import com.travel.taipei.global.exception.ErrorCode;

import java.util.Locale;

public enum SpotType {

    RESTAURANT,
    CAFE,
    ATTRACTION;

    public String toGooglePlacesType() {
        return switch (this) {
            case RESTAURANT -> "restaurant";
            case CAFE -> "cafe";
            case ATTRACTION -> "tourist_attraction";
        };
    }

    public static SpotType from(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_SPOT_TYPE);
        }

        try {
            return SpotType.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.INVALID_SPOT_TYPE);
        }
    }
}
