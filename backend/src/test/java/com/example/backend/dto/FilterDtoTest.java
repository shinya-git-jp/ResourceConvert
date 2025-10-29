package com.example.backend.dto;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class FilterDtoTest {
    /*
     * [1] Setter/Getterのテスト
     * [1-1] 各フィールドに値を設定し、Getterで正しく取得できること <br>
     * [1-2] 未設定のフィールドは、初期値がnullであること
     */
    @Test
    void testGetterSetter() {
        // [1-1]
        FilterDto dto = new FilterDto();

        dto.setObjectID("12345");
        dto.setMessage("test");
        dto.setCategoryName("category");
        dto.setErrorNo("TEST-001");
        dto.setErrorType("error");

        assertEquals("12345", dto.getObjectID());
        assertEquals("test", dto.getMessage());
        assertEquals("category", dto.getCategoryName());
        assertEquals("TEST-001", dto.getErrorNo());
        assertEquals("error", dto.getErrorType());

        // [1-2]
        FilterDto dtoUnset = new FilterDto();

        assertNull(dtoUnset.getObjectID());
        assertNull(dtoUnset.getMessage());
        assertNull(dtoUnset.getCategoryName());
        assertNull(dtoUnset.getErrorNo());
        assertNull(dtoUnset.getErrorType());
    }
}
