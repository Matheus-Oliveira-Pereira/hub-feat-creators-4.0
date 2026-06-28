package br.com.matheus.hubfeatcreators.servicos;

import br.com.matheus.hubfeatcreators.entidades.PublicidadeEntregaveisFormato;
import br.com.matheus.hubfeatcreators.repositorios.PublicidadeEntregaveisFormatoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PublicidadeEntregaveisFormatoService
        extends EntidadeService<PublicidadeEntregaveisFormato, PublicidadeEntregaveisFormatoRepository> {

    public List<PublicidadeEntregaveisFormato> listarTodos() {
        return repository.findAllByOrderByDescricaoAsc();
    }
}
