package com.example.backend.service;

import com.example.backend.dto.ErrorMessageDto;
import com.example.backend.entity.SError;
import com.example.backend.entity.SLocalization;
import com.example.backend.repository.SErrorRepository;
import com.example.backend.repository.SLocalizationRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ErrorMessageService {

    private final SErrorRepository sErrorRepository;
    private final SLocalizationRepository sLocalizationRepository;

    public ErrorMessageService(SErrorRepository sErrorRepository, SLocalizationRepository sLocalizationRepository) {
        this.sErrorRepository = sErrorRepository;
        this.sLocalizationRepository = sLocalizationRepository;
    }

    public List<ErrorMessageDto> getAllErrorMessages() {
        List<SError> errors = sErrorRepository.findAll();
        List<SLocalization> localizations = sLocalizationRepository.findAll();

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

    public String convertToXml(List<ErrorMessageDto> list, String lang) {
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

                sb.append(String.format("\t<error code=\"%s\">\n", dto.getErrorNo()));
                sb.append(String.format("\t\t<type>%s</type>\n", type));
                sb.append(String.format("\t\t<message>%s</message>\n", message != null ? message : ""));
                sb.append("\t</error>\n");
            }

            sb.append("</error-messages>");
            return sb.toString();

        } catch (Exception e) {
            throw new RuntimeException("XML変換に失敗しました", e);
        }
    }

}
