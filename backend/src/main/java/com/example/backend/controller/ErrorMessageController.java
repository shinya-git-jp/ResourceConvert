package com.example.backend.controller;

import com.example.backend.dto.ErrorMessageDto;
import com.example.backend.service.ErrorMessageService;

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
    public List<ErrorMessageDto> fetchErrorMessages(@RequestBody Map<String, Object> config) {
        return service.getAllErrorMessagesFromDynamicDB(config);
    }

    @GetMapping("/api/error-messages/xml")
    public ResponseEntity<String> downloadErrorMessagesXml(
            @RequestParam(defaultValue = "country1") String lang,
            @RequestParam(required = false) String filename) {
        List<ErrorMessageDto> list = service.getAllErrorMessages(); // 固定DBから取得
        String xml = service.convertToXml(list, lang);
        if (filename == null || filename.isEmpty()) {
            filename = "output.xml";
        } else if (!filename.endsWith(".xml")) {
            filename += ".xml";
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.APPLICATION_XML)
                .body(xml);
    }

    @PostMapping("/api/error-messages/xml/download")
    public ResponseEntity<String> downloadXmlFromData(@RequestBody Map<String, Object> requestData) {
        try {
            // リクエストボディから messages リストと lang を取得
             @SuppressWarnings("unchecked")
            List<Map<String, Object>> messagesData = (List<Map<String, Object>>) requestData.get("messages");
            String lang = (String) requestData.getOrDefault("lang", "country1");

            if (messagesData == null) {
                 return ResponseEntity.badRequest().body("messages data is missing");
            }

            // List<Map<String, Object>> を List<ErrorMessageDto> に変換
            // ObjectMapper を使って Map を DTO にマッピング
            List<ErrorMessageDto> messageDtos = objectMapper.convertValue(
                messagesData,
                new TypeReference<List<ErrorMessageDto>>() {}
            );

            // ErrorMessageService の既存メソッドで XML 文字列を生成
            String xml = service.convertToXml(messageDtos, lang);

            String filename = "output.xml";
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename);
            headers.setContentType(MediaType.APPLICATION_XML); // XML 用の Content-Type

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(xml);

        } catch (Exception e) {
             System.err.println("Error generating XML file: " + e.getMessage());
             e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error generating XML file: " + e.getMessage());
        }
    }
}