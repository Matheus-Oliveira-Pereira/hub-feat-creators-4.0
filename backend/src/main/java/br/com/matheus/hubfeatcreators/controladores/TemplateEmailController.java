package br.com.matheus.hubfeatcreators.controladores;

import br.com.matheus.hubfeatcreators.entidades.TemplateEmail;
import br.com.matheus.hubfeatcreators.enums.TipoTemplateEmail;
import br.com.matheus.hubfeatcreators.servicos.TemplateEmailService;
import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.dtos.RenderTemplateDTO;
import br.com.matheus.hubfeatcreators.visoes.telas.templateemail.TemplateEmailDTO;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/templates-email")
public class TemplateEmailController extends EntidadeController<TemplateEmail, TemplateEmailService> {

    @Override
    public String getModulo() {
        return "TME";
    }

    @PreAuthorize("hasAuthority('ROLE_TMEB')")
    @GetMapping("/listar")
    public ResponseEntity<PaginatedResponse<TemplateEmailDTO>> listarDTO(HttpServletRequest request) {
        return ResponseEntity.ok(service.listarDTO(request.getParameterMap()));
    }

    @PreAuthorize("hasAuthority('ROLE_TMEB')")
    @GetMapping("/por-tipo/{tipo}")
    public ResponseEntity<List<TemplateEmail>> porTipo(@PathVariable TipoTemplateEmail tipo) {
        return ResponseEntity.ok(service.listarPorTipo(tipo));
    }

    @PreAuthorize("hasAuthority('ROLE_TMEB')")
    @GetMapping("/{id}/render")
    public ResponseEntity<RenderTemplateDTO> render(@PathVariable UUID id, @RequestParam UUID prospecaoId) {
        return ResponseEntity.ok(service.render(id, prospecaoId));
    }
}
