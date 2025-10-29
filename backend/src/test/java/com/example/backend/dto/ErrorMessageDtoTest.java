package com.example.backend.dto;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 * ErrorMessageDto クラスのテスト
 */
public class ErrorMessageDtoTest {

    /*
     * [1] Setter/Getterのテスト
     * [1-1] 各フィールドに値を設定し、Getterで正しく取得できること <br>
     * [1-2] 未設定のフィールドは、初期値がnullであること
     */
    @Test
    void testGetterSetter() {
        // [1-1]
        ErrorMessageDto dto = new ErrorMessageDto();

        dto.setObjectID("ERR001");
        dto.setErrorNo("E-001");
        dto.setErrorType("1");
        dto.setMessageObjectID("MSG001");
        dto.setCountry1("Error message in English");
        dto.setCountry2("日本語のエラーメッセージ");
        dto.setCountry3("Mensaje de error en español");
        dto.setCountry4("Message d'erreur en français");
        dto.setCountry5("Fehlermeldung auf Deutsch");

        assertEquals("ERR001", dto.getObjectID());
        assertEquals("E-001", dto.getErrorNo());
        assertEquals("1", dto.getErrorType());
        assertEquals("MSG001", dto.getMessageObjectID());
        assertEquals("Error message in English", dto.getCountry1());
        assertEquals("日本語のエラーメッセージ", dto.getCountry2());
        assertEquals("Mensaje de error en español", dto.getCountry3());
        assertEquals("Message d'erreur en français", dto.getCountry4());
        assertEquals("Fehlermeldung auf Deutsch", dto.getCountry5());

        // [1-2]
        ErrorMessageDto dtoUnset = new ErrorMessageDto();

        assertNull(dtoUnset.getObjectID());
        assertNull(dtoUnset.getErrorNo());
        assertNull(dtoUnset.getErrorType());
        assertNull(dtoUnset.getMessageObjectID());
        assertNull(dtoUnset.getCountry1());
        assertNull(dtoUnset.getCountry2());
        assertNull(dtoUnset.getCountry3());
        assertNull(dtoUnset.getCountry4());
        assertNull(dtoUnset.getCountry5());
    }
}