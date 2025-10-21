package com.example.backend.service;

import com.example.backend.dto.ErrorMessageDto;
import com.example.backend.entity.SError;
import com.example.backend.entity.SLocalization;
import com.example.backend.repository.SErrorRepository;
import com.example.backend.repository.SLocalizationRepository;

import org.springframework.beans.factory.annotation.Autowired; // 追加
import org.springframework.jdbc.core.JdbcTemplate; // 追加
import org.springframework.jdbc.core.RowMapper; // 追加
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map; // 追加
import java.util.stream.Collectors;

@Service
public class ErrorMessageService {

    // 既存：固定DB用
    private final SErrorRepository sErrorRepository;
    private final SLocalizationRepository sLocalizationRepository;

    @Autowired
    private DBConnectionService dbConnectionService; // 動的接続用

    public ErrorMessageService(SErrorRepository sErrorRepository, SLocalizationRepository sLocalizationRepository) {
        this.sErrorRepository = sErrorRepository;
        this.sLocalizationRepository = sLocalizationRepository;
    }

    /**
     * 既存：固定DBから取得
     */
    public List<ErrorMessageDto> getAllErrorMessages() {
        List<SError> errors = sErrorRepository.findAll();
        List<SLocalization> localizations = sLocalizationRepository.findAll();
        return mapErrorsAndLocalizations(errors, localizations);
    }

    /**
     * 新規：動的DBから取得
     * @param config フロントから渡されるDB接続設定 (DbConfig)
     * @return ErrorMessageDto のリスト
     */
    public List<ErrorMessageDto> getAllErrorMessagesFromDynamicDB(Map<String, Object> config) {
        try {
            // 1. config から JdbcTemplate を生成
            String dbType = (String) config.get("dbType");
            String host = (String) config.get("host");
            int port = ((Number) config.get("port")).intValue();
            String dbName = (String) config.get("dbName");
            String username = (String) config.get("username");
            String password = (String) config.get("password");

            JdbcTemplate dynamicJdbcTemplate = dbConnectionService.createJdbcTemplate(
                    dbType, host, port, dbName, username, password
            );

            // 2. SError と SLocalization からデータを取得
            // (JPAリポジトリの findAll() の代替)

            // SError テーブル取得
            String errorSql = "SELECT objectID, errorNo, errorMessageID, errorType FROM SError"; // 必要なカラムのみ
            RowMapper<SError> errorRowMapper = (rs, rowNum) -> {
                SError err = new SError();
                err.setObjectID(rs.getString("objectID"));
                err.setErrorNo(rs.getString("errorNo"));
                err.setErrorMessageID(rs.getString("errorMessageID"));
                err.setErrorType(rs.getString("errorType"));
                return err;
            };
            List<SError> errors = dynamicJdbcTemplate.query(errorSql, errorRowMapper);

            // SLocalization テーブル取得
            String locSql = "SELECT ObjectID, country1, country2, country3, country4, country5 FROM SLocalization";
             RowMapper<SLocalization> locRowMapper = (rs, rowNum) -> {
                SLocalization loc = new SLocalization();
                loc.setObjectID(rs.getString("ObjectID"));
                loc.setCountry1(rs.getString("country1"));
                loc.setCountry2(rs.getString("country2"));
                loc.setCountry3(rs.getString("country3"));
                loc.setCountry4(rs.getString("country4"));
                loc.setCountry5(rs.getString("country5"));
                return loc;
            };
            List<SLocalization> localizations = dynamicJdbcTemplate.query(locSql, locRowMapper);

            // 3. 既存のロジック でマッピング
            return mapErrorsAndLocalizations(errors, localizations);

        } catch (Exception e) {
            throw new RuntimeException("動的DBからのエラーメッセージ取得に失敗しました: " + e.getMessage(), e);
        }
    }


    /**
     * 共通ロジック：SError と SLocalization を ErrorMessageDto にマッピング
     * (既存の getAllErrorMessages() から抽出)
     */
    private List<ErrorMessageDto> mapErrorsAndLocalizations(List<SError> errors, List<SLocalization> localizations) {
         return errors.stream().map(err -> {
            ErrorMessageDto dto = new ErrorMessageDto();
            dto.setObjectID(err.getObjectID());
            dto.setErrorNo(err.getErrorNo());
            dto.setErrorType(err.getErrorType());

            SLocalization loc = localizations.stream()
                    .filter(l -> l.getObjectID().equals(err.getErrorMessageID()))
                    .findFirst()
                    .orElse(null);

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
     * XML変換ロジック (これはDB接続に依存しないので変更不要)
     */
    public String convertToXml(List<ErrorMessageDto> list, String lang) {
        // ... (既存のロジック)
        try {
            StringBuilder sb = new StringBuilder();
            sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
            sb.append("<error-messages>\n");

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
                        type = "error"; // デフォルト
                }

                // 選択言語の取得
                String message = switch (lang) {
                    case "country1" -> dto.getCountry1();
                    case "country2" -> dto.getCountry2();
                    case "country3" -> dto.getCountry3();
                    case "country4" -> dto.getCountry4();
                    case "country5" -> dto.getCountry5();
                    default -> dto.getCountry1();
                };
                
                // メッセージが null の場合に "null" 文字列でなく空文字にする (元コード の潜在的改善)
                String safeMessage = (message != null) ? message : "";

                sb.append(String.format("\t<error code=\"%s\">\n", dto.getErrorNo()));
                sb.append(String.format("\t\t<type>%s</type>\n", type));
                sb.append(String.format("\t\t<message>%s</message>\n", safeMessage));
                sb.append("\t</error>\n");
            }

            sb.append("</error-messages>");
            return sb.toString();

        } catch (Exception e) {
            throw new RuntimeException("XML変換に失敗しました", e);
        }
    }
}