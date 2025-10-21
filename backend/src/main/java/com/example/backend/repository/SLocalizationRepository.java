package com.example.backend.repository;

import com.example.backend.entity.SLocalization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SLocalizationRepository extends JpaRepository<SLocalization, String> {

}
