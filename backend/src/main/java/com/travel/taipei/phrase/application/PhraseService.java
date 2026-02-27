package com.travel.taipei.phrase.application;

import com.travel.taipei.global.exception.BusinessException;
import com.travel.taipei.global.exception.ErrorCode;
import com.travel.taipei.phrase.domain.PhraseCategory;
import com.travel.taipei.phrase.domain.PhraseRepository;
import com.travel.taipei.phrase.interfaces.dto.PhraseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PhraseService {

    private final PhraseRepository phraseRepository;

    public List<PhraseResponse> findAll() {
        return phraseRepository.findAllByOrderByCategoryAscSortOrderAscIdAsc().stream()
                .map(PhraseResponse::from)
                .toList();
    }

    public List<PhraseResponse> findByCategory(String rawCategory) {
        PhraseCategory category = parseCategory(rawCategory);
        return phraseRepository.findByCategoryOrderBySortOrderAscIdAsc(category).stream()
                .map(PhraseResponse::from)
                .toList();
    }

    private PhraseCategory parseCategory(String rawCategory) {
        if (rawCategory == null || rawCategory.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_CATEGORY);
        }

        String normalized = rawCategory.trim()
                .replace("-", "_")
                .replace(" ", "_")
                .toUpperCase(Locale.ROOT);

        try {
            return PhraseCategory.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.INVALID_CATEGORY);
        }
    }
}
