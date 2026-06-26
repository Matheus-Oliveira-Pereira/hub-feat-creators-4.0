package br.com.matheus.hubfeatcreators.controladores;

import br.com.matheus.hubfeatcreators.entidades.LogEmail;
import br.com.matheus.hubfeatcreators.servicos.EmailService;
import br.com.matheus.hubfeatcreators.visoes.dtos.EmailTesteRequest;
import br.com.matheus.hubfeatcreators.visoes.dtos.EmailTesteResponse;
import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.telas.email.LogEmailDTO;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/emails")
@RequiredArgsConstructor
public class EmailController {

    private final EmailService service;

    @GetMapping("/listar")
    @PreAuthorize("hasAuthority('ROLE_EMLB')")
    public ResponseEntity<PaginatedResponse<LogEmailDTO>> listar(HttpServletRequest request) {
        return ResponseEntity.ok(service.listarLogs(request.getParameterMap()));
    }

    @PostMapping("/teste")
    @PreAuthorize("hasAuthority('ROLE_EMLA')")
    public ResponseEntity<EmailTesteResponse> enviarTeste(@RequestBody EmailTesteRequest body) {
        if (body.getDestino() == null || body.getDestino().isBlank()) {
            return ResponseEntity.ok(new EmailTesteResponse(false, "Informe um destinatário para o teste."));
        }
        LogEmail resultado = service.enviarTesteSync(body.getDestino().trim(), body.getContaId());
        boolean sucesso = resultado.getStatus() == LogEmail.Status.SUCESSO;
        return ResponseEntity.ok(new EmailTesteResponse(sucesso, sucesso ? null : resultado.getErro()));
    }
}
