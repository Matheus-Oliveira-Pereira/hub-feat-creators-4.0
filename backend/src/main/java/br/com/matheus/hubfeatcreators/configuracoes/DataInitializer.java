package br.com.matheus.hubfeatcreators.configuracoes;

import br.com.matheus.hubfeatcreators.entidades.Perfil;
import br.com.matheus.hubfeatcreators.entidades.PublicidadeEntregaveisFormato;
import br.com.matheus.hubfeatcreators.entidades.Usuario;
import br.com.matheus.hubfeatcreators.enums.Role;
import br.com.matheus.hubfeatcreators.enums.StatusPerfil;
import br.com.matheus.hubfeatcreators.enums.StatusUsuario;
import br.com.matheus.hubfeatcreators.repositorios.PerfilRepository;
import br.com.matheus.hubfeatcreators.repositorios.PublicidadeEntregaveisFormatoRepository;
import br.com.matheus.hubfeatcreators.repositorios.UsuarioRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PerfilRepository perfilRepository;
    private final PublicidadeEntregaveisFormatoRepository formatoRepository;
    private final EntityManager entityManager;

    @Override
    @Transactional
    public void run(String... args) {
        seedFormatosEntregavel();

        // ddl-auto:update não atualiza CHECK constraints de colunas enum no PostgreSQL.
        entityManager.createNativeQuery(
                "ALTER TABLE perfil_roles DROP CONSTRAINT IF EXISTS perfil_roles_role_check"
        ).executeUpdate();

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

    /** Pré-cadastra os formatos de entregável (idempotente: só quando a tabela está vazia). */
    private void seedFormatosEntregavel() {
        if (formatoRepository.count() > 0) {
            return;
        }
        List<String> descricoes = List.of(
                "Reels Instagram", "Stories Instagram", "Post Instagram", "TikTok",
                "Inserção YouTube", "Dedicado YouTube", "YouTube Shorts", "Post LinkedIn",
                "Post Discord", "Inserção Newsletter", "Vídeo de Ads", "Presença em Evento"
        );
        descricoes.forEach(desc -> {
            PublicidadeEntregaveisFormato formato = new PublicidadeEntregaveisFormato();
            formato.setDescricao(desc);
            formatoRepository.save(formato);
        });
        log.info("Formatos de entregável pré-cadastrados ({}).", descricoes.size());
    }
}
