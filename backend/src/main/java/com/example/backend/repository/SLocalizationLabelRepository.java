package com.example.backend.repository;

import com.example.backend.entity.SLocalizationLabel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SLocalizationLabelRepository extends JpaRepository<SLocalizationLabel, String> {
    // 必要に応じて追加検索メソッドも作れます
    // 例: List<SLocalizationLabel> findByCategoryName(String categoryName);
}

