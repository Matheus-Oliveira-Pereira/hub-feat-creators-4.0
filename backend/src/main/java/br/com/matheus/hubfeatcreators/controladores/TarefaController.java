package br.com.matheus.hubfeatcreators.controladores;

import br.com.matheus.hubfeatcreators.entidades.LogEmail;
import br.com.matheus.hubfeatcreators.entidades.Tarefa;
import br.com.matheus.hubfeatcreators.entidades.Usuario;
import br.com.matheus.hubfeatcreators.enums.StatusUsuario;
import br.com.matheus.hubfeatcreators.repositorios.UsuarioRepository;
import br.com.matheus.hubfeatcreators.servicos.NotificacaoService;
import br.com.matheus.hubfeatcreators.servicos.TarefaService;
import br.com.matheus.hubfeatcreators.visoes.dtos.AlterarStatusTarefaRequest;
import br.com.matheus.hubfeatcreators.visoes.dtos.EnvioEmailRequest;
import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.telas.tarefa.TarefaDTO;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/tarefas")
public class TarefaController extends EntidadeController<Tarefa, TarefaService> {

    @Autowired
    private NotificacaoService notificacaoService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    public String getModulo() {
        return "TAR";
    }

    @PreAuthorize("hasAuthority('ROLE_TARB')")
    @GetMapping("/listar")
    public ResponseEntity<PaginatedResponse<TarefaDTO>> listarDTO(HttpServletRequest request) {
        return ResponseEntity.ok(service.listarDTO(request.getParameterMap()));
    }

    /** Mudança de status via drag-and-drop do kanban — sem payload completo. */
    @PreAuthorize("hasAuthority('ROLE_TARC')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<Tarefa> alterarStatus(@PathVariable UUID id, @RequestBody AlterarStatusTarefaRequest body) {
        Tarefa tarefa = service.alterarStatus(id, body.status());
        notificacaoService.alteracao(Tarefa.class.getSimpleName(), id.toString());
        return ResponseEntity.ok(tarefa);
    }

    @PreAuthorize("hasAuthority('ROLE_TARC')")
    @PostMapping("/{id}/email")
    public ResponseEntity<LogEmail> enviarEmail(@PathVariable UUID id, @RequestBody EnvioEmailRequest body) {
        return ResponseEntity.ok(service.enviarEmailManual(
                id, body.getAssunto(), body.getCorpo(), body.getCc(), body.getCco()));
    }

    /** Dropdown de responsável (assessora) sem exigir role de Usuários. */
    @PreAuthorize("hasAuthority('ROLE_TARB')")
    @GetMapping("/usuarios-ativos")
    public ResponseEntity<List<Map<String, Object>>> usuariosAtivos() {
        List<Map<String, Object>> usuarios = usuarioRepository.findByStatus(StatusUsuario.ATIVO).stream()
                .map(u -> Map.<String, Object>of("id", u.getId(), "nome", u.getNome()))
                .toList();
        return ResponseEntity.ok(usuarios);
    }
}
