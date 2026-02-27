package com.travel.taipei.phrase.domain;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PhraseRepository extends JpaRepository<Phrase, Long> {

    List<Phrase> findAllByOrderByCategoryAscSortOrderAscIdAsc();

    List<Phrase> findByCategoryOrderBySortOrderAscIdAsc(PhraseCategory category);
}
