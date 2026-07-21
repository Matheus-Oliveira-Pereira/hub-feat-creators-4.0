package br.com.matheus.hubfeatcreators.visoes.repositorios;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.util.Map;

public abstract class EntidadeDTORepository {

    @PersistenceContext
    protected EntityManager entityManager;

    /** Lê um inteiro do request, com valor padrão e teto (evita NumberFormatException não tratada e size sem limite). */
    protected int parseInteiro(Map<String, String[]> requestParams, String chave, int padrao, int maximo) {
        int valor = requestParams.containsKey(chave) ? Integer.parseInt(requestParams.get(chave)[0]) : padrao;
        return Math.min(Math.max(valor, 1), maximo);
    }

    protected int parsePage(Map<String, String[]> requestParams) {
        return requestParams.containsKey("page") ? Integer.parseInt(requestParams.get("page")[0]) : 0;
    }

    protected int parseSize(Map<String, String[]> requestParams) {
        return parseInteiro(requestParams, "size", 10, 100);
    }
}
