package br.com.matheus.hubfeatcreators.servicos;

import br.com.matheus.hubfeatcreators.entidades.LogEmail;
import br.com.matheus.hubfeatcreators.repositorios.LogEmailRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class LogEmailService extends EntidadeService<LogEmail, LogEmailRepository> {

    /** Logs com falha ainda dentro do limite de tentativas (auto-retry). */
    public List<LogEmail> buscarFalhasParaRetry(int maxTentativas) {
        return repository.findByStatusAndTentativasLessThan(LogEmail.Status.FALHA, maxTentativas);
    }

    /** Logs vinculados a um e-mail (rastreio de abertura). */
    public List<LogEmail> buscarPorEmail(UUID emailId) {
        return repository.findByEmailId(emailId);
    }
}
