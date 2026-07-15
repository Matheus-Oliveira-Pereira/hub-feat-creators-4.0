package br.com.matheus.hubfeatcreators.entidades.superclasses;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Estética opcional de uma seção do mídia kit. Todos os campos são nullable:
 * {@code null} significa "usar o padrão do template" (o front/PDF aplica o default).
 * A edição é totalmente opcional e varia por seção e por template.
 */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EsteticaSessao {

    // Cores (hex, ex.: "#0a0a0a")
    @Column(name = "est_cor_fundo")
    private String corFundo;

    @Column(name = "est_cor_destaque")
    private String corDestaque;

    @Column(name = "est_cor_texto")
    private String corTexto;

    @Column(name = "est_cor_texto_secundario")
    private String corTextoSecundario;

    @Column(name = "est_cor_card")
    private String corCard;

    @Column(name = "est_cor_borda")
    private String corBorda;

    // Tipografia
    @Column(name = "est_fonte_titulo")
    private String fonteTitulo;

    @Column(name = "est_tamanho_nome_capa")
    private Integer tamanhoNomeCapa;

    @Column(name = "est_tamanho_titulo")
    private Integer tamanhoTitulo;

    @Column(name = "est_tamanho_texto")
    private Integer tamanhoTexto;

    // Layout e espaçamento
    @Column(name = "est_padding_pagina")
    private Integer paddingPagina;

    @Column(name = "est_altura_pagina")
    private Integer alturaPagina;

    @Column(name = "est_gap_cards")
    private Integer gapCards;

    @Column(name = "est_raio_borda")
    private Integer raioBorda;

    /** Escala das fotos da seção em % (100 = tamanho padrão). */
    @Column(name = "est_escala_fotos")
    private Integer escalaFotos;

    // Alinhamento ("left" | "center" | "right")
    @Column(name = "est_alinhamento_titulo")
    private String alinhamentoTitulo;

    @Column(name = "est_alinhamento_conteudo")
    private String alinhamentoConteudo;
}
