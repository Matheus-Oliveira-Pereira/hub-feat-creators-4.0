package br.com.matheus.hubfeatcreators.configuracoes;

import org.springframework.cache.interceptor.KeyGenerator;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.Map;

/**
 * Gera chave de cache estável para os métodos de MetricasRepository, que recebem
 * Map&lt;String,String[]&gt; (o String[] não tem hashCode estável, então cachear o Map cru
 * não deduplica). Extrai só os params relevantes, ordenados, e prefixa com o nome do
 * método (desambigua métodos que compartilham o mesmo cache).
 */
@Component("metricasKeyGenerator")
public class MetricasKeyGenerator implements KeyGenerator {

    private static final String[] PARAMS_RELEVANTES = {
            "influenciador", "marca", "dataDe", "dataAte", "limite"
    };

    @Override
    @NonNull
    public Object generate(@NonNull Object target, @NonNull Method method, @NonNull Object... params) {
        StringBuilder chave = new StringBuilder(method.getName());
        if (params.length > 0 && params[0] instanceof Map<?, ?> req) {
            for (String chaveParam : PARAMS_RELEVANTES) {
                Object valor = req.get(chaveParam);
                chave.append('|').append(chaveParam).append('=');
                if (valor instanceof String[] arr && arr.length > 0) {
                    chave.append(arr[0]);
                }
            }
        }
        return chave.toString();
    }
}
