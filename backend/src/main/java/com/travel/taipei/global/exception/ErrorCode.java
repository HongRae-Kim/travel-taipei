package com.travel.taipei.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // Phrase
    PHRASE_NOT_FOUND(HttpStatus.NOT_FOUND, "PH001", "해당 문구를 찾을 수 없습니다."),
    INVALID_CATEGORY(HttpStatus.BAD_REQUEST, "PH002", "유효하지 않은 카테고리입니다."),

    // Exchange
    EXCHANGE_DATA_NOT_FOUND(HttpStatus.NOT_FOUND, "EX002", "환율 정보를 찾을 수 없습니다."),

    // Spot
    SPOT_NOT_FOUND(HttpStatus.NOT_FOUND, "SP001", "장소 정보를 찾을 수 없습니다."),
    INVALID_SPOT_TYPE(HttpStatus.BAD_REQUEST, "SP002", "유효하지 않은 장소 유형입니다."),

    // External API
    EXTERNAL_API_ERROR(HttpStatus.BAD_GATEWAY, "EX001", "외부 API 호출에 실패했습니다."),

    // Common
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "CM001", "잘못된 요청입니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;
}
