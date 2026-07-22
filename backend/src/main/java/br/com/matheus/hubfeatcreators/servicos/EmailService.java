package br.com.matheus.hubfeatcreators.servicos;

import br.com.matheus.hubfeatcreators.entidades.ContaEmail;
import br.com.matheus.hubfeatcreators.entidades.Email;
import br.com.matheus.hubfeatcreators.entidades.Influenciador;
import br.com.matheus.hubfeatcreators.entidades.LogEmail;
import br.com.matheus.hubfeatcreators.enums.StatusContaEmail;
import br.com.matheus.hubfeatcreators.exceptions.RegraNegocioException;
import br.com.matheus.hubfeatcreators.repositorios.EmailRepository;
import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.repositorios.LogEmailDTORepository;
import br.com.matheus.hubfeatcreators.visoes.telas.email.LogEmailDTO;
import jakarta.mail.internet.AddressException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Serviço de envio de e-mail via SMTP.
 * Resolve a conta remetente (conta do influenciador → senão conta do sistema) e
 * registra cada tentativa em {@link LogEmail} para rastreabilidade (sucesso/falha + qual conta enviou).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService extends EntidadeService<Email, EmailRepository> {

    private final ContaEmailService contaEmailService;
    private final LogEmailService logEmailService;
    private final LogEmailDTORepository dtoRepository;

    /** Base URL pública usada no pixel de rastreio (client do destinatário busca a imagem). */
    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    /** Resultado de uma tentativa de envio, sem persistir log (permite retry reusando o mesmo log). */
    private record ResultadoEnvio(boolean sucesso, String erro, String aviso, List<String> bccEfetivo) {}

    /**
     * Envio assíncrono de prospecção: usa a conta do influenciador; se ausente, a do sistema.
     */
    @Async
    public void enviar(Email email, Influenciador influenciador) {
        enviarSync(email, influenciador);
    }

    /**
     * Envio síncrono: resolve a conta (influenciador → sistema) e envia. Sempre registra log.
     */
    public LogEmail enviarSync(Email email, Influenciador influenciador) {
        ContaEmail conta = resolverConta(influenciador);
        return enviarComConta(email, conta);
    }

    /**
     * Cria e envia (síncrono) um e-mail de teste pela conta informada (ou a conta do sistema).
     */
    public LogEmail enviarTesteSync(String destino, UUID contaId) {
        Email email = new Email(
                "E-mail de teste — Hub Feat Creators",
                "<p>Este é um e-mail de teste enviado pelo Hub Feat Creators. "
                        + "Se você recebeu esta mensagem, a configuração SMTP está funcionando.</p>",
                List.of(destino)
        );
        ContaEmail conta = contaId != null
                ? contaEmailService.buscar(contaId)
                : contaEmailService.obterContaSistema().orElse(null);
        return enviarComConta(email, conta);
    }

    public PaginatedResponse<LogEmailDTO> listarLogs(Map<String, String[]> requestParams) {
        return dtoRepository.listar(requestParams);
    }

    /**
     * Conta do influenciador (se vinculada e ativa); caso contrário, conta padrão do sistema.
     */
    private ContaEmail resolverConta(Influenciador influenciador) {
        if (influenciador != null && influenciador.getContaEmail() != null
                && influenciador.getContaEmail().getStatus() == StatusContaEmail.ATIVO) {
            return influenciador.getContaEmail();
        }
        return contaEmailService.obterContaSistema().orElse(null);
    }

    private LogEmail enviarComConta(Email email, ContaEmail conta) {
        Email persistido = repository.save(email);
        if (conta == null) {
            return salvarLog(persistido, null, LogEmail.Status.FALHA, null,
                    "Nenhuma conta de e-mail configurada (influenciador sem conta e sem conta do sistema).");
        }
        ResultadoEnvio r = tentarEnviar(persistido, conta);
        LogEmail.Status status = r.sucesso() ? LogEmail.Status.SUCESSO : LogEmail.Status.FALHA;
        return salvarLog(persistido, conta, status, r.bccEfetivo(), r.sucesso() ? r.aviso() : r.erro());
    }

    /**
     * Tenta enviar o e-mail pela conta (SMTP + gravação em Enviados + pixel de rastreio),
     * sem persistir log — devolve o resultado pro chamador decidir como registrar. O
     * {@code email} já deve estar persistido (tem id, usado no pixel).
     */
    private ResultadoEnvio tentarEnviar(Email email, ContaEmail conta) {
        List<String> bcc = mesclarCopiaOculta(email.getCopiaOculta(), conta.getCopiaOculta());
        try {
            validarDestinatarios(email.getDestinatarios());
            List<String> cc = email.getCopia() != null ? email.getCopia() : List.of();
            validarEnderecos(cc);
            validarEnderecos(bcc);

            JavaMailSender mailSender = contaEmailService.construirMailSender(conta);
            MimeMessage mensagem = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mensagem, true, "UTF-8");

            if (conta.getRemetenteNome() != null && !conta.getRemetenteNome().isBlank()) {
                helper.setFrom(conta.getUsuario(), conta.getRemetenteNome());
            } else {
                helper.setFrom(conta.getUsuario());
            }
            helper.setTo(email.getDestinatarios().toArray(new String[0]));
            if (!cc.isEmpty()) helper.setCc(cc.toArray(new String[0]));
            if (!bcc.isEmpty()) helper.setBcc(bcc.toArray(new String[0]));
            helper.setSubject(email.getTitulo());
            String corpo = (email.getConteudo() != null ? email.getConteudo() : "") + pixelRastreio(email.getId());
            helper.setText(corpo, true);

            mailSender.send(mensagem);

            // Melhor esforço: envio já ocorreu; falha aqui não derruba o status.
            String avisoEnviados = null;
            try {
                contaEmailService.salvarEmEnviados(conta, mensagem);
            } catch (Exception e) {
                log.warn("E-mail enviado, mas falhou ao gravar em Enviados (conta '{}'): {}", conta.getNome(), e.getMessage());
                avisoEnviados = "Enviado com sucesso, mas não foi possível gravar na pasta Enviados: " + e.getMessage();
            }
            return new ResultadoEnvio(true, null, avisoEnviados, bcc);
        } catch (Exception e) {
            log.error("Falha ao enviar e-mail '{}' pela conta '{}': {}",
                    email.getTitulo(), conta.getNome(), e.getMessage());
            return new ResultadoEnvio(false, e.getMessage(), null, bcc);
        }
    }

    /** Tag &lt;img&gt; 1x1 apontando pro endpoint público de rastreio (marca abertura quando carregada). */
    private String pixelRastreio(UUID emailId) {
        return "<img src=\"" + baseUrl + "/api/emails/track/" + emailId
                + ".png\" width=\"1\" height=\"1\" alt=\"\" style=\"display:none\"/>";
    }

    /** Reenvia um e-mail que falhou, reutilizando o log existente (incrementa tentativas). */
    @Transactional
    public LogEmail reenviar(UUID logId) {
        LogEmail logEmail = logEmailService.buscar(logId);
        if (logEmail.getStatus() != LogEmail.Status.FALHA) {
            throw new RegraNegocioException("Só é possível reenviar e-mails com falha.");
        }
        Email email = logEmail.getEmail();
        if (email == null) {
            throw new RegraNegocioException("E-mail original não disponível para reenvio.");
        }
        ContaEmail conta = logEmail.getContaEmail() != null
                ? logEmail.getContaEmail()
                : contaEmailService.obterContaSistema().orElse(null);

        ResultadoEnvio r = (conta == null)
                ? new ResultadoEnvio(false, "Nenhuma conta de e-mail configurada.", null, List.of())
                : tentarEnviar(email, conta);

        logEmail.setTentativas(logEmail.getTentativas() + 1);
        logEmail.setStatus(r.sucesso() ? LogEmail.Status.SUCESSO : LogEmail.Status.FALHA);
        logEmail.setErro(r.sucesso() ? r.aviso() : r.erro());
        if (conta != null) {
            logEmail.setContaEmail(conta);
            logEmail.setContaNome(conta.getNome());
        }
        return logEmailService.salvar(logEmail);
    }

    /** Logs com falha ainda dentro do limite de tentativas (usado pelo job de auto-retry). */
    public List<LogEmail> buscarFalhasParaRetry(int maxTentativas) {
        return logEmailService.buscarFalhasParaRetry(maxTentativas);
    }

    /** Marca como aberto(s) o(s) log(s) de um e-mail (rastreio via pixel). Idempotente. */
    @Transactional
    public void registrarAbertura(UUID emailId) {
        logEmailService.buscarPorEmail(emailId).stream()
                .filter(l -> !l.isAberto())
                .forEach(l -> {
                    l.setAberto(true);
                    l.setDataAbertura(LocalDateTime.now());
                    logEmailService.salvar(l);
                });
    }

    /** BCC efetivo = informados no envio + fixos da conta (CSV), sem duplicatas (case-insensitive). */
    static List<String> mesclarCopiaOculta(List<String> doEnvio, String daContaCsv) {
        java.util.LinkedHashMap<String, String> porChave = new java.util.LinkedHashMap<>();
        if (doEnvio != null) {
            doEnvio.forEach(e -> { if (e != null && !e.isBlank()) porChave.putIfAbsent(e.trim().toLowerCase(), e.trim()); });
        }
        ContaEmailService.separarEmails(daContaCsv)
                .forEach(e -> porChave.putIfAbsent(e.toLowerCase(), e));
        return List.copyOf(porChave.values());
    }

    private void validarEnderecos(List<String> enderecos) {
        for (String endereco : enderecos) {
            try {
                new InternetAddress(endereco.trim(), true).validate();
            } catch (AddressException ex) {
                throw new IllegalArgumentException("Endereço de e-mail inválido: " + endereco);
            }
        }
    }

    private void validarDestinatarios(List<String> destinatarios) {
        if (destinatarios == null || destinatarios.isEmpty()) {
            throw new IllegalArgumentException("Nenhum destinatário informado");
        }
        for (String destino : destinatarios) {
            try {
                new InternetAddress(destino.trim(), true).validate();
            } catch (AddressException ex) {
                throw new IllegalArgumentException("Endereço de e-mail inválido: " + destino);
            }
        }
    }

    private LogEmail salvarLog(Email email, ContaEmail conta, LogEmail.Status status, List<String> bccEfetivo, String erro) {
        LogEmail logEmail = new LogEmail();
        logEmail.setStatus(status);
        logEmail.setEmail(email);
        logEmail.setContaEmail(conta);
        logEmail.setContaNome(conta != null ? conta.getNome() : null);
        logEmail.setTitulo(email.getTitulo());
        logEmail.setErro(erro);
        logEmail.setDestinatarios(String.join(", ", email.getDestinatarios()));
        if (email.getCopia() != null && !email.getCopia().isEmpty()) {
            logEmail.setCopia(String.join(", ", email.getCopia()));
        }
        if (bccEfetivo != null && !bccEfetivo.isEmpty()) {
            logEmail.setCopiaOculta(String.join(", ", bccEfetivo));
        }
        return logEmailService.salvar(logEmail);
    }
}
