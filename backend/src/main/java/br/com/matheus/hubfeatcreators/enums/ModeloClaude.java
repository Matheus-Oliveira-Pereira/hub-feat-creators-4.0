package br.com.matheus.hubfeatcreators.enums;

import java.util.Arrays;
import java.util.List;

public enum ModeloClaude {
    OPUS_4_8("claude-opus-4-8", "Claude Opus 4.8"),
    OPUS_4_7("claude-opus-4-7", "Claude Opus 4.7"),
    OPUS_4_6("claude-opus-4-6", "Claude Opus 4.6"),
    SONNET_4_6("claude-sonnet-4-6", "Claude Sonnet 4.6"),
    HAIKU_4_5("claude-haiku-4-5", "Claude Haiku 4.5"),
    FABLE_5("claude-fable-5", "Claude Fable 5");

    public static final String PADRAO = "claude-opus-4-8";

    private final String id;
    private final String displayName;

    ModeloClaude(String id, String displayName) {
        this.id = id;
        this.displayName = displayName;
    }

    public String getId() {
        return id;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static boolean isValido(String id) {
        return Arrays.stream(values()).anyMatch(m -> m.id.equals(id));
    }

    public static List<ModeloClaude> listar() {
        return Arrays.asList(values());
    }
}
