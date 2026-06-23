package br.com.matheus.hubfeatcreators.repositorios;

import br.com.matheus.hubfeatcreators.entidades.MidiaKitTemplate;
import br.com.matheus.hubfeatcreators.enums.StatusMidiaKitTemplate;

import java.util.List;

public interface MidiaKitTemplateRepository extends EntidadeRepository<MidiaKitTemplate> {

    List<MidiaKitTemplate> findByStatus(StatusMidiaKitTemplate status);
}
