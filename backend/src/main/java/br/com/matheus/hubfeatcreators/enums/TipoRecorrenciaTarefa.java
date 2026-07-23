package br.com.matheus.hubfeatcreators.enums;

import java.time.LocalDate;

/** Frequências de recorrência de tarefa, relativas à previsão de término. */
public enum TipoRecorrenciaTarefa {
    DIARIA,
    SEMANAL,
    QUINZENAL,
    MENSAL,
    TRIMESTRAL,
    SEMESTRAL,
    ANUAL;

    /** Próxima previsão de término a partir da atual. */
    public LocalDate proxima(LocalDate base) {
        return switch (this) {
            case DIARIA -> base.plusDays(1);
            case SEMANAL -> base.plusWeeks(1);
            case QUINZENAL -> base.plusWeeks(2);
            case MENSAL -> base.plusMonths(1);
            case TRIMESTRAL -> base.plusMonths(3);
            case SEMESTRAL -> base.plusMonths(6);
            case ANUAL -> base.plusYears(1);
        };
    }
}
