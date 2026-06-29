package br.com.matheus.hubfeatcreators.controladores;

import br.com.matheus.hubfeatcreators.entidades.FollowUp;
import br.com.matheus.hubfeatcreators.entidades.LogEmail;
import br.com.matheus.hubfeatcreators.entidades.Prospecao;
import br.com.matheus.hubfeatcreators.servicos.ProspecaoService;
import br.com.matheus.hubfeatcreators.visoes.dtos.EnvioEmailRequest;
import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.telas.prospecao.ProspecaoDTO;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/prospecoes")
public class ProspecaoController extends EntidadeController<Prospecao, ProspecaoService> {

    @GetMapping("/listar")
    public ResponseEntity<PaginatedResponse<ProspecaoDTO>> listarDTO(HttpServletRequest request) {
        return ResponseEntity.ok(service.listarDTO(request.getParameterMap()));
    }

    @GetMapping("/por-influenciador/{influenciadorId}")
    public ResponseEntity<List<Prospecao>> porInfluenciador(@PathVariable UUID influenciadorId) {
        return ResponseEntity.ok(service.listarPorInfluenciador(influenciadorId));
    }

    @PostMapping("/{id}/follow-up")
    public ResponseEntity<FollowUp> registrarFollowUp(@PathVariable UUID id, @RequestBody EnvioEmailRequest body) {
        return ResponseEntity.ok(service.registrarFollowUp(id, body.getAssunto(), body.getCorpo(), body.getObservacoes()));
    }

    @PostMapping("/{id}/email")
    public ResponseEntity<LogEmail> enviarEmailContato(@PathVariable UUID id, @RequestBody EnvioEmailRequest body) {
        return ResponseEntity.ok(service.enviarEmailContato(id, body.getAssunto(), body.getCorpo()));
    }
}
