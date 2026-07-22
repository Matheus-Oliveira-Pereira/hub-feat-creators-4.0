package br.com.matheus.hubfeatcreators.configuracoes;

import br.com.matheus.hubfeatcreators.exceptions.ConfiguracaoInvalidaException;
import br.com.matheus.hubfeatcreators.exceptions.EntidadeNaoEncontradaException;
import br.com.matheus.hubfeatcreators.exceptions.RegraNegocioException;
import com.anthropic.errors.AnthropicServiceException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /** Mensagem padrão do Postgres pra unique violation: "... Detail: Key (coluna)=(valor) already exists." */
    private static final Pattern COLUNA_DUPLICADA = Pattern.compile("Key \\(([^)]+)\\)=");

    private static final Map<String, String> MENSAGENS_UNICIDADE = Map.ofEntries(
            Map.entry("email", "Já existe um registro com este e-mail"),
            Map.entry("descricao", "Já existe um registro com esta descrição"),
            Map.entry("nome", "Já existe um registro com este nome"),
            Map.entry("instagram", "Já existe um influenciador com este Instagram"),
            Map.entry("tiktok", "Já existe um influenciador com este TikTok"),
            Map.entry("linkedin", "Já existe um influenciador com este LinkedIn"),
            Map.entry("youtube", "Já existe um influenciador com este YouTube"),
            Map.entry("discord", "Já existe um influenciador com este Discord")
    );

    private Map<String, Object> corpoErro(HttpStatus status, String error, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());
        body.put("error", error);
        body.put("message", message);
        return body;
    }

    @ExceptionHandler(EntidadeNaoEncontradaException.class)
    public ResponseEntity<Map<String, Object>> handleEntidadeNaoEncontrada(EntidadeNaoEncontradaException ex) {
        log.debug("Entidade não encontrada: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(corpoErro(HttpStatus.NOT_FOUND, "Não Encontrado", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        log.debug("Falha de validação: {}", ex.getMessage());
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Requisição Inválida");

        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                fieldErrors.put(error.getField(), error.getDefaultMessage()));
        body.put("errors", fieldErrors);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, Object>> handleAuthentication(AuthenticationException ex) {
        log.warn("Falha de autenticação: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(corpoErro(HttpStatus.UNAUTHORIZED, "Não Autorizado", ex.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        log.warn("Acesso negado: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(corpoErro(HttpStatus.FORBIDDEN, "Acesso Negado", "Você não tem permissão para executar esta ação."));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(DataIntegrityViolationException ex) {
        log.warn("Violação de integridade de dados: {}", ex.getMessage());
        String rootMsg = ex.getMostSpecificCause().getMessage();
        String mensagem = "Registro duplicado. Já existe um registro com os mesmos dados únicos";

        if (rootMsg != null) {
            Matcher matcher = COLUNA_DUPLICADA.matcher(rootMsg);
            if (matcher.find()) {
                mensagem = MENSAGENS_UNICIDADE.getOrDefault(matcher.group(1), mensagem);
            }
        }

        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(corpoErro(HttpStatus.CONFLICT, "Conflito", mensagem));
    }

    @ExceptionHandler(ConfiguracaoInvalidaException.class)
    public ResponseEntity<Map<String, Object>> handleConfiguracaoInvalida(ConfiguracaoInvalidaException ex) {
        log.debug("Configuração inválida: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(corpoErro(HttpStatus.BAD_REQUEST, "Configuração Inválida", ex.getMessage()));
    }

    @ExceptionHandler(RegraNegocioException.class)
    public ResponseEntity<Map<String, Object>> handleRegraNegocio(RegraNegocioException ex) {
        log.debug("Regra de negócio violada: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(corpoErro(HttpStatus.BAD_REQUEST, "Requisição Inválida", ex.getMessage()));
    }

    @ExceptionHandler({ NumberFormatException.class, DateTimeParseException.class, IllegalArgumentException.class })
    public ResponseEntity<Map<String, Object>> handleParametroInvalido(RuntimeException ex) {
        log.warn("Parâmetro inválido na requisição: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(corpoErro(HttpStatus.BAD_REQUEST, "Parâmetro Inválido", ex.getMessage()));
    }

    @ExceptionHandler(AnthropicServiceException.class)
    public ResponseEntity<Map<String, Object>> handleAnthropic(AnthropicServiceException ex) {
        log.error("Falha ao chamar a API do Claude", ex);
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(corpoErro(HttpStatus.BAD_GATEWAY, "Erro na API do Claude", "Falha ao chamar o Claude: " + ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        log.error("Erro não tratado", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(corpoErro(HttpStatus.INTERNAL_SERVER_ERROR, "Erro Interno do Servidor", "Erro interno do servidor."));
    }
}
