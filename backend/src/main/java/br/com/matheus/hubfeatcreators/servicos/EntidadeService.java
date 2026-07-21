package br.com.matheus.hubfeatcreators.servicos;

import br.com.matheus.hubfeatcreators.entidades.superclasses.Entidade;
import br.com.matheus.hubfeatcreators.exceptions.EntidadeNaoEncontradaException;
import br.com.matheus.hubfeatcreators.repositorios.EntidadeRepository;
import br.com.matheus.hubfeatcreators.interfaces.Desativavel;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.UUID;

public abstract class EntidadeService<T extends Entidade, R extends EntidadeRepository<T>> {

    @Autowired
    protected R repository;

    public T buscar(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Entidade não encontrada com id: " + id));
    }

    public List<T> listar() {
        return repository.findAll();
    }

    public T salvar(T entidade) {
        return repository.save(entidade);
    }

    public T desativar(UUID id) {
        T entidade = buscar(id);
        if (entidade instanceof Desativavel desativavel) {
            desativavel.desativar();
            repository.save(entidade);
        }
        return entidade;
    }

    public T restaurar(UUID id) {
        T entidade = buscar(id);
        if (entidade instanceof Desativavel desativavel) {
            desativavel.restaurar();
            repository.save(entidade);
        }
        return entidade;
    }

    public void excluir(UUID id) {
        buscar(id);
        repository.deleteById(id);
    }

    public void copyProperties(T source, T target) {
        BeanUtils.copyProperties(source, target, "id", "versao", "registro", "criadoPor", "senha");
    }
}
