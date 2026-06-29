package br.com.matheus.hubfeatcreators.repositorios;

import br.com.matheus.hubfeatcreators.entidades.TemplateEmail;
import br.com.matheus.hubfeatcreators.enums.StatusTemplateEmail;
import br.com.matheus.hubfeatcreators.enums.TipoTemplateEmail;

import java.util.List;
import java.util.UUID;

public interface TemplateEmailRepository extends EntidadeRepository<TemplateEmail> {

    List<TemplateEmail> findByTipoAndStatusOrderByNomeAsc(TipoTemplateEmail tipo, StatusTemplateEmail status);

    List<TemplateEmail> findByTipoAndPadraoTrueAndIdNot(TipoTemplateEmail tipo, UUID id);
}
