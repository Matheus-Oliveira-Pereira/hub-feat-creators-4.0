package br.com.matheus.hubfeatcreators.controladores;

import br.com.matheus.hubfeatcreators.entidades.ContaEmail;
import br.com.matheus.hubfeatcreators.servicos.ContaEmailService;
import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.telas.contaemail.ContaEmailDTO;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/contas-email")
public class ContaEmailController extends EntidadeController<ContaEmail, ContaEmailService> {

    @GetMapping("/listar")
    @PreAuthorize("hasAuthority('ROLE_CTEB')")
    public ResponseEntity<PaginatedResponse<ContaEmailDTO>> listarDTO(HttpServletRequest request) {
        return ResponseEntity.ok(service.listarDTO(request.getParameterMap()));
    }

    @GetMapping("/ativos")
    public ResponseEntity<List<ContaEmail>> listarAtivos() {
        return ResponseEntity.ok(service.listarAtivos());
    }
}
