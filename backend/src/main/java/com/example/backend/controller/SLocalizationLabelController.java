package com.example.backend.controller;

import com.example.backend.entity.SLocalizationLabel;
import com.example.backend.repository.SLocalizationLabelRepository;
import com.example.backend.service.DBConnectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/labels")
@CrossOrigin(origins = "http://localhost:5173")
public class SLocalizationLabelController {

    @Autowired
    private SLocalizationLabelRepository repository;

    @Autowired
    private DBConnectionService dbConnectionService;

    // ... (getAllLabels, fetchLabelsFromDynamicDB, getLabelById は変更なし) ...
    @GetMapping
    public List<SLocalizationLabel> getAllLabels() {
        return repository.findAll();
    }

    @PostMapping("/fetch")
    public List<SLocalizationLabel> fetchLabelsFromDynamicDB(@RequestBody Map<String, Object> config) {
        try {
            String dbType = (String) config.get("dbType");
            String host = (String) config.get("host");
            int port = ((Number) config.get("port")).intValue();
            String dbName = (String) config.get("dbName");
            String username = (String) config.get("username");
            String password = (String) config.get("password");

            JdbcTemplate dynamicJdbcTemplate = dbConnectionService.createJdbcTemplate(
                    dbType, host, port, dbName, username, password
            );

            String sql = "SELECT objectID, categoryName, country1, country2, country3, country4, country5 FROM SLocalizationLabel";

            RowMapper<SLocalizationLabel> rowMapper = (rs, rowNum) -> {
                SLocalizationLabel label = new SLocalizationLabel();
                label.setObjectID(rs.getString("objectID"));
                label.setCategoryName(rs.getString("categoryName"));
                label.setCountry1(rs.getString("country1"));
                label.setCountry2(rs.getString("country2"));
                label.setCountry3(rs.getString("country3"));
                label.setCountry4(rs.getString("country4"));
                label.setCountry5(rs.getString("country5"));
                return label;
            };

            return dynamicJdbcTemplate.query(sql, rowMapper);

        } catch (Exception e) {
            throw new RuntimeException("動的DBからのデータ取得に失敗しました: " + e.getMessage(), e);
        }
    }

    @GetMapping("/{id}")
    public SLocalizationLabel getLabelById(@PathVariable String id) {
        return repository.findById(id).orElse(null);
    }

    @PostMapping("/properties")
    public String generateProperties(@RequestBody List<SLocalizationLabel> labels) {
        StringBuilder sb = new StringBuilder();
        for (SLocalizationLabel label : labels) {
            String key = (label.getUserKey() != null && !label.getUserKey().isEmpty())
                    ? label.getUserKey()
                    : label.getObjectID();
            String value = label.getCountry1();
            sb.append(key).append("=").append(value != null ? value : "").append("\n");
        }
        return sb.toString();
    }

    @PostMapping("/properties/download")
    public ResponseEntity<String> downloadPropertiesFile(@RequestBody Map<String, Object> requestData) {
        try {
            @SuppressWarnings("unchecked") 
            List<Map<String, String>> labelsData = (List<Map<String, String>>) requestData.get("labels");
            String langKey = (String) requestData.getOrDefault("lang", "country1");

            if (labelsData == null) {
                return ResponseEntity.badRequest().body("labels data is missing");
            }

            StringBuilder sb = new StringBuilder();
            for (Map<String, String> labelMap : labelsData) {
                String key = labelMap.get("messageId");
                if (key == null || key.trim().isEmpty()) {
                    key = labelMap.get("objectID");
                }
                
                String value = labelMap.getOrDefault(langKey, ""); 
                
                if (key != null && !key.trim().isEmpty()) {
                     sb.append(key).append("=").append(value).append("\n");
                }
            }

            String filename = "output.properties";
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename);
            headers.setContentType(MediaType.valueOf("text/plain;charset=UTF-8"));


            return ResponseEntity.ok()
                    .headers(headers)
                    .body(sb.toString());

        } catch (ClassCastException e) {
             return ResponseEntity.badRequest().body("Invalid request body format: " + e.getMessage());
        } catch (Exception e) {
             System.err.println("Error generating properties file: " + e.getMessage());
             e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error generating properties file");
        }
    }
}