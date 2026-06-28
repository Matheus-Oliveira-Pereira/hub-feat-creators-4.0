package br.com.matheus.hubfeatcreators.servicos;

import br.com.matheus.hubfeatcreators.entidades.ContatoMarca;
import br.com.matheus.hubfeatcreators.entidades.Marca;
import br.com.matheus.hubfeatcreators.enums.StatusMarca;
import br.com.matheus.hubfeatcreators.exceptions.RegraNegocioException;
import br.com.matheus.hubfeatcreators.repositorios.MarcaRepository;
import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.repositorios.MarcaDTORepository;
import br.com.matheus.hubfeatcreators.visoes.telas.marca.MarcaDTO;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class MarcaService extends EntidadeService<Marca, MarcaRepository> {

    @Autowired
    private MarcaDTORepository dtoRepository;

    public PaginatedResponse<MarcaDTO> listarDTO(Map<String, String[]> requestParams) {
        return dtoRepository.listar(requestParams);
    }

    public List<Marca> listarAtivos() {
        return repository.findByStatus(StatusMarca.ATIVO);
    }

    @Override
    public Marca salvar(Marca entidade) {
        if (entidade.getStatus() == null) {
            entidade.setStatus(StatusMarca.ATIVO);
        }
        sanitizarContatos(entidade);
        validarContatos(entidade);
        return super.salvar(entidade);
    }

    /**
     * Atualização: copia campos simples e sincroniza os contatos DENTRO da coleção gerenciada
     * (orphanRemoval exige mutar a mesma instância). Filhos recriados a cada update (id=null).
     */
    @Override
    public void copyProperties(Marca source, Marca target) {
        BeanUtils.copyProperties(source, target, "id", "versao", "registro", "criadoPor", "contatos");
        target.getContatos().clear();
        if (source.getContatos() != null) {
            for (ContatoMarca c : source.getContatos()) {
                c.setId(null);
                c.setMarca(target);
                target.getContatos().add(c);
            }
        }
    }

    /**
     * Remove contatos 100% vazios, faz trim, seta marca e reindexa a ordem.
     * Muta a coleção in-place (clear + addAll) para preservar a referência gerenciada
     * pelo orphanRemoval — substituir por nova lista quebra a entidade gerenciada no update.
     */
    private void sanitizarContatos(Marca marca) {
        if (marca.getContatos() == null) {
            marca.setContatos(new ArrayList<>());
            return;
        }
        List<ContatoMarca> validos = new ArrayList<>();
        int ordem = 0;
        for (ContatoMarca c : marca.getContatos()) {
            c.setNome(trim(c.getNome()));
            c.setEmail(trim(c.getEmail()));
            c.setTelefone(trim(c.getTelefone()));
            boolean vazio = c.getNome() == null && c.getEmail() == null && c.getTelefone() == null;
            if (vazio) continue;
            c.setMarca(marca);
            c.setOrdem(ordem++);
            validos.add(c);
        }
        marca.getContatos().clear();
        marca.getContatos().addAll(validos);
    }

    /** Cada contato precisa de nome + (email OU telefone). */
    private void validarContatos(Marca marca) {
        for (ContatoMarca c : marca.getContatos()) {
            if (c.getNome() == null) {
                throw new RegraNegocioException("Todo contato precisa de um nome.");
            }
            if (c.getEmail() == null && c.getTelefone() == null) {
                throw new RegraNegocioException("O contato \"" + c.getNome() + "\" precisa de um e-mail ou telefone.");
            }
        }
    }

    private String trim(String v) {
        return (v == null || v.isBlank()) ? null : v.trim();
    }
}
