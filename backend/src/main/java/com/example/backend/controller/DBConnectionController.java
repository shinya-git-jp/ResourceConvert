package com.example.backend.controller;

import com.example.backend.service.DBConnectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/db")
@CrossOrigin(origins = "http://localhost:5173")
public class DBConnectionController {

    @Autowired
    private DBConnectionService dbService;

    @PostMapping("/test")
    public String testConnection(@RequestBody Map<String, Object> config) {
        try {
            String dbType = (String) config.get("dbType");
            String host = (String) config.get("host");
            int port = ((Number) config.get("port")).intValue();
            String dbName = (String) config.get("dbName");
            String username = (String) config.get("username");
            String password = (String) config.get("password");

            JdbcTemplate jdbc = dbService.createJdbcTemplate(dbType, host, port, dbName, username, password);
            jdbc.queryForObject("SELECT 1", Integer.class); // 軽い接続確認クエリ
            return "接続成功";
        } catch (Exception e) {
            return "接続失敗: " + e.getMessage();
        }
    }
}
