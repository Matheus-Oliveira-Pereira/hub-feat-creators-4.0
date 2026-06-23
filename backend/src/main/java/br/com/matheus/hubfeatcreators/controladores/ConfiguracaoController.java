package br.com.matheus.hubfeatcreators.controladores;

import br.com.matheus.hubfeatcreators.servicos.ConfiguracaoService;
import br.com.matheus.hubfeatcreators.visoes.dtos.ConfiguracaoDTO;
import br.com.matheus.hubfeatcreators.visoes.dtos.ConfiguracaoRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/configuracoes")
@RequiredArgsConstructor
public class ConfiguracaoController {

    private final ConfiguracaoService service;

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_CFGB')")
    public ResponseEntity<ConfiguracaoDTO> obter() {
        return ResponseEntity.ok(new ConfiguracaoDTO(service.modeloSelecionado(), service.chaveConfigurada()));
    }

    @PutMapping
    @PreAuthorize("hasAuthority('ROLE_CFGC')")
    public ResponseEntity<ConfiguracaoDTO> atualizar(@RequestBody ConfiguracaoRequest body) {
        service.atualizar(body.getModelo(), body.getChave());
        return ResponseEntity.ok(new ConfiguracaoDTO(service.modeloSelecionado(), service.chaveConfigurada()));
    }
}
