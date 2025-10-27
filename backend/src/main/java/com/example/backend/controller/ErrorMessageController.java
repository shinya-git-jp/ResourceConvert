package com.example.backend.controller;

import com.example.backend.dto.ErrorMessageDto;
import com.example.backend.service.ErrorMessageService;
import com.example.backend.dto.FetchRequestDto;
import com.example.backend.dto.PagedResponseDto;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class ErrorMessageController {

    private final ErrorMessageService service;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ErrorMessageController(ErrorMessageService service) {
        this.service = service;
    }

    @GetMapping("/api/error-messages")
    public List<ErrorMessageDto> getErrorMessages() {
        return service.getAllErrorMessages();
    }

    @PostMapping("/api/error-messages/fetch")
    public PagedResponseDto<ErrorMessageDto> fetchErrorMessages(@RequestBody FetchRequestDto request) {
        return service.getAllErrorMessagesFromDynamicDB(
                request.asDbConfigMap(), request.getFilter(), request.getPage(), request.getSize());
    }

    /**
     * フィルター条件に一致するすべての ObjectID を取得
     */
    @PostMapping("/api/error-messages/fetch/ids")
    public List<String> fetchAllErrorObjectIDs(@RequestBody FetchRequestDto request) {
        try {
            return service.getAllErrorObjectIDsFromDynamicDB(request.asDbConfigMap(), request.getFilter());
        } catch (Exception e) {
            System.err.println("Error fetching all error object IDs: " + e.getMessage());
            e.printStackTrace();
            return Collections.emptyList();
        }
    }

    @PostMapping("/api/error-messages/fetch/by-ids")
    public List<ErrorMessageDto> fetchErrorMessagesByIds(@RequestBody Map<String, Object> requestData) {
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

            return service.getErrorMessagesByIdsFromDynamicDB(dbConfigMap, objectIDs);

        } catch (Exception e) {
            System.err.println("Error fetching error messages by IDs: " + e.getMessage());
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

    @GetMapping("/api/error-messages/xml")
    public ResponseEntity<String> downloadErrorMessagesXml(
            @RequestParam(defaultValue = "country1") String lang,
            @RequestParam(required = false) String filename) {
        List<ErrorMessageDto> list = service.getAllErrorMessages();
        String xml = service.convertToXml(list, lang);
        if (filename == null || filename.isEmpty()) {
            filename = "output.xml";
        } else if (!filename.endsWith(".xml")) {
            filename += ".xml";
        }
        return createXmlResponse(xml, filename);
    }

    @PostMapping("/api/error-messages/xml/download")
    public ResponseEntity<String> downloadXmlFromSelectedData(@RequestBody Map<String, Object> requestData) {
        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> messagesData = (List<Map<String, Object>>) requestData.get("messages");
            String lang = (String) requestData.getOrDefault("lang", "country1");
            String filename = "output.xml";
            if (messagesData == null) {
                return ResponseEntity.badRequest().body("messages data is missing");
            }
            List<ErrorMessageDto> messageDtos = objectMapper.convertValue(messagesData,
                    new TypeReference<List<ErrorMessageDto>>() {
                    });
            String xml = service.convertToXml(messageDtos, lang);
            return createXmlResponse(xml, filename);
        } catch (Exception e) {
            System.err.println("Error generating XML file from selected data: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error generating XML file: " + e.getMessage());
        }
    }

    private ResponseEntity<String> createXmlResponse(String xmlBody, String filename) {
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
        headers.setContentType(MediaType.APPLICATION_XML);
        return ResponseEntity.ok().headers(headers).body(xmlBody);
    }
}