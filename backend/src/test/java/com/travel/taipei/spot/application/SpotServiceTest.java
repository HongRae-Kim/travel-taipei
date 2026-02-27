package com.travel.taipei.spot.application;

import com.travel.taipei.global.exception.BusinessException;
import com.travel.taipei.global.exception.ErrorCode;
import com.travel.taipei.spot.infrastructure.SpotApiClient;
import com.travel.taipei.spot.interfaces.dto.SpotDetailResponse;
import com.travel.taipei.spot.interfaces.dto.SpotResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class SpotServiceTest {

    @Mock
    private SpotApiClient spotApiClient;

    @InjectMocks
    private SpotService spotService;

    @Test
    void getSpots_whenTypeIsValid_returnsSpotList() {
        SpotResponse spot = new SpotResponse(
                "place-1",
                "鼎泰豐",
                "restaurant",
                4.5,
                "台北市信義區",
                null,
                25.033,
                121.565,
                0.3,
                "가깝고 평점이 높아 추천해요."
        );
        given(spotApiClient.searchNearby(any(), any())).willReturn(List.of(spot));

        List<SpotResponse> result = spotService.getSpots("restaurant", null, null, 5000, false, null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).name()).isEqualTo("鼎泰豐");
        assertThat(result.get(0).type()).isEqualTo("restaurant");
    }

    @Test
    void getSpots_whenTypeIsInvalid_throwsBusinessException() {
        assertThatThrownBy(() -> spotService.getSpots("unknown", null, null, 5000, false, null))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.INVALID_SPOT_TYPE.getMessage());

        verifyNoInteractions(spotApiClient);
    }

    @Test
    void getSpots_whenLatitudeIsInvalid_throwsBusinessException() {
        assertThatThrownBy(() -> spotService.getSpots("restaurant", 99.0, null, 5000, false, null))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.INVALID_INPUT.getMessage());

        verifyNoInteractions(spotApiClient);
    }

    @Test
    void getSpotDetail_whenFound_returnsSpotDetail() {
        SpotDetailResponse detail = new SpotDetailResponse(
                "place-1", "鼎泰豐", "restaurant", 4.5, "台北市信義區",
                "+886-2-2321-8928", "https://www.dintaifung.com.tw",
                List.of("월요일: 오전 11:00 – 오후 9:30"), List.of(), 25.033, 121.565
        );
        given(spotApiClient.getDetails(eq("place-1"), eq("restaurant"))).willReturn(detail);

        SpotDetailResponse result = spotService.getSpotDetail("place-1", "restaurant");

        assertThat(result.id()).isEqualTo("place-1");
        assertThat(result.name()).isEqualTo("鼎泰豐");
    }

    @Test
    void getSpotDetail_whenNotFound_throwsBusinessException() {
        given(spotApiClient.getDetails(eq("invalid-id"), eq("restaurant")))
                .willThrow(new BusinessException(ErrorCode.SPOT_NOT_FOUND));

        assertThatThrownBy(() -> spotService.getSpotDetail("invalid-id", "restaurant"))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.SPOT_NOT_FOUND.getMessage());
    }
}
