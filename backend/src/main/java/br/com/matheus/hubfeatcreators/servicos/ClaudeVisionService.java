package br.com.matheus.hubfeatcreators.servicos;

import br.com.matheus.hubfeatcreators.enums.TipoSessao;
import br.com.matheus.hubfeatcreators.exceptions.ConfiguracaoInvalidaException;
import com.anthropic.client.AnthropicClient;
import com.anthropic.models.messages.Base64ImageSource;
import com.anthropic.models.messages.ContentBlockParam;
import com.anthropic.models.messages.ImageBlockParam;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.TextBlockParam;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Lê screenshots (prints de insights/conteúdos) via Claude vision e devolve os analytics em JSON.
 *
 * NOTA: os nomes exatos das classes de bloco de imagem do anthropic-java
 * (ImageBlockParam / Base64ImageSource) devem ser confirmados no primeiro `mvn compile`.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ClaudeVisionService {

    private final ConfiguracaoService configuracaoService;

    public String analisarPrints(TipoSessao tipo, List<MultipartFile> prints, String comando) {
        if (prints == null || prints.isEmpty()) {
            throw new ConfiguracaoInvalidaException("Envie ao menos um print para análise.");
        }

        AnthropicClient client = configuracaoService.obterClienteAnthropic();
        String modelo = configuracaoService.modeloSelecionado();

        List<ContentBlockParam> blocos = new ArrayList<>();
        for (MultipartFile print : prints) {
            try {
                String b64 = Base64.getEncoder().encodeToString(print.getBytes());
                blocos.add(ContentBlockParam.ofImage(
                        ImageBlockParam.builder()
                                .source(Base64ImageSource.builder()
                                        .mediaType(mediaType(print.getContentType()))
                                        .data(b64)
                                        .build())
                                .build()));
            } catch (Exception e) {
                throw new ConfiguracaoInvalidaException("Falha ao ler imagem: " + e.getMessage());
            }
        }
        blocos.add(ContentBlockParam.ofText(TextBlockParam.builder().text(prompt(tipo, comando)).build()));

        MessageCreateParams params = MessageCreateParams.builder()
                .model(modelo)
                .maxTokens(2048L)
                .addUserMessageOfBlockParams(blocos)
                .build();

        Message response = client.messages().create(params);
        String texto = response.content().stream()
                .flatMap(block -> block.text().stream())
                .map(t -> t.text())
                .collect(Collectors.joining("\n"))
                .trim();

        return limparJson(texto);
    }

    private Base64ImageSource.MediaType mediaType(String contentType) {
        String ct = contentType == null ? "" : contentType.toLowerCase();
        if (ct.contains("png")) return Base64ImageSource.MediaType.IMAGE_PNG;
        if (ct.contains("gif")) return Base64ImageSource.MediaType.IMAGE_GIF;
        if (ct.contains("webp")) return Base64ImageSource.MediaType.IMAGE_WEBP;
        return Base64ImageSource.MediaType.IMAGE_JPEG;
    }

    private String limparJson(String texto) {
        String t = texto.trim();
        if (t.startsWith("```")) {
            int inicio = t.indexOf('\n');
            int fim = t.lastIndexOf("```");
            if (inicio >= 0 && fim > inicio) {
                t = t.substring(inicio + 1, fim).trim();
            }
        }
        return t;
    }

    private String prompt(TipoSessao tipo, String comando) {
        String especifico = (comando != null && !comando.isBlank())
                ? comando.trim()
                : promptPadrao(tipo);

        return "Você analisa screenshots de redes sociais de influenciadores. " + especifico
                + " Use os números exatos das imagens. Se um campo não aparecer, omita-o. "
                + "Responda APENAS com um objeto JSON válido (sem markdown, sem texto fora do JSON). "
                + "Chaves de métricas escalares em snake_case (sem acento), valores numéricos quando aplicável. "
                + "TODO texto exibível — rótulos, descrições e nomes próprios (cidades, temas) — deve estar em "
                + "português do Brasil correto, com acentuação, cedilha e pontuação adequada. "
                + "Para rankings de nomes próprios (ex.: principais cidades), use um array de objetos com o nome "
                + "acentuado e o valor, ex.: \"principais_cidades\": [{\"nome\": \"São Paulo\", \"percentual\": 8.7}], "
                + "nunca chaves snake_case para os nomes próprios.";
    }

    private String promptPadrao(TipoSessao tipo) {
        return switch (tipo) {
            case INSIGHTS_INSTAGRAM -> "Extraia métricas de Instagram: seguidores, alcance, impressões, "
                    + "visualizações, contas alcançadas, contas engajadas, taxa de engajamento, curtidas, comentários, salvamentos, compartilhamentos, período.";
            case INSIGHTS_TIKTOK -> "Extraia métricas de TikTok: seguidores, visualizações totais, curtidas, comentários, "
                    + "compartilhamentos, tempo médio de exibição, taxa de engajamento, período.";
            case INSIGHTS_YOUTUBE -> "Extraia métricas de YouTube: inscritos, visualizações, tempo de exibição (horas), "
                    + "duração média, curtidas, comentários, impressões, CTR, período.";
            case CONTEUDOS -> "Descreva os conteúdos mostrados: tipo/formato, temas, descrição breve e qualquer métrica visível.";
            default -> "Extraia todas as métricas e informações relevantes visíveis na imagem.";
        };
    }
}
