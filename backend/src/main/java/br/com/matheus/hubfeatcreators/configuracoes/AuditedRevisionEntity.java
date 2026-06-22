package br.com.matheus.hubfeatcreators.configuracoes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.envers.DefaultRevisionEntity;
import org.hibernate.envers.RevisionEntity;

@Entity
@Table(name = "REVINFO")
@RevisionEntity(AuditedRevisionListener.class)
@Getter
@Setter
public class AuditedRevisionEntity extends DefaultRevisionEntity {

    @Column(name = "usuario")
    private String usuario;
}
