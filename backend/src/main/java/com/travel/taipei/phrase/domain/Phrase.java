package com.travel.taipei.phrase.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(
        name = "phrase",
        indexes = {
                @Index(name = "idx_phrase_category_sort", columnList = "category, sort_order, id")
        }
)
public class Phrase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PhraseCategory category;

    @Column(nullable = false, length = 200)
    private String korean;

    @Column(nullable = false, length = 200)
    private String chinese;

    @Column(nullable = false, length = 200)
    private String pronunciation;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;
}
