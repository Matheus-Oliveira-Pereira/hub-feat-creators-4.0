package br.com.matheus.hubfeatcreators.visoes.dtos;

import jakarta.validation.constraints.NotBlank;

public record AlterarSenhaRequest(
        @NotBlank(message = "Senha atual é obrigatória") String senhaAtual,
        @NotBlank(message = "Nova senha é obrigatória") String novaSenha
) {
}
