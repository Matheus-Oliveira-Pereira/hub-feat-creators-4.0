package br.com.matheus.hubfeatcreators.controladores;

import br.com.matheus.hubfeatcreators.entidades.superclasses.Entidade;
import br.com.matheus.hubfeatcreators.servicos.AuditoriaService;
import br.com.matheus.hubfeatcreators.servicos.EntidadeService;
import br.com.matheus.hubfeatcreators.servicos.NotificacaoService;
import br.com.matheus.hubfeatcreators.visoes.dtos.AuditoriaDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

/**
 * CRUD genérico. Cada subclasse informa seu prefixo de módulo (ex: "USR") via
 * {@link #getModulo()}, usado nas expressões {@code @PreAuthorize} abaixo para
 * exigir a role ABCD correspondente (ex: ROLE_USRB para buscar/listar).
 */
public abstract class EntidadeController<T extends Entidade, S extends EntidadeService<T, ?>> {

    @Autowired
    protected S service;

    @Autowired
    private AuditoriaService auditoriaService;

    @Autowired
    private NotificacaoService notificacaoService;

    /** Prefixo de 3 letras do módulo (ex: "USR", "PRF") — usado para montar as roles ABCD. */
    public abstract String getModulo();

    @PreAuthorize("hasAuthority('ROLE_' + this.getModulo() + 'B')")
    @GetMapping("/{id}")
    public ResponseEntity<T> buscar(@PathVariable UUID id) {
        return ResponseEntity.ok(service.buscar(id));
    }

    @PreAuthorize("hasAuthority('ROLE_' + this.getModulo() + 'B')")
    @GetMapping
    public ResponseEntity<List<T>> listar() {
        return ResponseEntity.ok(service.listar());
    }

    @PreAuthorize("hasAuthority('ROLE_' + this.getModulo() + 'A')")
    @PostMapping
    public ResponseEntity<T> salvar(@Valid @RequestBody T entity) {
        T saved = service.salvar(entity);
        notificacaoService.criacao(entity.getClass().getSimpleName(), saved.getId().toString());
        return ResponseEntity.ok(saved);
    }

    @PreAuthorize("hasAuthority('ROLE_' + this.getModulo() + 'C')")
    @PutMapping("/{id}")
    public ResponseEntity<T> atualizar(@PathVariable UUID id, @Valid @RequestBody T entity) {
        T existing = service.buscar(id);
        service.copyProperties(entity, existing);
        T updated = service.salvar(existing);
        notificacaoService.alteracao(existing.getClass().getSimpleName(), id.toString());
        return ResponseEntity.ok(updated);
    }

    @PreAuthorize("hasAuthority('ROLE_' + this.getModulo() + 'C')")
    @PatchMapping("/{id}/desativar")
    public ResponseEntity<Void> desativar(@PathVariable UUID id) {
        T entidade = service.desativar(id);
        notificacaoService.alteracao(entidade.getClass().getSimpleName(), id.toString());
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAuthority('ROLE_' + this.getModulo() + 'C')")
    @PatchMapping("/{id}/restaurar")
    public ResponseEntity<Void> restaurar(@PathVariable UUID id) {
        T entidade = service.restaurar(id);
        notificacaoService.alteracao(entidade.getClass().getSimpleName(), id.toString());
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAuthority('ROLE_' + this.getModulo() + 'D')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable UUID id) {
        T entity = service.buscar(id);
        notificacaoService.exclusao(entity.getClass().getSimpleName(), id.toString());
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAuthority('ROLE_' + this.getModulo() + 'B')")
    @GetMapping("/{id}/historico")
    public ResponseEntity<List<AuditoriaDTO>> historico(@PathVariable UUID id) {
        T entidade = service.buscar(id);
        @SuppressWarnings("unchecked")
        Class<T> entityClass = (Class<T>) entidade.getClass();
        return ResponseEntity.ok(auditoriaService.buscarHistorico(entityClass, id));
    }
}
