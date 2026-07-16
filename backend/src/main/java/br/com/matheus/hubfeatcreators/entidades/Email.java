package br.com.matheus.hubfeatcreators.entidades;

import br.com.matheus.hubfeatcreators.entidades.superclasses.Entidade;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "EMAIL")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Email extends Entidade {

    private String titulo;

    @Column(length = 10240)
    private String conteudo;

    private String de;

    @ElementCollection(fetch = FetchType.EAGER)
    private List<String> destinatarios = new ArrayList<>();

    /** Destinatários em cópia (CC). */
    @ElementCollection(fetch = FetchType.EAGER)
    private List<String> copia = new ArrayList<>();

    /** Destinatários em cópia oculta (BCC) informados no envio (além dos fixos da conta). */
    @ElementCollection(fetch = FetchType.EAGER)
    private List<String> copiaOculta = new ArrayList<>();

    public Email(String titulo, String conteudo, List<String> destinatarios) {
        this.titulo = titulo;
        this.conteudo = conteudo;
        this.destinatarios = destinatarios;
    }
}
