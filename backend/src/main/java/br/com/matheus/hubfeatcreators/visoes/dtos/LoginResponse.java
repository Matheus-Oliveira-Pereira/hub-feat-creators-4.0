package br.com.matheus.hubfeatcreators.visoes.dtos;

import java.time.LocalDateTime;

public record LoginResponse(String token, String refreshToken, String email, String nome, LocalDateTime ultimoLogin) {
}
