package br.com.matheus.hubfeatcreators.entidades;

import br.com.matheus.hubfeatcreators.entidades.superclasses.Entidade;
import br.com.matheus.hubfeatcreators.entidades.superclasses.EsteticaSessao;
import br.com.matheus.hubfeatcreators.enums.TipoSessao;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

@Entity
@Table(name = "SESSAO_MIDIA_KIT")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SessaoMidiaKit extends Entidade {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    @JsonIgnore
    private MidiaKitTemplate template;

    @Enumerated(EnumType.STRING)
    private TipoSessao tipo;

    private Integer ordem;

    private String titulo;

    /** Seção ligada/desligada no PDF sem remover do template. */
    private Boolean ativa = true;

    @Column(columnDefinition = "TEXT")
    private String conteudo;

    @Column(name = "analytics_json", columnDefinition = "TEXT")
    private String analyticsJson;

    /** JSON array de imagens (data URLs base64) anexadas à seção. */
    @Column(columnDefinition = "TEXT")
    private String fotos;

    /** JSON estruturado por tipo (redes da capa, links das fotos, comando de extração, contatos). */
    @Column(columnDefinition = "TEXT")
    private String config;

    /** Estética opcional da seção (cores, tipografia, layout). Campos null = padrão do template. */
    @Embedded
    private EsteticaSessao estetica;
}
