package br.com.matheus.hubfeatcreators.controladores;

import br.com.matheus.hubfeatcreators.visoes.dtos.metricas.DistribuicaoDTO;
import br.com.matheus.hubfeatcreators.visoes.dtos.metricas.MetricasResumoDTO;
import br.com.matheus.hubfeatcreators.visoes.dtos.metricas.RankingItemDTO;
import br.com.matheus.hubfeatcreators.visoes.dtos.metricas.SerieTemporalDTO;
import br.com.matheus.hubfeatcreators.visoes.repositorios.MetricasRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/metricas")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_METB')")
public class MetricasController {

    private final MetricasRepository repository;

    @GetMapping("/resumo")
    public ResponseEntity<MetricasResumoDTO> resumo(HttpServletRequest request) {
        return ResponseEntity.ok(repository.resumo(request.getParameterMap()));
    }

    @GetMapping("/faturamento-mensal")
    public ResponseEntity<List<SerieTemporalDTO>> faturamentoMensal(HttpServletRequest request) {
        return ResponseEntity.ok(repository.faturamentoMensal(request.getParameterMap()));
    }

    @GetMapping("/funil")
    public ResponseEntity<List<DistribuicaoDTO>> funil(HttpServletRequest request) {
        return ResponseEntity.ok(repository.funilProspecao(request.getParameterMap()));
    }

    @GetMapping("/status-pagamento")
    public ResponseEntity<List<DistribuicaoDTO>> statusPagamento(HttpServletRequest request) {
        return ResponseEntity.ok(repository.distribuicaoStatusPagamento(request.getParameterMap()));
    }

    @GetMapping("/ranking/influenciadores")
    public ResponseEntity<List<RankingItemDTO>> rankingInfluenciadores(HttpServletRequest request) {
        return ResponseEntity.ok(repository.rankingInfluenciadores(request.getParameterMap()));
    }

    @GetMapping("/ranking/marcas")
    public ResponseEntity<List<RankingItemDTO>> rankingMarcas(HttpServletRequest request) {
        return ResponseEntity.ok(repository.rankingMarcas(request.getParameterMap()));
    }

    @GetMapping("/entregaveis/formatos")
    public ResponseEntity<List<DistribuicaoDTO>> formatos(HttpServletRequest request) {
        return ResponseEntity.ok(repository.distribuicaoFormatos(request.getParameterMap()));
    }

    @GetMapping("/entregaveis/status")
    public ResponseEntity<List<DistribuicaoDTO>> statusEntregaveis(HttpServletRequest request) {
        return ResponseEntity.ok(repository.distribuicaoStatusEntregaveis(request.getParameterMap()));
    }

    @GetMapping("/aging")
    public ResponseEntity<List<DistribuicaoDTO>> aging(HttpServletRequest request) {
        return ResponseEntity.ok(repository.agingRecebiveis(request.getParameterMap()));
    }
}
