package br.com.matheus.hubfeatcreators.configuracoes;

import br.com.matheus.hubfeatcreators.entidades.Perfil;
import br.com.matheus.hubfeatcreators.entidades.Usuario;
import br.com.matheus.hubfeatcreators.enums.Role;
import br.com.matheus.hubfeatcreators.enums.StatusPerfil;
import br.com.matheus.hubfeatcreators.enums.StatusUsuario;
import br.com.matheus.hubfeatcreators.repositorios.PerfilRepository;
import br.com.matheus.hubfeatcreators.repositorios.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PerfilRepository perfilRepository;

    @Override
    @Transactional
    public void run(String... args) {
        // Garante o perfil ADMINISTRADOR com TODAS as roles (inclui novas a cada boot).
        Perfil perfilAdmin = perfilRepository.findByDescricao("ADMINISTRADOR")
                .orElseGet(() -> {
                    Perfil perfil = new Perfil();
                    perfil.setDescricao("ADMINISTRADOR");
                    perfil.setStatus(StatusPerfil.ATIVO);
                    perfil.setRoles(EnumSet.allOf(Role.class));
                    return perfilRepository.save(perfil);
                });

        // Sincroniza roles do admin com o enum atual (ex: MDK/CFG adicionadas depois).
        Set<Role> todasRoles = EnumSet.allOf(Role.class);
        if (!perfilAdmin.getRoles().containsAll(todasRoles)) {
            perfilAdmin.getRoles().addAll(todasRoles);
            perfilRepository.save(perfilAdmin);
            log.info("Roles do perfil ADMINISTRADOR sincronizadas ({} roles).", todasRoles.size());
        }

        if (usuarioRepository.findByEmail("admin@mop.com").isPresent()) {
            return;
        }

        log.info("Criando usuário administrador padrão...");

        Usuario admin = new Usuario();
        admin.setNome("Administrador");
        admin.setEmail("admin@mop.com");
        admin.setSenha("1234");
        admin.setStatus(StatusUsuario.ATIVO);
        admin.setPerfis(Set.of(perfilAdmin));
        usuarioRepository.save(admin);

        log.info("Usuário administrador criado: admin@mop.com");
    }
}
