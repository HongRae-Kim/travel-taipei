package com.travel.taipei.phrase.interfaces;

import com.travel.taipei.global.response.ApiResponse;
import com.travel.taipei.phrase.application.PhraseService;
import com.travel.taipei.phrase.interfaces.dto.PhraseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/phrases")
@RequiredArgsConstructor
public class PhraseController {

    private final PhraseService phraseService;

    @GetMapping
    public ApiResponse<List<PhraseResponse>> findAll() {
        return ApiResponse.ok(phraseService.findAll());
    }

    @GetMapping("/{category}")
    public ApiResponse<List<PhraseResponse>> findByCategory(@PathVariable String category) {
        return ApiResponse.ok(phraseService.findByCategory(category));
    }
}
