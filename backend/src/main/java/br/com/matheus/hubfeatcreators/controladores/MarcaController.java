package br.com.matheus.hubfeatcreators.controladores;

import br.com.matheus.hubfeatcreators.entidades.Marca;
import br.com.matheus.hubfeatcreators.servicos.MarcaService;
import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.telas.marca.MarcaDTO;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/marcas")
public class MarcaController extends EntidadeController<Marca, MarcaService> {

    @GetMapping("/listar")
    public ResponseEntity<PaginatedResponse<MarcaDTO>> listarDTO(HttpServletRequest request) {
        return ResponseEntity.ok(service.listarDTO(request.getParameterMap()));
    }

    @GetMapping("/ativos")
    public ResponseEntity<List<Marca>> listarAtivos() {
        return ResponseEntity.ok(service.listarAtivos());
    }
}
