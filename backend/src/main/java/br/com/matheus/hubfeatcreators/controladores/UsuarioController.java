package br.com.matheus.hubfeatcreators.controladores;

import br.com.matheus.hubfeatcreators.entidades.Usuario;
import br.com.matheus.hubfeatcreators.servicos.UsuarioService;
import br.com.matheus.hubfeatcreators.visoes.dtos.AlterarSenhaRequest;
import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.telas.usuario.UsuarioDTO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController extends EntidadeController<Usuario, UsuarioService> {

    @Override
    public String getModulo() {
        return "USR";
    }

    @PreAuthorize("hasAuthority('ROLE_USRB')")
    @GetMapping("/listar")
    public ResponseEntity<PaginatedResponse<UsuarioDTO>> listarDTO(HttpServletRequest request) {
        return ResponseEntity.ok(service.listarDTO(request.getParameterMap()));
    }

    /** Troca de senha do próprio usuário autenticado (não exige role de módulo). */
    @PatchMapping("/me/senha")
    public ResponseEntity<Void> alterarSenha(@AuthenticationPrincipal Usuario usuario,
                                             @Valid @RequestBody AlterarSenhaRequest body) {
        service.alterarSenha(usuario, body.senhaAtual(), body.novaSenha());
        return ResponseEntity.noContent().build();
    }
}
