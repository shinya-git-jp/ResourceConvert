package com.example.backend.dto;

/**
 * 検索フィルター条件を保持するDTO
 */
public class FilterDto {

    private String objectID;
    private String message;      // メッセージ/エラーメッセージ共通

    // MessageResource (SLocalizationLabel) 用
    private String categoryName;

    // ErrorMessage (SError) 用
    private String errorNo;
    private String errorType;

    // --- Getters and Setters ---

    public String getObjectID() { return objectID; }
    public void setObjectID(String objectID) { this.objectID = objectID; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public String getErrorNo() { return errorNo; }
    public void setErrorNo(String errorNo) { this.errorNo = errorNo; }

    public String getErrorType() { return errorType; }
    public void setErrorType(String errorType) { this.errorType = errorType; }
}