package br.com.matheus.hubfeatcreators.controladores;

import br.com.matheus.hubfeatcreators.entidades.superclasses.Entidade;
import br.com.matheus.hubfeatcreators.servicos.AuditoriaService;
import br.com.matheus.hubfeatcreators.servicos.EntidadeService;
import br.com.matheus.hubfeatcreators.servicos.NotificacaoService;
import br.com.matheus.hubfeatcreators.visoes.dtos.AuditoriaDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.UUID;

public abstract class EntidadeController<T extends Entidade, S extends EntidadeService<T, ?>> {

    @Autowired
    protected S service;

    @Autowired
    private AuditoriaService auditoriaService;

    @Autowired
    private NotificacaoService notificacaoService;

    @GetMapping("/{id}")
    public ResponseEntity<T> buscar(@PathVariable UUID id) {
        return ResponseEntity.ok(service.buscar(id));
    }

    @GetMapping
    public ResponseEntity<List<T>> listar() {
        return ResponseEntity.ok(service.listar());
    }

    @PostMapping
    public ResponseEntity<T> salvar(@Valid @RequestBody T entity) {
        T saved = service.salvar(entity);
        notificacaoService.criacao(entity.getClass().getSimpleName(), saved.getId().toString());
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<T> atualizar(@PathVariable UUID id, @Valid @RequestBody T entity) {
        T existing = service.buscar(id);
        service.copyProperties(entity, existing);
        T updated = service.salvar(existing);
        notificacaoService.alteracao(existing.getClass().getSimpleName(), id.toString());
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/desativar")
    public ResponseEntity<Void> desativar(@PathVariable UUID id) {
        service.desativar(id);
        notificacaoService.alteracao(service.buscar(id).getClass().getSimpleName(), id.toString());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/restaurar")
    public ResponseEntity<Void> restaurar(@PathVariable UUID id) {
        service.restaurar(id);
        notificacaoService.alteracao(service.buscar(id).getClass().getSimpleName(), id.toString());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable UUID id) {
        T entity = service.buscar(id);
        notificacaoService.exclusao(entity.getClass().getSimpleName(), id.toString());
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/historico")
    public ResponseEntity<List<AuditoriaDTO>> historico(@PathVariable UUID id) {
        T entidade = service.buscar(id);
        @SuppressWarnings("unchecked")
        Class<T> entityClass = (Class<T>) entidade.getClass();
        return ResponseEntity.ok(auditoriaService.buscarHistorico(entityClass, id));
    }
}
