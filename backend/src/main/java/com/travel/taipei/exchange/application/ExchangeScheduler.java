package com.travel.taipei.exchange.application;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ExchangeScheduler {

    private final ExchangeService exchangeService;
    private final CacheManager cacheManager;

    // 한국수출입은행 환율 API는 평일 오전 11시경 업데이트
    // 매 평일 11:30 KST에 캐시를 갱신하여 하루 1회 API 호출로 제한
    @Scheduled(cron = "0 30 11 * * MON-FRI", zone = "Asia/Seoul")
    public void refreshExchangeRate() {
        log.info("[ExchangeScheduler] 환율 캐시 갱신 시작");
        var cache = cacheManager.getCache("exchange-rates");
        if (cache != null) {
            cache.evict("TWD");
        }
        exchangeService.getExchangeRate();
        log.info("[ExchangeScheduler] 환율 캐시 갱신 완료");
    }
}
