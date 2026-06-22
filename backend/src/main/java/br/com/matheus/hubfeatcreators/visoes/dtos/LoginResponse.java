package br.com.matheus.hubfeatcreators.visoes.dtos;

public record LoginResponse(String token, String refreshToken, String email, String nome) {
}
