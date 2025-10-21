package com.example.backend.controller;

import com.example.backend.dto.ErrorMessageDto;
import com.example.backend.service.ErrorMessageService;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping; // 追加
import org.springframework.web.bind.annotation.RequestBody; // 追加
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map; // 追加

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class ErrorMessageController {

    private final ErrorMessageService service;

    public ErrorMessageController(ErrorMessageService service) {
        this.service = service;
    }

    // 既存：固定DBから全件取得
    @GetMapping("/api/error-messages")
    public List<ErrorMessageDto> getErrorMessages() {
        return service.getAllErrorMessages();
    }

    // 新規：動的DBから全件取得
    @PostMapping("/api/error-messages/fetch")
    public List<ErrorMessageDto> fetchErrorMessages(@RequestBody Map<String, Object> config) {
        return service.getAllErrorMessagesFromDynamicDB(config);
    }


    // 既存：XMLダウンロード (固定DB)
    @GetMapping("/api/error-messages/xml")
    public ResponseEntity<String> downloadErrorMessagesXml(
            @RequestParam(defaultValue = "country1") String lang,
            @RequestParam(required = false) String filename) {

        // DTO取得 (固定DBから)
        List<ErrorMessageDto> list = service.getAllErrorMessages();

        // ServiceのXML変換メソッド呼び出し
        String xml = service.convertToXml(list, lang);

        // ファイル名処理
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
    
    // TODO: 
    // ErrorMessageConvert.tsx のダウンロード処理 も
    // 動的DB接続に対応させる場合、
    // /api/error-messages/xml (GET) ではなく、
    // DB接続情報(config)をPOSTで受け取り、その接続で
    // データを取得・XML変換する新しいエンドポイント (例: /api/error-messages/xml/fetch (POST))
    // が必要になります。
}