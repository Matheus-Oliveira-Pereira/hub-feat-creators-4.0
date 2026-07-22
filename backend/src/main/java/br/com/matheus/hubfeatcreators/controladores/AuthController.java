package br.com.matheus.hubfeatcreators.controladores;

import br.com.matheus.hubfeatcreators.configuracoes.JwtService;
import br.com.matheus.hubfeatcreators.entidades.Usuario;
import br.com.matheus.hubfeatcreators.servicos.UsuarioService;
import br.com.matheus.hubfeatcreators.visoes.dtos.LoginRequest;
import br.com.matheus.hubfeatcreators.visoes.dtos.LoginResponse;
import br.com.matheus.hubfeatcreators.visoes.dtos.RefreshTokenRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

/**
 * Login/refresh apenas. Cadastro de usuário é feito só internamente, via
 * POST /api/usuarios (autenticado, exige ROLE_USRA) — não existe rota pública de registro.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final UsuarioService usuarioService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.senha())
        );

        Usuario usuario = (Usuario) authentication.getPrincipal();

        // Registra o login: guarda o anterior (retornado ao cliente) e grava o atual.
        LocalDateTime loginAnterior = usuario.getUltimoLogin();
        usuario.setUltimoLogin(LocalDateTime.now());
        usuarioService.salvar(usuario);

        String token = jwtService.generateToken(usuario);
        String refreshToken = jwtService.generateRefreshToken(usuario);

        return ResponseEntity.ok(new LoginResponse(token, refreshToken, usuario.getEmail(), usuario.getNome(), loginAnterior));
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        String refreshToken = request.refreshToken();
        String email = jwtService.extractUsername(refreshToken);

        UserDetails userDetails = userDetailsService.loadUserByUsername(email);

        if (!jwtService.isTokenValid(refreshToken, userDetails) || !jwtService.isRefreshToken(refreshToken)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Usuario usuario = (Usuario) userDetails;
        String newToken = jwtService.generateToken(usuario);
        String newRefreshToken = jwtService.generateRefreshToken(usuario);

        return ResponseEntity.ok(new LoginResponse(newToken, newRefreshToken, usuario.getEmail(), usuario.getNome(), usuario.getUltimoLogin()));
    }
}
