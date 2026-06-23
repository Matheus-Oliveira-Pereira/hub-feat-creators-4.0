package br.com.matheus.hubfeatcreators.controladores;

import br.com.matheus.hubfeatcreators.entidades.MidiaKitTemplate;
import br.com.matheus.hubfeatcreators.entidades.SessaoMidiaKit;
import br.com.matheus.hubfeatcreators.servicos.MidiaKitTemplateService;
import br.com.matheus.hubfeatcreators.visoes.dtos.CopiarTemplateRequest;
import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.telas.midiakit.MidiaKitTemplateDTO;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/midiakit-templates")
public class MidiaKitTemplateController extends EntidadeController<MidiaKitTemplate, MidiaKitTemplateService> {

    @GetMapping("/listar")
    public ResponseEntity<PaginatedResponse<MidiaKitTemplateDTO>> listarDTO(HttpServletRequest request) {
        return ResponseEntity.ok(service.listarDTO(request.getParameterMap()));
    }

    @GetMapping("/ativos")
    public ResponseEntity<List<MidiaKitTemplate>> listarAtivos() {
        return ResponseEntity.ok(service.listarAtivos());
    }

    @PostMapping("/{id}/copiar")
    public ResponseEntity<MidiaKitTemplate> copiar(@PathVariable UUID id, @RequestBody(required = false) CopiarTemplateRequest body) {
        UUID novoInfluenciadorId = body != null ? body.getNovoInfluenciadorId() : null;
        return ResponseEntity.ok(service.copiar(id, novoInfluenciadorId));
    }

    @PostMapping("/{id}/sessoes/{sessaoId}/analisar")
    public ResponseEntity<SessaoMidiaKit> analisarSessao(@PathVariable UUID id,
                                                         @PathVariable UUID sessaoId,
                                                         @RequestParam("prints") List<MultipartFile> prints,
                                                         @RequestParam(value = "comando", required = false) String comando) {
        return ResponseEntity.ok(service.analisarSessao(id, sessaoId, prints, comando));
    }
}
