package br.com.matheus.hubfeatcreators.controladores;

import br.com.matheus.hubfeatcreators.entidades.ContaEmail;
import br.com.matheus.hubfeatcreators.servicos.ContaEmailService;
import br.com.matheus.hubfeatcreators.servicos.ImportacaoContaEmailService;
import br.com.matheus.hubfeatcreators.visoes.dtos.ImportacaoResultadoDTO;
import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.telas.contaemail.ContaEmailDTO;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/contas-email")
@RequiredArgsConstructor
public class ContaEmailController extends EntidadeController<ContaEmail, ContaEmailService> {

    private final ImportacaoContaEmailService importacaoService;

    @Override
    public String getModulo() {
        return "CTE";
    }

    @GetMapping("/listar")
    @PreAuthorize("hasAuthority('ROLE_CTEB')")
    public ResponseEntity<PaginatedResponse<ContaEmailDTO>> listarDTO(HttpServletRequest request) {
        return ResponseEntity.ok(service.listarDTO(request.getParameterMap()));
    }

    @GetMapping("/ativos")
    @PreAuthorize("hasAuthority('ROLE_CTEB')")
    public ResponseEntity<List<ContaEmail>> listarAtivos() {
        return ResponseEntity.ok(service.listarAtivos());
    }

    @PostMapping(value = "/importacao", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('ROLE_CTEA')")
    public ResponseEntity<ImportacaoResultadoDTO> importar(@RequestParam("arquivo") MultipartFile arquivo) {
        return ResponseEntity.ok(importacaoService.importar(arquivo));
    }

    @GetMapping("/importacao/template")
    @PreAuthorize("hasAuthority('ROLE_CTEB')")
    public ResponseEntity<byte[]> downloadTemplate() {
        byte[] content = importacaoService.gerarTemplate().getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=contas_email_template.csv")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(content);
    }
}
