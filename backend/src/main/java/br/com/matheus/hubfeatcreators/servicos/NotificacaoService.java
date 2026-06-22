package br.com.matheus.hubfeatcreators.servicos;

import br.com.matheus.hubfeatcreators.visoes.dtos.NotificacaoDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificacaoService {

    private final SimpMessagingTemplate messagingTemplate;

    public void notificar(String tipo, String entidade, String mensagem) {
        String usuario = getUsuarioAtual();
        NotificacaoDTO notificacao = new NotificacaoDTO(tipo, entidade, mensagem, usuario);
        messagingTemplate.convertAndSend("/topic/notificacoes", notificacao);
    }

    public void criacao(String entidade, String descricao) {
        notificar("CRIACAO", entidade, descricao + " foi criado(a)");
    }

    public void alteracao(String entidade, String descricao) {
        notificar("ALTERACAO", entidade, descricao + " foi atualizado(a)");
    }

    public void exclusao(String entidade, String descricao) {
        notificar("EXCLUSAO", entidade, descricao + " foi excluido(a)");
    }

    private String getUsuarioAtual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return "sistema";
    }
}
