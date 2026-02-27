package com.travel.taipei.phrase.interfaces.dto;

import com.travel.taipei.phrase.domain.Phrase;

import java.util.Locale;

public record PhraseResponse(
        Long id,
        String category,
        String korean,
        String chinese,
        String pronunciation
) {
    public static PhraseResponse from(Phrase phrase) {
        return new PhraseResponse(
                phrase.getId(),
                phrase.getCategory().name().toLowerCase(Locale.ROOT),
                phrase.getKorean(),
                phrase.getChinese(),
                phrase.getPronunciation()
        );
    }
}
