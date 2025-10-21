package com.example.backend.controller;

import com.example.backend.entity.SError;
import com.example.backend.repository.SErrorRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/errors")
public class SErrorController {

    private final SErrorRepository sErrorRepository;

    public SErrorController(SErrorRepository sErrorRepository) {
        this.sErrorRepository = sErrorRepository;
    }

    // 全件取得
    @GetMapping
    public List<SError> getAllErrors() {
        return sErrorRepository.findAll();
    }
}
