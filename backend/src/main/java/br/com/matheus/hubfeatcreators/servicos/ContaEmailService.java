package br.com.matheus.hubfeatcreators.servicos;

import br.com.matheus.hubfeatcreators.entidades.ContaEmail;
import br.com.matheus.hubfeatcreators.enums.StatusContaEmail;
import br.com.matheus.hubfeatcreators.exceptions.ConfiguracaoInvalidaException;
import br.com.matheus.hubfeatcreators.repositorios.ContaEmailRepository;
import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.repositorios.ContaEmailDTORepository;
import br.com.matheus.hubfeatcreators.visoes.telas.contaemail.ContaEmailDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Properties;

@Service
public class ContaEmailService extends EntidadeService<ContaEmail, ContaEmailRepository> {

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
}
