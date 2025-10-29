package com.example.backend.dto;

import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.ArrayList;
import java.util.Collections;
import static org.junit.jupiter.api.Assertions.*;

/**
 * PagedResponseDto クラスのテスト
 */
public class PagedResponseDtoTest {

    /*
     * [1] コンストラクタおよび Setter/Getter のテスト
     * [1-1] コンストラクタで値を設定し、Getter で正しく取得できること <br>
     * [1-2] Setter で値を設定し、Getter で正しく取得できること <br>
     * [1-3] コンストラクタに空のリストや 0 を設定した場合も正しく動作すること <br>
     */
    @Test
    void testConstructorAndGetterSetter() {
        // [1-1]
        List<String> testContent = new ArrayList<>();
        testContent.add("item1");
        testContent.add("item2");
        long testTotalElements = 100L;

        PagedResponseDto<String> dto = new PagedResponseDto<>(testContent, testTotalElements);

        assertNotNull(dto.getContent(), "[1-1] content リストが null でないこと");
        assertEquals(2, dto.getContent().size(), "[1-1] content リストのサイズが正しいこと");
        assertEquals("item1", dto.getContent().get(0), "[1-1] content リストの要素が正しいこと");
        assertEquals(100L, dto.getTotalElements(), "[1-1] totalElements が正しいこと");

        // [1-2]
        List<String> newContent = new ArrayList<>();
        newContent.add("newItem");
        long newTotalElements = 5L;

        dto.setContent(newContent);
        dto.setTotalElements(newTotalElements);

        assertNotNull(dto.getContent(), "[1-2] 変更後の content リストが null でないこと");
        assertEquals(1, dto.getContent().size(), "[1-2] 変更後の content リストのサイズが正しいこと");
        assertEquals("newItem", dto.getContent().get(0), "[1-2] 変更後の content リストの要素が正しいこと");
        assertEquals(5L, dto.getTotalElements(), "[1-2] 変更後の totalElements が正しいこと");

        // [1-3]
        // 空リスト
        List<String> emptyContent = Collections.emptyList();
        long zeroTotalElements = 0L;

        PagedResponseDto<String> dtoEmpty = new PagedResponseDto<>(emptyContent, zeroTotalElements);

        assertNotNull(dtoEmpty.getContent(), "[1-3] 空リストの場合、content が null でないこと");
        assertTrue(dtoEmpty.getContent().isEmpty(), "[1-3] 空リストの場合、content が空であること");
        assertEquals(0L, dtoEmpty.getTotalElements(), "[1-3] 0件の場合、totalElements が 0 であること");

        // nullリスト
        long someTotal = 10L;

        PagedResponseDto<String> dtoNullContent = new PagedResponseDto<>(null, someTotal);

        assertNull(dtoNullContent.getContent(), "[1-3] null リストの場合、content が null であること");
        assertEquals(10L, dtoNullContent.getTotalElements(), "[1-3] null リストの場合でも totalElements は設定されること");

        dtoNullContent.setContent(null);

        assertNull(dtoNullContent.getContent(), "[1-3] Setter で null を設定した場合、content が null であること");

    }
}