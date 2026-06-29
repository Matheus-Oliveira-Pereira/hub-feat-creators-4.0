package br.com.matheus.hubfeatcreators.servicos;

import br.com.matheus.hubfeatcreators.exceptions.ConfiguracaoInvalidaException;
import com.anthropic.client.AnthropicClient;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

/**
 * Edita textos (corpo/assunto de e-mails, templates) via Claude a partir de um comando do usuário.
 * Preserva a formatação HTML e devolve apenas o texto editado.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class IaTextoService {

    private final ConfiguracaoService configuracaoService;

    public String editarTexto(String texto, String comando) {
        if (comando == null || comando.isBlank()) {
            throw new ConfiguracaoInvalidaException("Informe o comando para a IA.");
        }
        if (texto == null) {
            texto = "";
        }

        AnthropicClient client = configuracaoService.obterClienteAnthropic();
        String modelo = configuracaoService.modeloSelecionado();

        MessageCreateParams params = MessageCreateParams.builder()
                .model(modelo)
                .maxTokens(4096L)
                .system(systemPrompt())
                .addUserMessage(userPrompt(texto, comando.trim()))
                .build();

        Message response = client.messages().create(params);
        return response.content().stream()
                .flatMap(block -> block.text().stream())
                .map(t -> t.text())
                .collect(Collectors.joining("\n"))
                .trim();
    }

    private String systemPrompt() {
        return "Você é um assistente de redação para e-mails de prospecção e parcerias de uma assessoria de "
                + "influenciadores. Recebe um texto e um comando de edição. Aplique o comando e devolve APENAS o "
                + "texto editado, sem comentários, sem explicações e sem cercar em blocos de código. "
                + "Se o texto vier em HTML, preserve as tags e devolva HTML válido equivalente. "
                + "Mantenha eventuais variáveis no formato {{variavel}} intactas. Responda no mesmo idioma do texto.";
    }

    private String userPrompt(String texto, String comando) {
        return "Comando: " + comando + "\n\nTexto a editar:\n" + texto;
    }
}
