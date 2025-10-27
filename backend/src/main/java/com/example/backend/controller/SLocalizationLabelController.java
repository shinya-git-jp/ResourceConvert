package com.example.backend.controller;

import com.example.backend.entity.SLocalizationLabel;
import com.example.backend.service.SLocalizationLabelService;
import com.example.backend.dto.FetchRequestDto;
import com.example.backend.dto.PagedResponseDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/labels")
@CrossOrigin(origins = "http://localhost:5173")
public class SLocalizationLabelController {

    @Autowired
    private SLocalizationLabelService service;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 動的DBからページング取得
     */
    @PostMapping("/fetch")
    public PagedResponseDto<SLocalizationLabel> fetchLabelsFromDynamicDB(@RequestBody FetchRequestDto request) {
        try {
            return service.getAllLabelsFromDynamicDB(
                    request.asDbConfigMap(), request.getFilter(), request.getPage(), request.getSize());
        } catch (Exception e) {
            System.err.println("動的DBからのデータ取得に失敗しました: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("動的DBからのデータ取得に失敗しました: " + e.getMessage(), e);
        }
    }

    /**
     * フィルター条件に一致するすべての ObjectID を取得
     */
    @PostMapping("/fetch/ids")
    public List<String> fetchAllLabelObjectIDs(@RequestBody FetchRequestDto request) {
        try {
            Map<String, Object> configMap = request.asDbConfigMap();
            if (configMap.values().stream()
                    .anyMatch(v -> v == null && !"password".equals(getKeyByValue(configMap, v)))) {
                throw new IllegalArgumentException("dbConfig contains null values");
            }
            return service.getAllLabelObjectIDsFromDynamicDB(configMap, request.getFilter());
        } catch (Exception e) {
            System.err.println("Error fetching all label object IDs: " + e.getMessage());
            e.printStackTrace();
            return Collections.emptyList();
        }
    }

    private static <K, V> K getKeyByValue(Map<K, V> map, V value) {
        for (Map.Entry<K, V> entry : map.entrySet()) {
            if (value == null ? entry.getValue() == null : value.equals(entry.getValue())) {
                return entry.getKey();
            }
        }
        return null;
    }

    // ObjectID のリストに基づいて SLocalizationLabel を取得
    @PostMapping("/fetch/by-ids")
    public List<SLocalizationLabel> fetchLabelsByIds(@RequestBody Map<String, Object> requestData) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> dbConfigMap = (Map<String, Object>) requestData.get("dbConfig");
            @SuppressWarnings("unchecked")
            List<String> objectIDs = (List<String>) requestData.get("objectIDs");

            if (dbConfigMap == null || objectIDs == null) {
                throw new IllegalArgumentException("dbConfig or objectIDs missing in request body");
            }
            if (dbConfigMap.values().stream()
                    .anyMatch(v -> v == null && !"password".equals(getKeyByValue(dbConfigMap, v)))) {
                throw new IllegalArgumentException("dbConfig contains null values");
            }

            return service.getLabelsByIdsFromDynamicDB(dbConfigMap, objectIDs);
        } catch (Exception e) {
            System.err.println("Error fetching labels by IDs: " + e.getMessage());
            e.printStackTrace(); // スタックトレース出力
            return Collections.emptyList();
        }
    }

    // フロントから送られた選択データからのProperties生成・ダウンロード\
    @PostMapping("/properties/download")
    public ResponseEntity<String> downloadPropertiesFile(@RequestBody Map<String, Object> requestData) {
        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> labelsData = (List<Map<String, Object>>) requestData.get("labels");
            String langKey = (String) requestData.getOrDefault("lang", "country1");
            String filename = "output.properties";
            if (labelsData == null) {
                return ResponseEntity.badRequest().body("labels data is missing");
            }
            List<SLocalizationLabel> labelDtos = objectMapper.convertValue(labelsData,
                    new TypeReference<List<SLocalizationLabel>>() {
                    });
            String propertiesContent = service.convertToProperties(labelDtos, langKey);
            return createPropertiesResponse(propertiesContent, filename);
        } catch (Exception e) {
            System.err.println("Error generating properties file from selected data: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error generating properties file");
        }
    }

    // Propertiesレスポンス生成の共通処理
    private ResponseEntity<String> createPropertiesResponse(String propertiesBody, String filename) {
        HttpHeaders headers = new HttpHeaders();
        String encodedFilename = filename;
        try {
            encodedFilename = java.net.URLEncoder.encode(filename, java.nio.charset.StandardCharsets.UTF_8.toString())
                    .replace("+", "%20");
        } catch (java.io.UnsupportedEncodingException e) {
            System.err.println("Filename encoding failed: " + e.getMessage());
        }
        headers.add(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"" + filename + "\"; filename*=UTF-8''" + encodedFilename);
        headers.setContentType(MediaType.valueOf("text/plain;charset=UTF-8"));
        return ResponseEntity.ok().headers(headers).body(propertiesBody);
    }
}