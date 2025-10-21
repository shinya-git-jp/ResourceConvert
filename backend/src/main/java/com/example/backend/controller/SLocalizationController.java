package com.example.backend.controller;

import com.example.backend.entity.SLocalization;
import com.example.backend.repository.SLocalizationRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class SLocalizationController {

    private final SLocalizationRepository repository;

    public SLocalizationController(SLocalizationRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/api/slocalizations")
    public List<SLocalization> getAll() {
        return repository.findAll();
    }
}
