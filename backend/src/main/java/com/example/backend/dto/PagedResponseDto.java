package com.example.backend.dto;

import java.util.List;

/**
 * ページネーション結果を返すためのDTO
 * 
 * @param <T> データリストの型
 */
public class PagedResponseDto<T> {
    private List<T> content; // 現在のページのデータリスト
    private long totalElements; // フィルター条件に一致する総件数

    // Constructor
    public PagedResponseDto(List<T> content, long totalElements) {
        this.content = content;
        this.totalElements = totalElements;
    }

    public List<T> getContent() {
        return content;
    }

    public long getTotalElements() {
        return totalElements;
    }

    public void setContent(List<T> content) {
        this.content = content;
    }

    public void setTotalElements(long totalElements) {
        this.totalElements = totalElements;
    }
}