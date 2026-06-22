# Hub Feat Creators

Sistema de assessoria de influenciadores (hub feat creators). Java/Spring Boot + PostgreSQL backend, React/Vite + PrimeReact frontend.

## Stack

**Backend** — Spring Boot 3.3.5, Java 17, Spring Security (JWT + refresh), Spring Data JPA, Hibernate Envers (auditoria), PostgreSQL, Bucket4j (rate limit), Lombok, Logback JSON.

**Frontend** — React 18, Vite 6, TypeScript 5 (strict), PrimeReact 10, SCSS, TanStack Query 5, Axios, React Router 6, STOMP/SockJS (WebSocket).

## Comandos

```bash
# Backend (porta 8080)
cd backend && ./mvnw spring-boot:run
cd backend && ./mvnw test

# Frontend (porta 5173)
cd frontend && npm run dev
cd frontend && npm run build
cd frontend && npm test          # vitest
```

PostgreSQL local: db `hub_feat_creators`, user/pass `postgres` (override via env `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`). `ddl-auto: update` — schema gerado automaticamente.

**Admin seed** (DataInitializer): `admin@mop.com` / `1234`, perfil ADMINISTRADOR (todas roles).

## Arquitetura backend

Pacote raiz `br.com.matheus.hubfeatcreators`. Hierarquia genérica de CRUD — herde, não duplique:

```
Entidade (@MappedSuperclass) → EntidadeRepository<T> → EntidadeService<T,R> → EntidadeController<T,S>
```

- **entidades/superclasses/Entidade** — id (UUID), versao (@Version), audit fields (criadoPor, modificadoPor, registro, ultimaModificacao), chaveIntegracao, usuarioRevisao.
- **entidades/** — `Usuario` (implements UserDetails + Desativavel), `Perfil` (Desativavel). Ambos `@Audited`. Coleções ManyToMany/ElementCollection marcadas `@NotAudited`.
- **servicos/EntidadeService** — buscar, listar, salvar, excluir, desativar, restaurar, copyProperties (exclui id/versao/registro/criadoPor/senha).
- **controladores/EntidadeController** — GET `/{id}`, GET (lista), POST, PUT `/{id}`, PATCH `/{id}/desativar`, PATCH `/{id}/restaurar`, DELETE `/{id}`, GET `/{id}/historico`. Desativar/restaurar são PATCH (evita conflito de path com PUT no Spring 3.x).
- **visoes/** — camada de leitura. `telas/{entidade}/XDTO` (projeção de listagem), `repositorios/XDTORepository` (HQL dinâmico com filtros + paginação), `dtos/PaginatedResponse`.
- **configuracoes/** — SecurityConfiguration (stateless, JWT filter, `/api/auth/**` e `/ws/**` liberados), JwtService, RateLimitFilter, WebSocketConfig, GlobalExceptionHandler, DataInitializer.

### Padrões backend

- **Soft delete** — `Desativavel` interface (desativar/restaurar alteram status). Nunca delete direto sem necessidade. Listagens filtram `ATIVO` por padrão; mostram inativos só com param `status` explícito.
- **DTO repositories** — recebem `Map<String,String[]>` (request params), montam HQL dinâmico. Filtros multi-valor chegam comma-separated → `split(",")` → `IN :lista`.
- **Unicidade** — `Usuario.email` e `Perfil.descricao` têm `@Column(unique=true)`. Vale mesmo para registros inativos. Violação → 409 via GlobalExceptionHandler.
- **Auditoria** — Envers gera tabelas `_AUD`. AuditoriaService usa AuditReader, percorre hierarquia inteira de classes, exclui campos sensíveis (senha, perfis, roles, versao).
- **WebSocket** — NotificacaoService faz broadcast em `/topic/notificacoes` ao criar/alterar/excluir.

## Sistema de roles (ABCD)

Padrão: `PREFIXO + ação`. Ação = **A**dd / **B**rowse / **C**hange / **D**elete.
Módulos: `USR` (Usuários), `PRF` (Perfis). Ex: `USRB` = ver usuários, `PRFC` = alterar perfis.

- Sem role `B` → módulo nem aparece no menu.
- Frontend: `utils/roles.ts` (canBrowse/canAdd/canChange/canDelete + MODULES). Controla menu, rotas (RequireRole) e botões.
- Backend: enum `Role` implements GrantedAuthority, authority = `ROLE_` + name.

## Arquitetura frontend

```
src/
  components/Nome/index.tsx + styles.scss   # componente + estilo colocados juntos
  pages/Nome/index.tsx + service.ts         # cada página tem service próprio
  services/baseService.ts                   # BaseService<T> genérico (getPage, getById, create...)
  services/api.ts                           # Axios + interceptor JWT + auto-refresh
  contexts/                                  # Auth, Theme, WebSocket
  utils/roles.ts                            # helpers ABCD
  routes/                                    # Rotas, Template, Requisitos/Require*
```

### Padrões frontend

- **Service por página** — `pages/X/service.ts` exporta interfaces (XDTO, X, XForm, XFiltros) + `xService` (wrappa BaseService) + `buildQuery`. Páginas nunca instanciam BaseService direto.
- **Filtros** — montados como query string explícita (`string[]` joined com `&`), não objeto Axios `params`. Multi-valor → comma-separated. Backend lê via `getParameterMap()`.
- **TanStack Query** — `useQuery` para listagem paginada (queryKey inclui page/size/filtros), `useMutation` para salvar/desativar/restaurar/excluir. Invalida com `queryClient.invalidateQueries`.
- **Editar registro** — busca entidade completa via `getById` (DTO de listagem é parcial).
- **Ações por linha** — visibilidade depende do `status` do registro (ATIVO → editar/desativar; INATIVO → restaurar/excluir), não de toggle global.
- **Botões só-ícone** — usar `<button>` nativo + flexbox center, NÃO PrimeReact Button (rounded/text quebram centralização).
- **Dropdown/MultiSelect dentro de Dialog** — passar `baseZIndex={10000}` (panel portado pro body precisa z-index acima do modal). Não usar `appendTo="self"` (quebra posicionamento).
- **Tema** — ThemeContext seta `data-theme` attribute; overrides dark em App.scss.

### SCSS

- Sempre `@use '../../styles/variables' as *;` no topo (não `@import`).
- Variáveis em `styles/_variables.scss` ($gray-*, $primary-color, $border-radius-md...).
- Avisos de contraste do linter em texto rgba sobre gradiente/dark = falsos positivos.

## Convenções

- Código, nomes de domínio e comentários em **português** (entidades, serviços, rotas).
- Componentes/páginas: pasta PascalCase com `index.tsx`.
- Caveman mode ativo nas respostas (terso). Código/commits = escrita normal.
