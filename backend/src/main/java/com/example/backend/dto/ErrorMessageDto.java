package com.example.backend.dto;

public class ErrorMessageDto {

    private String objectID;        // SError の objectID
    private String errorNo;         // SError の errorNo
    private String errorType;       // SError の errorType
    private String messageObjectID; // SLocalization の objectID
    private String country1;
    private String country2;
    private String country3;
    private String country4;
    private String country5;

    // Getter / Setter
    public String getObjectID() { return objectID; }
    public void setObjectID(String objectID) { this.objectID = objectID; }

    public String getErrorNo() { return errorNo; }
    public void setErrorNo(String errorNo) { this.errorNo = errorNo; }

    public String getErrorType() { return errorType; }
    public void setErrorType(String errorType) { this.errorType = errorType; }

    public String getMessageObjectID() { return messageObjectID; }
    public void setMessageObjectID(String messageObjectID) { this.messageObjectID = messageObjectID; }

    public String getCountry1() { return country1; }
    public void setCountry1(String country1) { this.country1 = country1; }

    public String getCountry2() { return country2; }
    public void setCountry2(String country2) { this.country2 = country2; }

    public String getCountry3() { return country3; }
    public void setCountry3(String country3) { this.country3 = country3; }

    public String getCountry4() { return country4; }
    public void setCountry4(String country4) { this.country4 = country4; }

    public String getCountry5() { return country5; }
    public void setCountry5(String country5) { this.country5 = country5; }
}
