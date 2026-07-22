package br.com.matheus.hubfeatcreators.entidades;

import br.com.matheus.hubfeatcreators.entidades.superclasses.Entidade;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;
import org.hibernate.envers.NotAudited;

import java.time.LocalDateTime;

@Entity
@Table(name = "LOG_EMAIL")
@Audited
@Getter
@Setter
@NoArgsConstructor
public class LogEmail extends Entidade {

    public enum Status {
        SUCESSO, FALHA, CANCELADO
    }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "EMAIL_ID", foreignKey = @ForeignKey(name = "FK_LOG_EMAIL_EMAIL"))
    private Email email;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CONTA_EMAIL_ID", foreignKey = @ForeignKey(name = "FK_LOG_EMAIL_CONTA_EMAIL"))
    private ContaEmail contaEmail;

    private String contaNome;

    private String titulo;

    @Column(length = 4096)
    private String erro;

    @Column(length = 2048)
    private String destinatarios;

    /** CC efetivo do envio (join por vírgula). */
    @Column(length = 2048)
    private String copia;

    /** BCC efetivo do envio — informado + fixo da conta (join por vírgula). */
    @Column(length = 2048)
    private String copiaOculta;

    /** Nº de tentativas de reenvio (0 = envio original). Limitado pelo job de auto-retry. */
    @NotAudited
    @Column(name = "tentativas")
    private int tentativas = 0;

    /** Marcado quando o pixel de rastreio é carregado pelo cliente do destinatário. */
    @NotAudited
    @Column(name = "aberto")
    private boolean aberto = false;

    @NotAudited
    @Column(name = "data_abertura")
    private LocalDateTime dataAbertura;
}
