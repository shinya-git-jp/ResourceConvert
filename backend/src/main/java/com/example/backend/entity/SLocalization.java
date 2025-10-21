package com.example.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;

@Entity
@Table(name = "SLocalization")
public class SLocalization {

    @Id
    @Column(name = "ObjectID", length = 32)
    private String objectID;

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

    // Getter / Setter
    public String getObjectID() { return objectID; }
    public void setObjectID(String objectID) { this.objectID = objectID; }

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
