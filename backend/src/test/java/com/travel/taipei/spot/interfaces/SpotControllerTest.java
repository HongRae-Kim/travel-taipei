package com.travel.taipei.spot.interfaces;

import com.travel.taipei.global.exception.BusinessException;
import com.travel.taipei.global.exception.ErrorCode;
import com.travel.taipei.spot.application.SpotService;
import com.travel.taipei.spot.interfaces.dto.SpotDetailResponse;
import com.travel.taipei.spot.interfaces.dto.SpotResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SpotController.class)
class SpotControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SpotService spotService;

    @Test
    void getSpots_whenSuccess_returnsOk() throws Exception {
        given(spotService.getSpots("restaurant")).willReturn(
                List.of(new SpotResponse("place-1", "鼎泰豐", "restaurant", 4.5, "台北市信義區", null, 25.033, 121.565))
        );

        mockMvc.perform(get("/api/spots").param("type", "restaurant"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].name").value("鼎泰豐"))
                .andExpect(jsonPath("$.data[0].type").value("restaurant"));
    }

    @Test
    void getSpots_whenTypeIsInvalid_returnsBadRequest() throws Exception {
        given(spotService.getSpots("unknown"))
                .willThrow(new BusinessException(ErrorCode.INVALID_SPOT_TYPE));

        mockMvc.perform(get("/api/spots").param("type", "unknown"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(ErrorCode.INVALID_SPOT_TYPE.getMessage()));
    }

    @Test
    void getSpotDetail_whenSuccess_returnsOk() throws Exception {
        given(spotService.getSpotDetail(eq("place-1"), anyString())).willReturn(
                new SpotDetailResponse("place-1", "鼎泰豐", "restaurant", 4.5,
                        "台北市信義區", "+886-2-2321-8928", null, List.of(), List.of(), 25.033, 121.565)
        );

        mockMvc.perform(get("/api/spots/place-1").param("type", "restaurant"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value("place-1"))
                .andExpect(jsonPath("$.data.name").value("鼎泰豐"));
    }

    @Test
    void getSpotDetail_whenNotFound_returnsNotFound() throws Exception {
        given(spotService.getSpotDetail(eq("invalid"), anyString()))
                .willThrow(new BusinessException(ErrorCode.SPOT_NOT_FOUND));

        mockMvc.perform(get("/api/spots/invalid").param("type", "restaurant"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }
}
