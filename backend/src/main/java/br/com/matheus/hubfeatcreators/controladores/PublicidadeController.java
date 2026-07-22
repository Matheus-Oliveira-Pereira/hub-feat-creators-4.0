package br.com.matheus.hubfeatcreators.controladores;

import br.com.matheus.hubfeatcreators.entidades.Publicidade;
import br.com.matheus.hubfeatcreators.entidades.PublicidadeEntregaveisFormato;
import br.com.matheus.hubfeatcreators.servicos.PublicidadeEntregaveisFormatoService;
import br.com.matheus.hubfeatcreators.servicos.PublicidadeService;
import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.telas.publicidade.PublicidadeDTO;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/publicidades")
@RequiredArgsConstructor
public class PublicidadeController extends EntidadeController<Publicidade, PublicidadeService> {

    private final PublicidadeEntregaveisFormatoService formatoService;

    @Override
    public String getModulo() {
        return "PUB";
    }

    @PreAuthorize("hasAuthority('ROLE_PUBB')")
    @GetMapping("/listar")
    public ResponseEntity<PaginatedResponse<PublicidadeDTO>> listarDTO(HttpServletRequest request) {
        return ResponseEntity.ok(service.listarDTO(request.getParameterMap()));
    }

    @PreAuthorize("hasAuthority('ROLE_PUBB')")
    @GetMapping("/formatos")
    public ResponseEntity<List<PublicidadeEntregaveisFormato>> listarFormatos() {
        return ResponseEntity.ok(formatoService.listarTodos());
    }
}
