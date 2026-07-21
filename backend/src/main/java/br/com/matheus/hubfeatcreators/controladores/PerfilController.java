package br.com.matheus.hubfeatcreators.controladores;

import br.com.matheus.hubfeatcreators.entidades.Perfil;
import br.com.matheus.hubfeatcreators.servicos.PerfilService;
import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.telas.perfil.PerfilDTO;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/perfis")
public class PerfilController extends EntidadeController<Perfil, PerfilService> {

    @Override
    public String getModulo() {
        return "PRF";
    }

    @PreAuthorize("hasAuthority('ROLE_PRFB')")
    @GetMapping("/listar")
    public ResponseEntity<PaginatedResponse<PerfilDTO>> listarDTO(HttpServletRequest request) {
        return ResponseEntity.ok(service.listarDTO(request.getParameterMap()));
    }

    @PreAuthorize("hasAuthority('ROLE_PRFB')")
    @GetMapping("/ativos")
    public ResponseEntity<List<Perfil>> listarAtivos() {
        return ResponseEntity.ok(service.listarAtivos());
    }
}
