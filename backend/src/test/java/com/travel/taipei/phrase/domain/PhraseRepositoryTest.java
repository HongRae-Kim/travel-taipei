package com.travel.taipei.phrase.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

@DataJpaTest(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect"
})
class PhraseRepositoryTest {

    @Autowired
    private PhraseRepository phraseRepository;

    @Test
    void findAll_sortedByCategoryThenSortOrderThenId() {
        phraseRepository.saveAll(List.of(
            phrase(PhraseCategory.RESTAURANT, "물 주세요", 2),
            phrase(PhraseCategory.AIRPORT,    "짐은 어디서 찾나요?", 1),
            phrase(PhraseCategory.RESTAURANT, "메뉴 주세요", 1)
        ));

        List<Phrase> result = phraseRepository.findAllByOrderByCategoryAscSortOrderAscIdAsc();

        assertThat(result).hasSize(3);
        assertThat(result.get(0).getCategory()).isEqualTo(PhraseCategory.AIRPORT);
        assertThat(result.get(1).getSortOrder()).isEqualTo(1); // RESTAURANT sortOrder=1
        assertThat(result.get(2).getSortOrder()).isEqualTo(2); // RESTAURANT sortOrder=2
    }

    @Test
    void findByCategory_returnsOnlyMatchingCategory() {
        phraseRepository.saveAll(List.of(
            phrase(PhraseCategory.HOTEL,      "체크인해주세요", 1),
            phrase(PhraseCategory.RESTAURANT, "물 주세요",     1)
        ));

        List<Phrase> result = phraseRepository.findByCategoryOrderBySortOrderAscIdAsc(PhraseCategory.HOTEL);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCategory()).isEqualTo(PhraseCategory.HOTEL);
    }

    @Test
    void findByCategory_sortedBySortOrderThenId() {
        phraseRepository.saveAll(List.of(
            phrase(PhraseCategory.SHOPPING, "영수증 주세요", 3),
            phrase(PhraseCategory.SHOPPING, "얼마예요?",    1),
            phrase(PhraseCategory.SHOPPING, "카드 되나요?", 2)
        ));

        List<Phrase> result = phraseRepository.findByCategoryOrderBySortOrderAscIdAsc(PhraseCategory.SHOPPING);

        assertThat(result).extracting(Phrase::getSortOrder)
                .containsExactly(1, 2, 3);
    }

    private Phrase phrase(PhraseCategory category, String korean, int sortOrder) {
        return Phrase.builder()
                .category(category)
                .korean(korean)
                .chinese("中文")
                .pronunciation("pronunciation")
                .sortOrder(sortOrder)
                .build();
    }
}