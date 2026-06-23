package br.com.matheus.hubfeatcreators.entidades;

import br.com.matheus.hubfeatcreators.configuracoes.AesAttributeConverter;
import br.com.matheus.hubfeatcreators.entidades.superclasses.Entidade;
import br.com.matheus.hubfeatcreators.enums.ModeloClaude;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;
import org.hibernate.envers.NotAudited;

@Entity
@Table(name = "CONFIGURACAO")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Configuracao extends Entidade {

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Convert(converter = AesAttributeConverter.class)
    @Column(name = "claude_api_key", columnDefinition = "TEXT")
    @NotAudited
    private String claudeApiKey;

    @Column(name = "claude_modelo")
    private String claudeModelo = ModeloClaude.PADRAO;
}
