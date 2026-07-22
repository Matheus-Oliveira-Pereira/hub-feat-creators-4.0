package br.com.matheus.hubfeatcreators.servicos;

import br.com.matheus.hubfeatcreators.entidades.Usuario;
import br.com.matheus.hubfeatcreators.exceptions.EntidadeNaoEncontradaException;
import br.com.matheus.hubfeatcreators.exceptions.RegraNegocioException;
import br.com.matheus.hubfeatcreators.repositorios.UsuarioRepository;
import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.repositorios.UsuarioDTORepository;
import br.com.matheus.hubfeatcreators.visoes.telas.usuario.UsuarioDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class UsuarioService extends EntidadeService<Usuario, UsuarioRepository> {

    private final UsuarioDTORepository dtoRepository;

    private final PasswordEncoder passwordEncoder;

    public Usuario findByEmail(String email) {
        return repository.findByEmail(email)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Usuário não encontrado com email: " + email));
    }

    public PaginatedResponse<UsuarioDTO> listarDTO(Map<String, String[]> requestParams) {
        return dtoRepository.listar(requestParams);
    }

    /** Hasheia a senha antes de salvar. Em edição, o campo já chega hasheado (copyProperties exclui "senha" do PUT). */
    @Override
    public Usuario salvar(Usuario entidade) {
        if (entidade.getSenha() != null && !isHashBcrypt(entidade.getSenha())) {
            entidade.setSenha(passwordEncoder.encode(entidade.getSenha()));
        }
        return super.salvar(entidade);
    }

    private boolean isHashBcrypt(String senha) {
        return senha.startsWith("$2a$") || senha.startsWith("$2b$");
    }

    /** Troca de senha self-service: verifica a senha atual antes de gravar a nova. */
    public void alterarSenha(Usuario usuario, String senhaAtual, String novaSenha) {
        if (senhaAtual == null || !passwordEncoder.matches(senhaAtual, usuario.getSenha())) {
            throw new RegraNegocioException("Senha atual incorreta.");
        }
        if (novaSenha == null || novaSenha.length() < 4) {
            throw new RegraNegocioException("A nova senha deve ter no mínimo 4 caracteres.");
        }
        usuario.setSenha(novaSenha); // salvar() hasheia
        salvar(usuario);
    }
}
