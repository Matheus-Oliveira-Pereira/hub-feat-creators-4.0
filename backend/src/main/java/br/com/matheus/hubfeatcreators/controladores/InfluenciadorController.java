package br.com.matheus.hubfeatcreators.controladores;

import br.com.matheus.hubfeatcreators.entidades.Influenciador;
import br.com.matheus.hubfeatcreators.servicos.InfluenciadorService;
import br.com.matheus.hubfeatcreators.servicos.ImportacaoInfluenciadorService;
import br.com.matheus.hubfeatcreators.visoes.dtos.ImportacaoResultadoDTO;
import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.telas.influenciador.InfluenciadorDTO;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/influenciadores")
public class InfluenciadorController extends EntidadeController<Influenciador, InfluenciadorService> {

    @Autowired
    private ImportacaoInfluenciadorService importacaoService;

    @GetMapping("/listar")
    public ResponseEntity<PaginatedResponse<InfluenciadorDTO>> listarDTO(HttpServletRequest request) {
        return ResponseEntity.ok(service.listarDTO(request.getParameterMap()));
    }

    @GetMapping("/ativos")
    public ResponseEntity<java.util.List<Influenciador>> listarAtivos() {
        return ResponseEntity.ok(service.listarAtivos());
    }

    @PostMapping(value = "/importacao", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImportacaoResultadoDTO> importar(@RequestParam("arquivo") MultipartFile arquivo) {
        return ResponseEntity.ok(importacaoService.importar(arquivo));
    }

    @GetMapping("/importacao/template")
    public ResponseEntity<byte[]> downloadTemplate() {
        byte[] content = importacaoService.gerarTemplate().getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=influenciadores_template.csv")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(content);
    }
}
