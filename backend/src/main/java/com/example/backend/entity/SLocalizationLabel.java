package com.example.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

@Entity
@Table(name = "SLocalizationLabel") // DBのテーブル名
public class SLocalizationLabel {

    @Id
    @Column(name = "objectID", length = 32, nullable = false)
    private String objectID;

    @Column(name = "categoryName", length = 50)
    private String categoryName;

    @Column(name = "country1", length = 255)
    private String country1;

    @Column(name = "country2", length = 255)
    private String country2;

    @Column(name = "country3", length = 255)
    private String country3;

    @Column(name = "country4", length = 255)
    private String country4;

    @Column(name = "country5", length = 255)
    private String country5;


    @Transient
    private String userKey;

    // --- getter / setter ---
    public String getObjectID() { return objectID; }
    public void setObjectID(String objectID) { this.objectID = objectID; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

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



    public String getUserKey() { return userKey; }
    public void setUserKey(String userKey) { this.userKey = userKey; }
}
