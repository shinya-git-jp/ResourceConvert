package com.example.backend.service;

import com.example.backend.dto.ErrorMessageDto;
import com.example.backend.dto.FilterDto;
import com.example.backend.dto.PagedResponseDto;
import com.example.backend.entity.SError;
import com.example.backend.entity.SLocalization;
import com.example.backend.repository.SErrorRepository;
import com.example.backend.repository.SLocalizationRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.dao.EmptyResultDataAccessException;

import java.util.ArrayList;
import java.util.Collections; // 追加
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ErrorMessageService {

    // 固定DB用
    private final SErrorRepository sErrorRepository;
    private final SLocalizationRepository sLocalizationRepository;

    @Autowired
    private DBConnectionService dbConnectionService; // 動的接続用

    public ErrorMessageService(SErrorRepository sErrorRepository, SLocalizationRepository sLocalizationRepository) {
        this.sErrorRepository = sErrorRepository;
        this.sLocalizationRepository = sLocalizationRepository;
    }

    /**
     * 固定DBから取得
     */
    public List<ErrorMessageDto> getAllErrorMessages() {
        List<SError> errors = sErrorRepository.findAll();
        List<SLocalization> localizations = sLocalizationRepository.findAll();
        return mapErrorsAndLocalizations(errors, localizations);
    }

    /**
     * 動的DBからページング取得
     */
    public PagedResponseDto<ErrorMessageDto> getAllErrorMessagesFromDynamicDB(
            Map<String, Object> config, FilterDto filter, int page, int size) {
        try {
            JdbcTemplate dynamicJdbcTemplate = createDynamicJdbcTemplate(config);
            StringBuilder sqlData = new StringBuilder(
                    "SELECT e.objectID, e.errorNo, e.errorMessageID, e.errorType, l.ObjectID as messageObjectID, l.country1, l.country2, l.country3, l.country4, l.country5 "
                            + "FROM SError e LEFT JOIN SLocalization l ON e.errorMessageID = l.ObjectID ");
            StringBuilder sqlCount = new StringBuilder(
                    "SELECT COUNT(*) FROM SError e LEFT JOIN SLocalization l ON e.errorMessageID = l.ObjectID ");
            StringBuilder whereClause = new StringBuilder("WHERE 1=1");
            List<Object> params = new ArrayList<>();
            buildWhereClauseAndParams(filter, whereClause, params);
            sqlData.append(" ").append(whereClause);
            sqlCount.append(" ").append(whereClause);
            sqlData.append(" ORDER BY e.objectID LIMIT ? OFFSET ?");
            params.add(size);
            params.add(page * size);

            RowMapper<ErrorMessageDto> rowMapper = (rs, rowNum) -> {
                ErrorMessageDto dto = new ErrorMessageDto();
                dto.setObjectID(rs.getString("objectID"));
                dto.setErrorNo(rs.getString("errorNo"));
                dto.setErrorType(rs.getString("errorType"));
                dto.setMessageObjectID(rs.getString("messageObjectID"));
                dto.setCountry1(rs.getString("country1"));
                dto.setCountry2(rs.getString("country2"));
                dto.setCountry3(rs.getString("country3"));
                dto.setCountry4(rs.getString("country4"));
                dto.setCountry5(rs.getString("country5"));
                return dto;
            };

            List<ErrorMessageDto> content = dynamicJdbcTemplate.query(sqlData.toString(), rowMapper, params.toArray());
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
            throw new RuntimeException("動的DBからのエラーメッセージ取得に失敗しました: " + e.getMessage(), e);
        }
    }

    /**
     * フィルター条件に一致するすべての ObjectID を取得
     * 
     * @param config DB接続設定
     * @param filter フィルター条件
     * @return ObjectID のリスト
     */
    public List<String> getAllErrorObjectIDsFromDynamicDB(Map<String, Object> config, FilterDto filter) {
        try {
            JdbcTemplate dynamicJdbcTemplate = createDynamicJdbcTemplate(config);
            StringBuilder sql = new StringBuilder(
                    "SELECT e.objectID FROM SError e LEFT JOIN SLocalization l ON e.errorMessageID = l.ObjectID ");
            StringBuilder whereClause = new StringBuilder("WHERE 1=1");
            List<Object> params = new ArrayList<>();
            buildWhereClauseAndParams(filter, whereClause, params);

            sql.append(" ").append(whereClause);
            sql.append(" ORDER BY e.objectID");
            return dynamicJdbcTemplate.queryForList(sql.toString(), String.class, params.toArray());
        } catch (Exception e) {
            throw new RuntimeException("動的DBからのエラーObjectID取得に失敗: " + e.getMessage(), e);
        }
    }

    /**
     * 指定された ObjectID のリストに一致する ErrorMessageDto を取得
     * 
     * @param config    DB接続設定
     * @param objectIDs 取得対象の ObjectID リスト
     * @return ErrorMessageDto のリスト
     */
    public List<ErrorMessageDto> getErrorMessagesByIdsFromDynamicDB(Map<String, Object> config,
            List<String> objectIDs) {
        if (objectIDs == null || objectIDs.isEmpty()) {
            return Collections.emptyList();
        }
        try {
            JdbcTemplate dynamicJdbcTemplate = createDynamicJdbcTemplate(config);
            StringBuilder sql = new StringBuilder(
                    "SELECT e.objectID, e.errorNo, e.errorMessageID, e.errorType, " +
                            "l.ObjectID as messageObjectID, l.country1, l.country2, l.country3, l.country4, l.country5 "
                            +
                            "FROM SError e LEFT JOIN SLocalization l ON e.errorMessageID = l.ObjectID " +
                            "WHERE e.objectID IN (");

            // IN句のプレースホルダーを生成 (?, ?, ...)
            sql.append(String.join(",", Collections.nCopies(objectIDs.size(), "?")));
            sql.append(") ORDER BY e.objectID");

            RowMapper<ErrorMessageDto> rowMapper = (rs, rowNum) -> {
                ErrorMessageDto dto = new ErrorMessageDto();
                dto.setObjectID(rs.getString("objectID"));
                dto.setErrorNo(rs.getString("errorNo"));
                dto.setErrorType(rs.getString("errorType"));
                dto.setMessageObjectID(rs.getString("messageObjectID"));
                dto.setCountry1(rs.getString("country1"));
                dto.setCountry2(rs.getString("country2"));
                dto.setCountry3(rs.getString("country3"));
                dto.setCountry4(rs.getString("country4"));
                dto.setCountry5(rs.getString("country5"));
                return dto;
            };

            return dynamicJdbcTemplate.query(sql.toString(), rowMapper, objectIDs.toArray());

        } catch (Exception e) {
            throw new RuntimeException("動的DBからのID指定でのエラーメッセージ取得に失敗: " + e.getMessage(), e);
        }
    }

    private List<ErrorMessageDto> mapErrorsAndLocalizations(List<SError> errors, List<SLocalization> localizations) {
        return errors.stream().map(err -> {
            ErrorMessageDto dto = new ErrorMessageDto();
            dto.setObjectID(err.getObjectID());
            dto.setErrorNo(err.getErrorNo());
            dto.setErrorType(err.getErrorType());
            SLocalization loc = localizations.stream().filter(l -> l.getObjectID().equals(err.getErrorMessageID()))
                    .findFirst().orElse(null);
            if (loc != null) {
                dto.setMessageObjectID(loc.getObjectID());
                dto.setCountry1(loc.getCountry1());
                dto.setCountry2(loc.getCountry2());
                dto.setCountry3(loc.getCountry3());
                dto.setCountry4(loc.getCountry4());
                dto.setCountry5(loc.getCountry5());
            }
            return dto;
        }).collect(Collectors.toList());
    }

    /**
     * XML変換ロジック
     */
    public String convertToXml(List<ErrorMessageDto> list, String lang) {
        try {
            StringBuilder sb = new StringBuilder();
            sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<error-messages>\n");
            for (ErrorMessageDto dto : list) {
                String type;
                switch (dto.getErrorType()) {
                    case "1":
                        type = "error";
                        break;
                    case "2":
                        type = "warning";
                        break;
                    case "3":
                    case "4":
                        type = "info";
                        break;
                    default:
                        type = "info";
                }
                String message = switch (lang) {
                    case "country1" -> dto.getCountry1();
                    case "country2" -> dto.getCountry2();
                    case "country3" -> dto.getCountry3();
                    case "country4" -> dto.getCountry4();
                    case "country5" -> dto.getCountry5();
                    default -> dto.getCountry1();
                };
                String safeMessage = (message != null) ? message : "";
                safeMessage = safeMessage.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                        .replace("\"", "&quot;").replace("'", "&apos;");
                sb.append(String.format("  <error code=\"%s\">\n", dto.getErrorNo()));
                sb.append(String.format("    <type>%s</type>\n", type));
                sb.append(String.format("    <message>%s</message>\n", safeMessage));
                sb.append("  </error>\n");
            }
            sb.append("</error-messages>");
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("XML変換に失敗しました", e);
        }
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
                whereClause.append(" AND e.objectID LIKE ?");
                params.add("%" + filter.getObjectID() + "%");
            }
            if (filter.getErrorNo() != null && !filter.getErrorNo().isEmpty()) {
                whereClause.append(" AND e.errorNo LIKE ?");
                params.add("%" + filter.getErrorNo() + "%");
            }
            if (filter.getErrorType() != null && !filter.getErrorType().isEmpty()) {
                whereClause.append(" AND e.errorType LIKE ?");
                params.add("%" + filter.getErrorType() + "%");
            }
            if (filter.getMessage() != null && !filter.getMessage().isEmpty()) {
                whereClause.append(
                        " AND (l.country1 LIKE ? OR l.country2 LIKE ? OR l.country3 LIKE ? OR l.country4 LIKE ? OR l.country5 LIKE ?)");
                String messageLike = "%" + filter.getMessage() + "%";
                for (int i = 0; i < 5; i++) {
                    params.add(messageLike);
                }
            }
        }
    }
}