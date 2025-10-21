package com.example.backend.controller;

import com.example.backend.entity.SLocalizationLabel;
import com.example.backend.repository.SLocalizationLabelRepository;
import com.example.backend.service.DBConnectionService; // 追加
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate; // 追加
import org.springframework.jdbc.core.RowMapper; // 追加
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map; // DbConfig の受け取り用

@RestController
@RequestMapping("/api/labels")
@CrossOrigin(origins = "http://localhost:5173")
public class SLocalizationLabelController {

    @Autowired
    private SLocalizationLabelRepository repository; // 既存の固定DB用

    @Autowired
    private DBConnectionService dbConnectionService; // 動的接続用サービス

    /**
     * 既存：固定DBから全件取得
     */
    @GetMapping
    public List<SLocalizationLabel> getAllLabels() {
        return repository.findAll();
    }

    /**
     * 新規：動的DBからデータを取得
     * @param config フロントから送信される DbConfig
     */
    @PostMapping("/fetch")
    public List<SLocalizationLabel> fetchLabelsFromDynamicDB(@RequestBody Map<String, Object> config) {
        try {
            // フロントからのJSON (DbConfig) をパース
            String dbType = (String) config.get("dbType");
            String host = (String) config.get("host");
            int port = ((Number) config.get("port")).intValue();
            String dbName = (String) config.get("dbName");
            String username = (String) config.get("username");
            String password = (String) config.get("password");

            // 1. 動的に JdbcTemplate を生成
            JdbcTemplate dynamicJdbcTemplate = dbConnectionService.createJdbcTemplate(
                    dbType, host, port, dbName, username, password
            );

            // 2. SLocalizationLabel テーブルからデータを取得するクエリ
            // (テーブル名は SLocalizationLabel.java の @Table(name = "SLocalizationLabel") を参照)
            String sql = "SELECT objectID, categoryName, country1, country2, country3, country4, country5 FROM SLocalizationLabel";

            // 3. RowMapper で SLocalizationLabel エンティティにマッピング
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
            // 本来は専用の例外クラスと @ExceptionHandler で処理すべき
            throw new RuntimeException("動的DBからのデータ取得に失敗しました: " + e.getMessage(), e);
        }
    }


    // 既存：ID検索 (固定DB)
    @GetMapping("/{id}")
    public SLocalizationLabel getLabelById(@PathVariable String id) {
        return repository.findById(id).orElse(null);
    }

    /**
     * 既存：プロパティ生成
     * このエンドポイントは MessageResourceConvert.tsx から呼び出されます。
     * MessageResourceConvert.tsx は、MessageResourceDisplay (改修版) から
     * navigate state で受け取ったデータを body に詰めて POST するため、
     * このメソッド自体はDB接続を意識しません。
     * * ただし、フロント側 とバックエンド で
     * ユーザー定義IDのキー名が異なっています (messageId と userKey)。
     * フロント側(MessageResourceConvert.tsx)が送信時に userKey にマッピングするか、
     * こちら(バックエンド)が messageId を受け取れるよう DTO を使う修正が望ましいですが、
     * ここでは SLocalizationLabelController.java の既存ロジックを維持します。
     * (※MessageResourceConvert.tsx 側での `userKey: label.messageId` の追加を推奨します)
     */
    @PostMapping("/properties")
    public String generateProperties(@RequestBody List<SLocalizationLabel> labels) {
        StringBuilder sb = new StringBuilder();
        for (SLocalizationLabel label : labels) {
            // 既存ロジック
            String key = (label.getUserKey() != null && !label.getUserKey().isEmpty())
                    ? label.getUserKey()
                    : label.getObjectID();
            // country1 にはフロント で選択された言語の値がセットされてくる
            String value = label.getCountry1(); 
            sb.append(key).append("=").append(value != null ? value : "").append("\n");
        }
        return sb.toString();
    }
}