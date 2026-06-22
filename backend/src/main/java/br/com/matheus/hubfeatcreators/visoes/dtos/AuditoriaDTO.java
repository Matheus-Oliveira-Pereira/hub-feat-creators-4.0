package br.com.matheus.hubfeatcreators.visoes.dtos;

import lombok.Data;
import java.util.Date;
import java.util.Map;

@Data
public class AuditoriaDTO {
    private Integer revisao;
    private Date data;
    private String usuario;
    private String tipoOperacao;
    private Map<String, Object> dados;

    public AuditoriaDTO(Integer revisao, Date data, String usuario, String tipoOperacao, Map<String, Object> dados) {
        this.revisao = revisao;
        this.data = data;
        this.usuario = usuario;
        this.tipoOperacao = tipoOperacao;
        this.dados = dados;
    }
}
