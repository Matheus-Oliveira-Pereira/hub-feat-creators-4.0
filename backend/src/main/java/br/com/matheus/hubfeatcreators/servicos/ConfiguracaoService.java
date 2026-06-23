package br.com.matheus.hubfeatcreators.servicos;

import br.com.matheus.hubfeatcreators.entidades.Configuracao;
import br.com.matheus.hubfeatcreators.enums.ModeloClaude;
import br.com.matheus.hubfeatcreators.exceptions.ConfiguracaoInvalidaException;
import br.com.matheus.hubfeatcreators.repositorios.ConfiguracaoRepository;
import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ConfiguracaoService {

    private final ConfiguracaoRepository repository;

    @Transactional
    public Configuracao obter() {
        return repository.findFirstByOrderByRegistroAsc()
                .orElseGet(() -> {
                    Configuracao c = new Configuracao();
                    c.setClaudeModelo(ModeloClaude.PADRAO);
                    return repository.save(c);
                });
    }

    @Transactional
    public Configuracao atualizar(String modelo, String chave) {
        Configuracao config = obter();
        if (modelo != null && ModeloClaude.isValido(modelo)) {
            config.setClaudeModelo(modelo);
        }
        if (chave != null && !chave.isBlank()) {
            config.setClaudeApiKey(chave.trim());
        }
        return repository.save(config);
    }

    public String modeloSelecionado() {
        String modelo = obter().getClaudeModelo();
        return (modelo == null || modelo.isBlank()) ? ModeloClaude.PADRAO : modelo;
    }

    public boolean chaveConfigurada() {
        String chave = obter().getClaudeApiKey();
        return chave != null && !chave.isBlank();
    }

    public AnthropicClient obterClienteAnthropic() {
        String chave = obter().getClaudeApiKey();
        if (chave == null || chave.isBlank()) {
            throw new ConfiguracaoInvalidaException("Chave da API do Claude não configurada. Configure em Configurações.");
        }
        return AnthropicOkHttpClient.builder().apiKey(chave).build();
    }
}
