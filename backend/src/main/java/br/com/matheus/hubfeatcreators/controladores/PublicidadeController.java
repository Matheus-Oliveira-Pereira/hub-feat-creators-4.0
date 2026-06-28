package br.com.matheus.hubfeatcreators.controladores;

import br.com.matheus.hubfeatcreators.entidades.Publicidade;
import br.com.matheus.hubfeatcreators.entidades.PublicidadeEntregaveisFormato;
import br.com.matheus.hubfeatcreators.servicos.PublicidadeEntregaveisFormatoService;
import br.com.matheus.hubfeatcreators.servicos.PublicidadeService;
import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.telas.publicidade.PublicidadeDTO;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/publicidades")
public class PublicidadeController extends EntidadeController<Publicidade, PublicidadeService> {

    @Autowired
    private PublicidadeEntregaveisFormatoService formatoService;

    @GetMapping("/listar")
    public ResponseEntity<PaginatedResponse<PublicidadeDTO>> listarDTO(HttpServletRequest request) {
        return ResponseEntity.ok(service.listarDTO(request.getParameterMap()));
    }

    @GetMapping("/formatos")
    public ResponseEntity<List<PublicidadeEntregaveisFormato>> listarFormatos() {
        return ResponseEntity.ok(formatoService.listarTodos());
    }
}
