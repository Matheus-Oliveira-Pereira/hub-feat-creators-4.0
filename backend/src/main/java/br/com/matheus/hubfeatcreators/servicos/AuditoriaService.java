package br.com.matheus.hubfeatcreators.servicos;

import br.com.matheus.hubfeatcreators.configuracoes.AuditedRevisionEntity;
import br.com.matheus.hubfeatcreators.entidades.superclasses.Entidade;
import br.com.matheus.hubfeatcreators.visoes.dtos.AuditoriaDTO;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.hibernate.envers.AuditReader;
import org.hibernate.envers.AuditReaderFactory;
import org.hibernate.envers.RevisionType;
import org.hibernate.envers.query.AuditEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class AuditoriaService {

    @PersistenceContext
    private EntityManager entityManager;

    private static final Set<String> CAMPOS_IGNORADOS = Set.of(
            "senha", "perfis", "roles", "versao", "chaveIntegracao", "usuarioRevisao"
    );

    public <T extends Entidade> List<AuditoriaDTO> buscarHistorico(Class<T> entityClass, UUID id) {
        AuditReader reader = AuditReaderFactory.get(entityManager);

        @SuppressWarnings("unchecked")
        List<Object[]> revisions = reader.createQuery()
                .forRevisionsOfEntity(entityClass, false, true)
                .add(AuditEntity.id().eq(id))
                .addOrder(AuditEntity.revisionNumber().desc())
                .getResultList();

        List<AuditoriaDTO> historico = new ArrayList<>();

        for (Object[] row : revisions) {
            T entidade = entityClass.cast(row[0]);
            AuditedRevisionEntity revEntity = (AuditedRevisionEntity) row[1];
            RevisionType revType = (RevisionType) row[2];

            String tipoOperacao = switch (revType) {
                case ADD -> "CRIAÇÃO";
                case MOD -> "ALTERAÇÃO";
                case DEL -> "EXCLUSÃO";
            };

            Map<String, Object> dados = extrairDados(entidade);

            historico.add(new AuditoriaDTO(
                    revEntity.getId(),
                    revEntity.getRevisionDate(),
                    revEntity.getUsuario(),
                    tipoOperacao,
                    dados
            ));
        }

        return historico;
    }

    private Map<String, Object> extrairDados(Entidade entidade) {
        Map<String, Object> dados = new LinkedHashMap<>();

        List<Field> allFields = new ArrayList<>();
        Class<?> clazz = entidade.getClass();
        while (clazz != null && clazz != Object.class) {
            for (Field field : clazz.getDeclaredFields()) {
                allFields.add(field);
            }
            clazz = clazz.getSuperclass();
        }

        for (Field field : allFields) {
            if (CAMPOS_IGNORADOS.contains(field.getName())) continue;
            if (Collection.class.isAssignableFrom(field.getType())) continue;
            if (Map.class.isAssignableFrom(field.getType())) continue;

            field.setAccessible(true);
            try {
                Object value = field.get(entidade);
                if (value != null) {
                    dados.put(field.getName(), value.toString());
                }
            } catch (IllegalAccessException ignored) {
            }
        }

        return dados;
    }
}
