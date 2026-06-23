package br.com.matheus.hubfeatcreators.visoes.dtos;

import br.com.matheus.hubfeatcreators.enums.ModeloClaude;
import lombok.Data;

import java.util.List;

@Data
public class ConfiguracaoDTO {

    private String modelo;
    private boolean chaveConfigurada;
    private List<ModeloOption> modelosDisponiveis;

    public ConfiguracaoDTO(String modelo, boolean chaveConfigurada) {
        this.modelo = modelo;
        this.chaveConfigurada = chaveConfigurada;
        this.modelosDisponiveis = ModeloClaude.listar().stream()
                .map(m -> new ModeloOption(m.getId(), m.getDisplayName()))
                .toList();
    }

    @Data
    public static class ModeloOption {
        private final String id;
        private final String nome;
    }
}
