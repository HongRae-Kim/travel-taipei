package com.travel.taipei.spot.domain;

import com.travel.taipei.global.exception.BusinessException;
import com.travel.taipei.global.exception.ErrorCode;

import java.util.Locale;

public record SpotSearchCriteria(
        double lat,
        double lng,
        int radius,
        boolean openNow,
        Double minRating
) {
    private static final double DEFAULT_LAT = 25.0330;
    private static final double DEFAULT_LNG = 121.5654;
    private static final int DEFAULT_RADIUS = 5000;
    private static final int MIN_RADIUS = 1;
    private static final int MAX_RADIUS = 50000;

    public static SpotSearchCriteria from(
            Double lat,
            Double lng,
            Integer radius,
            boolean openNow,
            Double minRating
    ) {
        double resolvedLat = lat != null ? lat : DEFAULT_LAT;
        double resolvedLng = lng != null ? lng : DEFAULT_LNG;
        int resolvedRadius = radius != null ? radius : DEFAULT_RADIUS;

        validate(resolvedLat, resolvedLng, resolvedRadius, minRating);

        return new SpotSearchCriteria(resolvedLat, resolvedLng, resolvedRadius, openNow, minRating);
    }

    public String cacheKey() {
        String ratingKey = minRating != null
                ? String.format(Locale.ROOT, "%.1f", minRating)
                : "all";
        return String.format(
                Locale.ROOT,
                "%.4f:%.4f:%d:%s:%s",
                lat,
                lng,
                radius,
                openNow,
                ratingKey
        );
    }

    private static void validate(double lat, double lng, int radius, Double minRating) {
        if (lat < -90.0 || lat > 90.0) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        if (lng < -180.0 || lng > 180.0) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        if (radius < MIN_RADIUS || radius > MAX_RADIUS) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        if (minRating != null && (minRating < 0.0 || minRating > 5.0)) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
    }
}
