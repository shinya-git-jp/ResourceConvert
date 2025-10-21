package com.example.backend.repository;

import com.example.backend.entity.SError;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SErrorRepository extends JpaRepository<SError, String> {
    // JpaRepository<S, ID> → SError エンティティ、ID は objectID
}
