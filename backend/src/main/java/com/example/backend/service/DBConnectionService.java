package com.example.backend.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.stereotype.Service;

@Service
public class DBConnectionService {
    /**
     * ユーザー入力値から JdbcTemplate を生成
     *
     * @param dbType   データベース種別（MySQL, PostgreSQLなど）
     * @param host     ホスト名
     * @param port     ポート番号
     * @param dbName   データベース名
     * @param username ユーザー名
     * @param password パスワード
     * @return JdbcTemplate
     */
    public JdbcTemplate createJdbcTemplate(String dbType,
            String host,
            int port,
            String dbName,
            String username,
            String password) {
        DriverManagerDataSource dataSource = new DriverManagerDataSource();

        // JDBC URLをDBタイプごとに作成
        String url = switch (dbType) {
            case "MySQL" -> "jdbc:mysql://" + host + ":" + port + "/" + dbName + "?useSSL=false&serverTimezone=UTC";
            case "PostgreSQL" -> "jdbc:postgresql://" + host + ":" + port + "/" + dbName;
            case "Oracle" -> "jdbc:oracle:thin:@" + host + ":" + port + ":" + dbName;
            case "SQLServer" -> "jdbc:sqlserver://" + host + ":" + port + ";databaseName=" + dbName;
            default -> throw new IllegalArgumentException("Unsupported DB type: " + dbType);
        };

        // ドライバ設定
        dataSource.setDriverClassName(
                switch (dbType) {
                    case "MySQL" -> "com.mysql.cj.jdbc.Driver";
                    case "PostgreSQL" -> "org.postgresql.Driver";
                    case "Oracle" -> "oracle.jdbc.driver.OracleDriver";
                    case "SQLServer" -> "com.microsoft.sqlserver.jdbc.SQLServerDriver";
                    default -> throw new IllegalArgumentException("Unsupported DB type: " + dbType);
                });

        dataSource.setUrl(url);
        dataSource.setUsername(username);
        dataSource.setPassword(password);

        return new JdbcTemplate(dataSource);
    }



    
}
