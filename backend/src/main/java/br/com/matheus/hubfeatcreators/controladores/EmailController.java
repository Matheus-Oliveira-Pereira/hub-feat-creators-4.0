package br.com.matheus.hubfeatcreators.controladores;

import br.com.matheus.hubfeatcreators.entidades.LogEmail;
import br.com.matheus.hubfeatcreators.servicos.EmailService;
import br.com.matheus.hubfeatcreators.visoes.dtos.EmailTesteRequest;
import br.com.matheus.hubfeatcreators.visoes.dtos.EmailTesteResponse;
import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.telas.email.LogEmailDTO;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Base64;
import java.util.UUID;

@RestController
@RequestMapping("/api/emails")
@RequiredArgsConstructor
public class EmailController {

    /** PNG transparente 1x1 (base64) devolvido pelo pixel de rastreio. */
    private static final byte[] PIXEL_1X1_PNG = Base64.getDecoder().decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==");

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

    @PostMapping("/{logId}/retry")
    @PreAuthorize("hasAuthority('ROLE_EMLA')")
    public ResponseEntity<Void> reenviar(@PathVariable UUID logId) {
        service.reenviar(logId);
        return ResponseEntity.noContent().build();
    }

    /** Pixel de rastreio de abertura — público (client de e-mail do destinatário não tem JWT). */
    @GetMapping(value = "/track/{emailId}.png", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> rastrearAbertura(@PathVariable UUID emailId) {
        service.registrarAbertura(emailId);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .contentType(MediaType.IMAGE_PNG)
                .body(PIXEL_1X1_PNG);
    }
}
