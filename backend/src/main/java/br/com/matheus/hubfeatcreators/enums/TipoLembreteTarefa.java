package br.com.matheus.hubfeatcreators.enums;

import java.time.LocalDate;

/** Lembretes pré-definidos de tarefa, relativos à previsão de término. */
public enum TipoLembreteTarefa {
    UMA_SEMANA_ANTES,
    UM_DIA_ANTES,
    NO_DIA,
    UM_DIA_ATRASO;

    /** Data em que o lembrete deve ser disparado para a previsão de término informada. */
    public LocalDate dataDisparo(LocalDate previsaoTermino) {
        return switch (this) {
            case UMA_SEMANA_ANTES -> previsaoTermino.minusDays(7);
            case UM_DIA_ANTES -> previsaoTermino.minusDays(1);
            case NO_DIA -> previsaoTermino;
            case UM_DIA_ATRASO -> previsaoTermino.plusDays(1);
        };
    }
}
