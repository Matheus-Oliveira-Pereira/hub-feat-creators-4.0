package br.com.matheus.hubfeatcreators.configuracoes;

import br.com.matheus.hubfeatcreators.entidades.Perfil;
import br.com.matheus.hubfeatcreators.entidades.PublicidadeEntregaveisFormato;
import br.com.matheus.hubfeatcreators.entidades.TemplateEmail;
import br.com.matheus.hubfeatcreators.entidades.Usuario;
import br.com.matheus.hubfeatcreators.enums.Role;
import br.com.matheus.hubfeatcreators.enums.StatusPerfil;
import br.com.matheus.hubfeatcreators.enums.StatusTemplateEmail;
import br.com.matheus.hubfeatcreators.enums.StatusUsuario;
import br.com.matheus.hubfeatcreators.enums.TipoTemplateEmail;
import br.com.matheus.hubfeatcreators.repositorios.PerfilRepository;
import br.com.matheus.hubfeatcreators.repositorios.PublicidadeEntregaveisFormatoRepository;
import br.com.matheus.hubfeatcreators.repositorios.TemplateEmailRepository;
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
    private final TemplateEmailRepository templateEmailRepository;
    private final EntityManager entityManager;

    @Override
    @Transactional
    public void run(String... args) {
        seedFormatosEntregavel();
        seedTemplatesEmail();

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

    /** Pré-cadastra um template padrão por tipo (idempotente: só quando a tabela está vazia). */
    private void seedTemplatesEmail() {
        if (templateEmailRepository.count() > 0) {
            return;
        }
        TemplateEmail prospecao = new TemplateEmail();
        prospecao.setNome("Prospecção — padrão");
        prospecao.setTipo(TipoTemplateEmail.PROSPECAO);
        prospecao.setPadrao(true);
        prospecao.setStatus(StatusTemplateEmail.ATIVO);
        prospecao.setAssunto("Parceria com {{influenciador}}");
        prospecao.setCorpo("<p>Olá, {{contato}}!</p>"
                + "<p>Sou da assessoria do(a) <strong>{{influenciador}}</strong> ({{nicho}}) e gostaria de "
                + "apresentar uma proposta de parceria com a <strong>{{marca}}</strong>.</p>"
                + "<p>Podemos conversar sobre os detalhes?</p>"
                + "<p>Abraços!</p>");
        templateEmailRepository.save(prospecao);

        TemplateEmail followUp = new TemplateEmail();
        followUp.setNome("Follow-up — padrão");
        followUp.setTipo(TipoTemplateEmail.FOLLOW_UP);
        followUp.setPadrao(true);
        followUp.setStatus(StatusTemplateEmail.ATIVO);
        followUp.setAssunto("Retomando contato — {{marca}}");
        followUp.setCorpo("<p>Olá, {{contato}}!</p>"
                + "<p>Retomando nosso contato sobre a parceria entre <strong>{{marca}}</strong> e "
                + "<strong>{{influenciador}}</strong>.</p>"
                + "<p>Ficou alguma dúvida sobre a proposta? Fico à disposição.</p>"
                + "<p>Abraços!</p>");
        templateEmailRepository.save(followUp);

        log.info("Templates de e-mail pré-cadastrados (2).");
    }
}
