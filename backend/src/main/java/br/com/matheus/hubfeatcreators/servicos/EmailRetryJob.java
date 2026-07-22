package br.com.matheus.hubfeatcreators.servicos;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Reprocessa periodicamente e-mails com falha, até um limite de tentativas.
 * Falhas permanentes (ex: endereço inválido) param após {@link #MAX_TENTATIVAS}.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EmailRetryJob {

    private static final int MAX_TENTATIVAS = 3;

    private final EmailService emailService;

    @Scheduled(fixedDelay = 300_000) // 5 min
    public void reprocessarFalhas() {
        var falhas = emailService.buscarFalhasParaRetry(MAX_TENTATIVAS);
        if (falhas.isEmpty()) {
            return;
        }
        log.info("Auto-retry de e-mail: {} falha(s) para reprocessar.", falhas.size());
        falhas.forEach(logEmail -> {
            try {
                emailService.reenviar(logEmail.getId());
            } catch (Exception e) {
                log.warn("Auto-retry falhou para log {}: {}", logEmail.getId(), e.getMessage());
            }
        });
    }
}
