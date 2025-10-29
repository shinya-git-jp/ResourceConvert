package com.example.backend.dto;

import org.junit.jupiter.api.Test;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

public class FetchRequestDtoTest {
    /*
     * [1] Setter/Getterのテスト
     * [1-1] 各フィールドに値を設定し、Getterで正しく取得できること <br>
     * [1-2] 未設定のフィールドはnull, またはデフォルト値が取得できること
     */
    @Test
    void testGetterSetter() {
        // [1-1]
        FetchRequestDto dto = new FetchRequestDto();
        FilterDto filter = new FilterDto();
        filter.setMessage("test message");

        dto.setDbType("MySQL");
        dto.setHost("localhost");
        dto.setPort(3306);
        dto.setDbName("test_db");
        dto.setUsername("user");
        dto.setPassword("password");
        dto.setFilter(filter);
        dto.setPage(1);
        dto.setSize(100);

        assertEquals("MySQL", dto.getDbType());
        assertEquals("localhost", dto.getHost());
        assertEquals(3306, dto.getPort());
        assertEquals("test_db", dto.getDbName());
        assertEquals("user", dto.getUsername());
        assertEquals("password", dto.getPassword());
        assertNotNull(dto.getFilter());
        assertEquals("test message", dto.getFilter().getMessage());
        assertEquals(1, dto.getPage());
        assertEquals(100, dto.getSize());

        // [1-2]
        FetchRequestDto dtoUnset = new FetchRequestDto();

        assertNull(dtoUnset.getDbType());
        assertNull(dtoUnset.getHost());
        assertEquals(0, dtoUnset.getPort());
        assertNull(dtoUnset.getDbName());
        assertNull(dtoUnset.getUsername());
        assertNull(dtoUnset.getPassword());
        assertNull(dtoUnset.getFilter());

        assertEquals(0, dtoUnset.getPage());
        assertEquals(50, dtoUnset.getSize());
    }

    /*
     * [2]asDbConfigMapメソッドのテスト
     * [2-1] 設定されたDB接続情報が正しくMapに変換されること <br>
     * [2-2] nullのフィールド値は空文字としてMapに変換されること
     */
    @Test
    void testAsDbConfigMap() {
        // [2-1]
        FetchRequestDto dto = new FetchRequestDto();
        dto.setDbType("SQLServer");
        dto.setHost("sqlsrv");
        dto.setPort(1433);
        dto.setDbName("master");
        dto.setUsername("sa");
        dto.setPassword("password123");
        dto.setPage(1);
        dto.setSize(10);

        Map<String, Object> dbConfigMap = dto.asDbConfigMap();

        assertEquals("SQLServer", dbConfigMap.get("dbType"));
        assertEquals("sqlsrv", dbConfigMap.get("host"));
        assertEquals(1433, dbConfigMap.get("port"));
        assertEquals("master", dbConfigMap.get("dbName"));
        assertEquals("sa", dbConfigMap.get("username"));
        assertEquals("password123", dbConfigMap.get("password"));
        assertEquals(6, dbConfigMap.size());
        assertFalse(dbConfigMap.containsKey("filter"));

        // [2-2]
        FetchRequestDto dtoPartial = new FetchRequestDto();
        dtoPartial.setPort(9999);

        Map<String, Object> dbConfigMapPartial = dtoPartial.asDbConfigMap();

        assertEquals("", dbConfigMapPartial.get("dbType"));
        assertEquals("", dbConfigMapPartial.get("host"));
        assertEquals(9999, dbConfigMapPartial.get("port"));
        assertEquals("", dbConfigMapPartial.get("dbName"));
        assertEquals("", dbConfigMapPartial.get("username"));
        assertEquals("", dbConfigMapPartial.get("password"));
        assertEquals(6, dbConfigMapPartial.size());
    }
}
