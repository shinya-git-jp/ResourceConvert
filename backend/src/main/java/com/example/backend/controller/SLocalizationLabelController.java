package com.example.backend.controller;

import com.example.backend.entity.SLocalizationLabel;
import com.example.backend.repository.SLocalizationLabelRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController // RestController にすることでJSONを返す
@RequestMapping("/api/labels") // API のエンドポイント
@CrossOrigin(origins = "http://localhost:5173") // React 側を許可
public class SLocalizationLabelController {

    @Autowired
    private SLocalizationLabelRepository repository;

    @GetMapping
    public List<SLocalizationLabel> getAllLabels() {
        return repository.findAll(); // DBの全件取得を返す
    }

    @GetMapping("/{id}")
    public SLocalizationLabel getLabelById(@PathVariable String id) {
        return repository.findById(id).orElse(null);
    }

    @PostMapping("/properties")
    public String generateProperties(@RequestBody List<SLocalizationLabel> labels) {
        StringBuilder sb = new StringBuilder();
        for (SLocalizationLabel label : labels) {
            String key = label.getUserKey() != null ? label.getUserKey() : label.getObjectID();
            String value = label.getCountry1();
            sb.append(key).append("=").append(value).append("\n");
        }
        return sb.toString();
    }
}
