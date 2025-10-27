package com.example.backend.service;

import com.example.backend.dto.FilterDto;
import com.example.backend.dto.PagedResponseDto;
import com.example.backend.entity.SLocalizationLabel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.dao.EmptyResultDataAccessException;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
// import java.util.stream.Collectors;

@Service
public class SLocalizationLabelService {

    @Autowired
    private DBConnectionService dbConnectionService;

    // 動的DBからラベルをページング取得
    public PagedResponseDto<SLocalizationLabel> getAllLabelsFromDynamicDB(
            Map<String, Object> config, FilterDto filter, int page, int size) {
        try {
            JdbcTemplate dynamicJdbcTemplate = createDynamicJdbcTemplate(config);
            StringBuilder sqlData = new StringBuilder(
                    "SELECT objectID, categoryName, country1, country2, country3, country4, country5 FROM SLocalizationLabel ");
            StringBuilder sqlCount = new StringBuilder("SELECT COUNT(*) FROM SLocalizationLabel ");
            StringBuilder whereClause = new StringBuilder("WHERE 1=1");
            List<Object> params = new ArrayList<>();
            buildWhereClauseAndParams(filter, whereClause, params);
            sqlData.append(" ").append(whereClause);
            sqlCount.append(" ").append(whereClause);
            sqlData.append(" ORDER BY objectID LIMIT ? OFFSET ?");
            params.add(size);
            params.add(page * size);
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
            List<SLocalizationLabel> content = dynamicJdbcTemplate.query(sqlData.toString(), rowMapper,
                    params.toArray());
            List<Object> countParams = params.subList(0, params.size() - 2);
            long totalElements = 0;
            try {
                Long countResult = dynamicJdbcTemplate.queryForObject(sqlCount.toString(), Long.class,
                        countParams.toArray());
                totalElements = (countResult != null) ? countResult : 0L;
            } catch (EmptyResultDataAccessException | NullPointerException e) {
                totalElements = 0L;
            }
            return new PagedResponseDto<>(content, totalElements);
        } catch (Exception e) {
            throw new RuntimeException("動的DBからのラベルデータ取得に失敗しました: " + e.getMessage(), e);
        }
    }

    // フィルター条件に一致するすべての ObjectID を取得
    public List<String> getAllLabelObjectIDsFromDynamicDB(Map<String, Object> config, FilterDto filter) {
        try {
            JdbcTemplate dynamicJdbcTemplate = createDynamicJdbcTemplate(config);
            StringBuilder sql = new StringBuilder("SELECT objectID FROM SLocalizationLabel ");
            StringBuilder whereClause = new StringBuilder("WHERE 1=1");
            List<Object> params = new ArrayList<>();
            buildWhereClauseAndParams(filter, whereClause, params);

            sql.append(" ").append(whereClause);
            sql.append(" ORDER BY objectID");

            return dynamicJdbcTemplate.queryForList(sql.toString(), String.class, params.toArray());
        } catch (Exception e) {
            throw new RuntimeException("動的DBからのラベルObjectID取得に失敗: " + e.getMessage(), e);
        }
    }

    // 指定された ObjectID のリストに一致する SLocalizationLabel を取得
    public List<SLocalizationLabel> getLabelsByIdsFromDynamicDB(Map<String, Object> config, List<String> objectIDs) {
        if (objectIDs == null || objectIDs.isEmpty()) {
            return Collections.emptyList();
        }
        try {
            JdbcTemplate dynamicJdbcTemplate = createDynamicJdbcTemplate(config);
            StringBuilder sql = new StringBuilder(
                    "SELECT objectID, categoryName, country1, country2, country3, country4, country5 " +
                            "FROM SLocalizationLabel " +
                            "WHERE objectID IN (" +
                            String.join(",", Collections.nCopies(objectIDs.size(), "?")) +
                            ") ORDER BY objectID");

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

            return dynamicJdbcTemplate.query(sql.toString(), rowMapper, objectIDs.toArray());

        } catch (Exception e) {
            throw new RuntimeException("動的DBからのID指定でのラベル取得に失敗: " + e.getMessage(), e);
        }
    }

    // Properties変換ロジック
    public String convertToProperties(List<SLocalizationLabel> labels, String langKey) {
        StringBuilder sb = new StringBuilder();
        for (SLocalizationLabel label : labels) {
            String key = label.getObjectID();
            if (label.getUserKey() != null && !label.getUserKey().trim().isEmpty()) {
                key = label.getUserKey();
            }
            String value = switch (langKey) {
                case "country1" -> label.getCountry1();
                case "country2" -> label.getCountry2();
                case "country3" -> label.getCountry3();
                case "country4" -> label.getCountry4();
                case "country5" -> label.getCountry5();
                default -> label.getCountry1();
            };
            String safeValue = (value != null) ? value : "";
            key = key.replace("=", "\\=").replace(":", "\\:").replace("#", "\\#").replace("!", "\\!")
                    .replace("\n", "\\n").replace("\r", "\\r");
            safeValue = safeValue.replace("\\", "\\\\").replace("=", "\\=").replace(":", "\\:").replace("#", "\\#")
                    .replace("!", "\\!").replace("\n", "\\n").replace("\r", "\\r");
            if (key != null && !key.trim().isEmpty()) {
                sb.append(key).append("=").append(safeValue).append("\n");
            }
        }
        return sb.toString();
    }

    private JdbcTemplate createDynamicJdbcTemplate(Map<String, Object> config) {
        String dbType = (String) config.get("dbType");
        String host = (String) config.get("host");
        int port = ((Number) config.get("port")).intValue();
        String dbName = (String) config.get("dbName");
        String username = (String) config.get("username");
        String password = (String) config.get("password");
        return dbConnectionService.createJdbcTemplate(dbType, host, port, dbName, username, password);
    }

    private void buildWhereClauseAndParams(FilterDto filter, StringBuilder whereClause, List<Object> params) {
        if (filter != null) {
            if (filter.getObjectID() != null && !filter.getObjectID().isEmpty()) {
                whereClause.append(" AND objectID LIKE ?");
                params.add("%" + filter.getObjectID() + "%");
            }
            if (filter.getCategoryName() != null && !filter.getCategoryName().isEmpty()) {
                whereClause.append(" AND categoryName LIKE ?");
                params.add("%" + filter.getCategoryName() + "%");
            }
            if (filter.getMessage() != null && !filter.getMessage().isEmpty()) {
                whereClause.append(
                        " AND (country1 LIKE ? OR country2 LIKE ? OR country3 LIKE ? OR country4 LIKE ? OR country5 LIKE ?)");
                String messageLike = "%" + filter.getMessage() + "%";
                for (int i = 0; i < 5; i++) {
                    params.add(messageLike);
                }
            }
        }
    }
}