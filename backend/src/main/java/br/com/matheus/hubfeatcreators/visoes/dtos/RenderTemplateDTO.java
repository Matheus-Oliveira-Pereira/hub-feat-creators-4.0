package br.com.matheus.hubfeatcreators.visoes.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RenderTemplateDTO {
    private String assunto;
    private String corpo;
}
