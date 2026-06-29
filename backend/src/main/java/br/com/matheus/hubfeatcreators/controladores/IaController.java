package br.com.matheus.hubfeatcreators.controladores;

import br.com.matheus.hubfeatcreators.servicos.IaTextoService;
import br.com.matheus.hubfeatcreators.visoes.dtos.EditarTextoRequest;
import br.com.matheus.hubfeatcreators.visoes.dtos.EditarTextoResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ia")
@RequiredArgsConstructor
public class IaController {

    private final IaTextoService service;

    @PostMapping("/editar-texto")
    public ResponseEntity<EditarTextoResponse> editarTexto(@RequestBody EditarTextoRequest body) {
        String texto = service.editarTexto(body.getTexto(), body.getComando());
        return ResponseEntity.ok(new EditarTextoResponse(texto));
    }
}
