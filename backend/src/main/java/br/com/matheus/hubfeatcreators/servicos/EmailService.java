package br.com.matheus.hubfeatcreators.servicos;

import br.com.matheus.hubfeatcreators.entidades.ContaEmail;
import br.com.matheus.hubfeatcreators.entidades.Email;
import br.com.matheus.hubfeatcreators.entidades.Influenciador;
import br.com.matheus.hubfeatcreators.entidades.LogEmail;
import br.com.matheus.hubfeatcreators.enums.StatusContaEmail;
import br.com.matheus.hubfeatcreators.repositorios.EmailRepository;
import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.repositorios.LogEmailDTORepository;
import br.com.matheus.hubfeatcreators.visoes.telas.email.LogEmailDTO;
import jakarta.mail.internet.AddressException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

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
                ? buscarConta(contaId)
                : contaEmailService.obterContaSistema().orElse(null);
        return enviarComConta(email, conta);
    }

    public PaginatedResponse<LogEmailDTO> listarLogs(Map<String, String[]> requestParams) {
        return dtoRepository.listar(requestParams);
    }

    private ContaEmail buscarConta(UUID contaId) {
        try {
            return contaEmailService.buscar(contaId);
        } catch (Exception e) {
            return null;
        }
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
            return salvarLog(persistido, null, LogEmail.Status.FALHA,
                    "Nenhuma conta de e-mail configurada (influenciador sem conta e sem conta do sistema).");
        }
        try {
            validarDestinatarios(persistido.getDestinatarios());

            JavaMailSender mailSender = contaEmailService.construirMailSender(conta);
            MimeMessage mensagem = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mensagem, true, "UTF-8");

            if (conta.getRemetenteNome() != null && !conta.getRemetenteNome().isBlank()) {
                helper.setFrom(conta.getUsuario(), conta.getRemetenteNome());
            } else {
                helper.setFrom(conta.getUsuario());
            }
            helper.setTo(persistido.getDestinatarios().toArray(new String[0]));
            helper.setSubject(persistido.getTitulo());
            helper.setText(persistido.getConteudo() != null ? persistido.getConteudo() : "", true);

            mailSender.send(mensagem);
            return salvarLog(persistido, conta, LogEmail.Status.SUCESSO, null);
        } catch (Exception e) {
            log.error("Falha ao enviar e-mail '{}' pela conta '{}': {}",
                    email.getTitulo(), conta.getNome(), e.getMessage());
            return salvarLog(persistido, conta, LogEmail.Status.FALHA, e.getMessage());
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

    private LogEmail salvarLog(Email email, ContaEmail conta, LogEmail.Status status, String erro) {
        LogEmail logEmail = new LogEmail();
        logEmail.setStatus(status);
        logEmail.setEmail(email);
        logEmail.setContaEmail(conta);
        logEmail.setContaNome(conta != null ? conta.getNome() : null);
        logEmail.setTitulo(email.getTitulo());
        logEmail.setErro(erro);
        logEmail.setDestinatarios(String.join(", ", email.getDestinatarios()));
        return logEmailService.salvar(logEmail);
    }
}
