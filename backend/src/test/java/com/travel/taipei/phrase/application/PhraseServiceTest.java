package com.travel.taipei.phrase.application;

import com.travel.taipei.global.exception.BusinessException;
import com.travel.taipei.global.exception.ErrorCode;
import com.travel.taipei.phrase.domain.Phrase;
import com.travel.taipei.phrase.domain.PhraseCategory;
import com.travel.taipei.phrase.domain.PhraseRepository;
import com.travel.taipei.phrase.interfaces.dto.PhraseResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class PhraseServiceTest {

    @Mock
    private PhraseRepository phraseRepository;

    @InjectMocks
    private PhraseService phraseService;

    @Test
    void findAll_whenDataExists_returnsMappedList() {
        Phrase phrase = phrase(1L, PhraseCategory.RESTAURANT, "물 주세요", "請給我水", "qing gei wo shui", 1);
        given(phraseRepository.findAllByOrderByCategoryAscSortOrderAscIdAsc()).willReturn(List.of(phrase));

        List<PhraseResponse> result = phraseService.findAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).category()).isEqualTo("restaurant");
        assertThat(result.get(0).korean()).isEqualTo("물 주세요");
    }

    @Test
    void findByCategory_whenCategoryIsValid_returnsMappedList() {
        Phrase phrase = phrase(2L, PhraseCategory.HOTEL, "체크인하고 싶어요", "我想辦理入住", "wo xiang ban li ru zhu", 1);
        given(phraseRepository.findByCategoryOrderBySortOrderAscIdAsc(PhraseCategory.HOTEL))
                .willReturn(List.of(phrase));

        List<PhraseResponse> result = phraseService.findByCategory("hotel");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).category()).isEqualTo("hotel");
    }

    @Test
    void findByCategory_whenCategoryIsInvalid_throwsBusinessException() {
        assertThatThrownBy(() -> phraseService.findByCategory("unknown"))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.INVALID_CATEGORY.getMessage());

        verifyNoInteractions(phraseRepository);
    }

    @Test
    void findByCategory_whenNoData_returnsEmptyList() {
        given(phraseRepository.findByCategoryOrderBySortOrderAscIdAsc(PhraseCategory.AIRPORT))
                .willReturn(List.of());

        List<PhraseResponse> result = phraseService.findByCategory("airport");

        assertThat(result).isEmpty();
    }

    private Phrase phrase(
            Long id,
            PhraseCategory category,
            String korean,
            String chinese,
            String pronunciation,
            int sortOrder
    ) {
        return Phrase.builder()
                .id(id)
                .category(category)
                .korean(korean)
                .chinese(chinese)
                .pronunciation(pronunciation)
                .sortOrder(sortOrder)
                .build();
    }
}
