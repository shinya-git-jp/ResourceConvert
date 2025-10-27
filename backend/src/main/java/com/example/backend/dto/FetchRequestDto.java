package com.example.backend.dto;

import java.util.Map;

/**
 * データ取得リクエスト（DB接続情報 + フィルター + ページネーション）を受け取るDTO
 */
public class FetchRequestDto {

    // DB接続設定 (DbConfig に相当)
    private String dbType;
    private String host;
    private int port;
    private String dbName;
    private String username;
    private String password;

    // フィルター条件
    private FilterDto filter;

    // ページネーション情報
    private int page = 0; // デフォルトは0ページ目
    private int size = 50; // デフォルトは1ページあたり50件

    // --- Getters and Setters ---

    public String getDbType() {
        return dbType;
    }

    public void setDbType(String dbType) {
        this.dbType = dbType;
    }

    public String getHost() {
        return host;
    }

    public void setHost(String host) {
        this.host = host;
    }

    public int getPort() {
        return port;
    }

    public void setPort(int port) {
        this.port = port;
    }

    public String getDbName() {
        return dbName;
    }

    public void setDbName(String dbName) {
        this.dbName = dbName;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public FilterDto getFilter() {
        return filter;
    }

    public void setFilter(FilterDto filter) {
        this.filter = filter;
    }

    // --- ページネーション用 Getters and Setters
    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    /**
     * DBConnectionService に渡すためのMapを生成するユーティリティ
     * 
     * @return DB接続情報のMap
     */
    public Map<String, Object> asDbConfigMap() {
        return Map.of(
                "dbType", dbType != null ? dbType : "",
                "host", host != null ? host : "",
                "port", port,
                "dbName", dbName != null ? dbName : "",
                "username", username != null ? username : "",
                "password", password != null ? password : "");
    }
}