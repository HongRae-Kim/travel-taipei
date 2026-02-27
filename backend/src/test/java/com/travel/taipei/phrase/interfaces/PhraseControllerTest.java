package com.travel.taipei.phrase.interfaces;

import com.travel.taipei.global.exception.BusinessException;
import com.travel.taipei.global.exception.ErrorCode;
import com.travel.taipei.phrase.application.PhraseService;
import com.travel.taipei.phrase.interfaces.dto.PhraseResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PhraseController.class)
class PhraseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PhraseService phraseService;

    @Test
    void findAll_whenRequestIsValid_returnsPhraseList() throws Exception {
        given(phraseService.findAll()).willReturn(
                List.of(new PhraseResponse(1L, "restaurant", "물 주세요", "請給我水", "qing gei wo shui"))
        );

        mockMvc.perform(get("/api/phrases"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].category").value("restaurant"))
                .andExpect(jsonPath("$.data[0].korean").value("물 주세요"));
    }

    @Test
    void findByCategory_whenCategoryIsInvalid_returnsBadRequest() throws Exception {
        given(phraseService.findByCategory("invalid"))
                .willThrow(new BusinessException(ErrorCode.INVALID_CATEGORY));

        mockMvc.perform(get("/api/phrases/invalid"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(ErrorCode.INVALID_CATEGORY.getMessage()));
    }
}
