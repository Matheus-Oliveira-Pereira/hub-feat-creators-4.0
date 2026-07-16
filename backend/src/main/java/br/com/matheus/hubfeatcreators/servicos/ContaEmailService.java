package br.com.matheus.hubfeatcreators.servicos;

import br.com.matheus.hubfeatcreators.entidades.ContaEmail;
import br.com.matheus.hubfeatcreators.enums.StatusContaEmail;
import br.com.matheus.hubfeatcreators.exceptions.ConfiguracaoInvalidaException;
import br.com.matheus.hubfeatcreators.repositorios.ContaEmailRepository;
import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.repositorios.ContaEmailDTORepository;
import br.com.matheus.hubfeatcreators.visoes.telas.contaemail.ContaEmailDTO;
import jakarta.mail.Flags;
import jakarta.mail.Folder;
import jakarta.mail.Message;
import jakarta.mail.MessagingException;
import jakarta.mail.Session;
import jakarta.mail.Store;
import jakarta.mail.internet.AddressException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.angus.mail.imap.IMAPFolder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Properties;

@Slf4j
@Service
public class ContaEmailService extends EntidadeService<ContaEmail, ContaEmailRepository> {

    /** Nomes comuns da pasta de enviados quando o servidor não anuncia special-use \Sent. */
    private static final List<String> NOMES_PASTA_ENVIADOS = List.of(
            "Sent", "Sent Items", "Sent Messages", "INBOX.Sent", "Enviados", "[Gmail]/Sent Mail");

    @Autowired
    private ContaEmailDTORepository dtoRepository;

    public PaginatedResponse<ContaEmailDTO> listarDTO(Map<String, String[]> requestParams) {
        return dtoRepository.listar(requestParams);
    }

    public List<ContaEmail> listarAtivos() {
        return repository.findByStatus(StatusContaEmail.ATIVO);
    }

    public Optional<ContaEmail> obterContaSistema() {
        return repository.findFirstBySistemaTrueAndStatus(StatusContaEmail.ATIVO);
    }

    @Override
    public ContaEmail salvar(ContaEmail entidade) {
        if (entidade.getStatus() == null) {
            entidade.setStatus(StatusContaEmail.ATIVO);
        }
        validarCopiaOculta(entidade.getCopiaOculta());
        ContaEmail salvo = super.salvar(entidade);
        // Garante apenas uma conta marcada como "sistema".
        if (salvo.isSistema()) {
            repository.findBySistemaTrueAndIdNot(salvo.getId()).forEach(outra -> {
                outra.setSistema(false);
                repository.save(outra);
            });
        }
        return salvo;
    }

    @Override
    public void copyProperties(ContaEmail source, ContaEmail target) {
        super.copyProperties(source, target); // base exclui "senha"
        if (source.getSenha() != null && !source.getSenha().isBlank()) {
            target.setSenha(source.getSenha());
        }
    }

    /**
     * Monta um {@link JavaMailSender} a partir de uma conta SMTP.
     */
    public JavaMailSender construirMailSender(ContaEmail conta) {
        if (conta == null || conta.getHost() == null || conta.getHost().isBlank()
                || conta.getPorta() == null || conta.getUsuario() == null || conta.getUsuario().isBlank()) {
            throw new ConfiguracaoInvalidaException("Conta de e-mail SMTP incompleta ou não configurada.");
        }
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(conta.getHost());
        sender.setPort(conta.getPorta());
        sender.setUsername(conta.getUsuario());
        sender.setPassword(conta.getSenha());
        sender.setDefaultEncoding("UTF-8");

        Properties props = sender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", String.valueOf(Boolean.TRUE.equals(conta.getTls())));
        props.put("mail.smtp.connectiontimeout", "10000");
        props.put("mail.smtp.timeout", "10000");
        props.put("mail.smtp.writetimeout", "10000");
        return sender;
    }

    /** Valida a lista de e-mails em cópia oculta da conta (CSV). */
    void validarCopiaOculta(String copiaOculta) {
        for (String endereco : separarEmails(copiaOculta)) {
            try {
                new InternetAddress(endereco, true).validate();
            } catch (AddressException ex) {
                throw new ConfiguracaoInvalidaException("E-mail de cópia oculta inválido: " + endereco);
            }
        }
    }

    /** Divide uma lista CSV de e-mails em endereços limpos (ignora vazios). */
    public static List<String> separarEmails(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return java.util.Arrays.stream(csv.split("[,;]"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    /** Deriva o host IMAP do host SMTP: smtp.x.com → imap.x.com; sem prefixo smtp → prefixa imap. */
    static String derivarImapHost(String smtpHost) {
        if (smtpHost == null || smtpHost.isBlank()) return null;
        String h = smtpHost.trim();
        if (h.toLowerCase().startsWith("smtp.")) return "imap." + h.substring(5);
        return "imap." + h;
    }

    /**
     * Grava a mensagem enviada na pasta "Enviados" da conta via IMAP APPEND.
     * SMTP não guarda cópia no provedor — sem isso o e-mail não aparece na caixa de enviados.
     * Melhor esforço: quem chama decide o que fazer com a exceção (envio já ocorreu).
     */
    public void salvarEmEnviados(ContaEmail conta, MimeMessage mensagem) throws MessagingException {
        if (Boolean.FALSE.equals(conta.getSalvarEnviados())) return;
        String host = conta.getImapHost() != null && !conta.getImapHost().isBlank()
                ? conta.getImapHost().trim()
                : derivarImapHost(conta.getHost());
        int porta = conta.getImapPorta() != null ? conta.getImapPorta() : 993;

        Properties props = new Properties();
        props.put("mail.store.protocol", "imaps");
        props.put("mail.imaps.connectiontimeout", "10000");
        props.put("mail.imaps.timeout", "10000");
        Session session = Session.getInstance(props);
        Store store = session.getStore("imaps");
        try {
            store.connect(host, porta, conta.getUsuario(), conta.getSenha());
            Folder pasta = localizarPastaEnviados(store);
            if (!pasta.exists()) {
                pasta.create(Folder.HOLDS_MESSAGES);
            }
            mensagem.setFlag(Flags.Flag.SEEN, true);
            pasta.appendMessages(new Message[]{mensagem});
            log.info("E-mail gravado em '{}' via IMAP ({})", pasta.getFullName(), host);
        } finally {
            if (store.isConnected()) {
                store.close();
            }
        }
    }

    /** Localiza a pasta de enviados: special-use \Sent → nomes comuns → cria "Sent". */
    private Folder localizarPastaEnviados(Store store) throws MessagingException {
        try {
            for (Folder f : store.getDefaultFolder().list("*")) {
                if (f instanceof IMAPFolder imapFolder) {
                    for (String attr : imapFolder.getAttributes()) {
                        if ("\\Sent".equalsIgnoreCase(attr)) return f;
                    }
                }
            }
        } catch (MessagingException e) {
            log.debug("Falha ao listar pastas IMAP para detectar \\Sent: {}", e.getMessage());
        }
        for (String nome : NOMES_PASTA_ENVIADOS) {
            Folder f = store.getFolder(nome);
            if (f.exists()) return f;
        }
        return store.getFolder("Sent");
    }
}
