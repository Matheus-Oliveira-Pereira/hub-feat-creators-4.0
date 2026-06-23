package br.com.matheus.hubfeatcreators.enums;

public enum TipoSessao {
    CAPA("Capa", false),
    SOBRE_INFLUENCIADOR("Sobre o influenciador", false),
    CONTEUDOS("Conteúdos", true),
    INSIGHTS_INSTAGRAM("Insights — Instagram", true),
    INSIGHTS_TIKTOK("Insights — TikTok", true),
    INSIGHTS_YOUTUBE("Insights — YouTube", true),
    MARCAS("Marcas que já trabalhou", false),
    EXEMPLOS_PUBLIS("Exemplos de publis", false),
    CONTATO("Contato", false);

    private final String label;
    private final boolean requerPrint;

    TipoSessao(String label, boolean requerPrint) {
        this.label = label;
        this.requerPrint = requerPrint;
    }

    public String getLabel() {
        return label;
    }

    public boolean isRequerPrint() {
        return requerPrint;
    }
}
