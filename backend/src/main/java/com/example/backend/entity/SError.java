package com.example.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "SError")
public class SError {

    @Id
    @Column(name = "objectID", length = 32, nullable = false)
    private String objectID;

    @Column(name = "errorNo", length = 10, nullable = false, unique = true)
    private String errorNo;

    @Column(name = "errorMessageID", length = 32, nullable = false)
    private String errorMessageID;

    @Column(name = "entryUserID", length = 20)
    private String entryUserID;

    @Column(name = "entryDate")
    private LocalDate entryDate;

    @Column(name = "updateUserID", length = 20)
    private String updateUserID;

    @Column(name = "updateDate")
    private LocalDate updateDate;

    @Column(name = "exclusiveFlag", length = 32)
    private String exclusiveFlag;

    @Column(name = "errorType", length = 1, nullable = false)
    private String errorType;

    @Column(name = "url", length = 255)
    private String url;

    @Column(name = "description", length = 255)
    private String description;

    // getter / setter
    public String getObjectID() { return objectID; }
    public void setObjectID(String objectID) { this.objectID = objectID; }

    public String getErrorNo() { return errorNo; }
    public void setErrorNo(String errorNo) { this.errorNo = errorNo; }

    public String getErrorMessageID() { return errorMessageID; }
    public void setErrorMessageID(String errorMessageID) { this.errorMessageID = errorMessageID; }

    public String getEntryUserID() { return entryUserID; }
    public void setEntryUserID(String entryUserID) { this.entryUserID = entryUserID; }

    public LocalDate getEntryDate() { return entryDate; }
    public void setEntryDate(LocalDate entryDate) { this.entryDate = entryDate; }

    public String getUpdateUserID() { return updateUserID; }
    public void setUpdateUserID(String updateUserID) { this.updateUserID = updateUserID; }

    public LocalDate getUpdateDate() { return updateDate; }
    public void setUpdateDate(LocalDate updateDate) { this.updateDate = updateDate; }

    public String getExclusiveFlag() { return exclusiveFlag; }
    public void setExclusiveFlag(String exclusiveFlag) { this.exclusiveFlag = exclusiveFlag; }

    public String getErrorType() { return errorType; }
    public void setErrorType(String errorType) { this.errorType = errorType; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
