# Hub Feat Creators

Boilerplate full stack pronto para servir de ponto de partida em projetos pessoais e profissionais. A ideia é não começar do zero toda vez. O projeto já vem com autenticação, controle de permissões, auditoria, paginação, notificações em tempo real e uma interface profissional com tema claro e escuro.

O backend é feito em Java com Spring Boot e PostgreSQL. O frontend é feito em React com Vite, TypeScript e PrimeReact.

## O que já vem pronto

Autenticação completa com JWT e refresh token, incluindo proteção contra excesso de requisições no login.

Sistema de permissões granular onde cada módulo tem quatro ações possíveis: adicionar, visualizar, alterar e excluir. Se o usuário não tem a permissão de visualizar um módulo, ele nem aparece no menu.

Auditoria automática com Hibernate Envers. Toda alteração em usuários e perfis fica registrada, com data, tipo de operação e o e-mail de quem fez a mudança. O histórico pode ser consultado direto pela tela.

Exclusão lógica em vez de exclusão direta. Registros são desativados e podem ser restaurados depois. A exclusão permanente existe, mas exige confirmação explícita.

Paginação no servidor com filtros avançados. Cada listagem permite filtrar por texto, status, datas e outros campos específicos da entidade.

Notificações em tempo real via WebSocket. Quando alguém cria, altera ou exclui um registro, todos os usuários conectados recebem o aviso na hora.

Interface com tema claro e escuro, componentes reutilizáveis, validação de formulários e feedback visual consistente.

## Tecnologias

No backend você encontra Spring Boot 3.3.5, Java 17, Spring Security, Spring Data JPA, Hibernate Envers, PostgreSQL, Bucket4j para rate limiting e Lombok.

No frontend você encontra React 18, Vite 6, TypeScript 5, PrimeReact 10, SCSS, TanStack Query 5, Axios, React Router 6 e STOMP sobre SockJS para o WebSocket.

## Como rodar

Você precisa de Java 17, Maven, Node 18 ou superior e um PostgreSQL rodando.

Primeiro crie o banco no PostgreSQL:

```sql
CREATE DATABASE hub_feat_creators;
```

O schema é gerado automaticamente pelo Hibernate na primeira execução, então não precisa rodar migrations manualmente.

### Backend

```bash
cd backend
./mvnw spring-boot:run
```

A API sobe na porta 8080. As configurações de banco e segredo do JWT podem ser ajustadas por variáveis de ambiente. Os valores padrão funcionam para desenvolvimento local.

| Variável | Padrão |
|----------|--------|
| DB_URL | jdbc:postgresql://localhost:5432/hub_feat_creators |
| DB_USERNAME | postgres |
| DB_PASSWORD | postgres |
| JWT_SECRET | valor de desenvolvimento já definido |

Na primeira vez que o backend sobe, um usuário administrador é criado automaticamente:

```
E-mail: admin@mop.com
Senha:  1234
```

Esse usuário já vem com todas as permissões.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

A aplicação sobe na porta 5173. Abra no navegador e faça login com o usuário administrador.

## Estrutura do projeto

```
hub-feat-creators/
  backend/
    src/main/java/br/com/matheus/hubfeatcreators/
      entidades/         entidades JPA e superclasse genérica
      repositorios/      repositórios de escrita
      servicos/          regras de negócio
      controladores/     endpoints REST
      configuracoes/     security, JWT, websocket, rate limit
      visoes/            camada de leitura (DTOs e queries de listagem)
      enums/             status e roles
  frontend/
    src/
      components/        componentes reutilizáveis
      pages/             telas, cada uma com seu service próprio
      services/          cliente HTTP e service base
      contexts/          autenticação, tema e websocket
      routes/            rotas e proteção por permissão
      utils/             helpers, incluindo as regras de permissão
```

## Como a arquitetura funciona

O backend usa uma hierarquia genérica para evitar código repetido. Existe uma superclasse de entidade, um repositório base, um serviço base e um controller base. Cada entidade nova herda tudo isso e ganha o CRUD completo de graça, incluindo desativar, restaurar e histórico de auditoria.

A leitura de dados fica separada da escrita. As listagens usam DTOs específicos com queries montadas dinamicamente conforme os filtros enviados. Isso mantém as consultas leves e flexíveis.

No frontend, cada página tem seu próprio service que envolve o service base e define os tipos e filtros daquela tela. As páginas nunca falam direto com a API, sempre passam pelo service. O carregamento de dados usa TanStack Query, então cache, refetch e estados de loading são tratados de forma automática.

## Permissões

As permissões seguem o padrão de prefixo do módulo somado à ação. As ações são A para adicionar, B para visualizar, C para alterar e D para excluir.

Por exemplo, USRB dá acesso de visualizar usuários e PRFC dá acesso de alterar perfis. Os perfis agrupam essas permissões e são associados aos usuários. A tela de perfis mostra cada módulo como uma prancheta onde você liga e desliga cada permissão.

## Auditoria

Cada alteração relevante gera uma revisão registrada pelo Hibernate Envers em tabelas separadas com sufixo _AUD. O sistema guarda quem fez, quando fez e o que mudou. Na listagem de usuários e perfis existe um botão de histórico que abre uma linha do tempo com todas as revisões daquele registro.

## Testes

O frontend tem testes com Vitest e Testing Library:

```bash
cd frontend
npm test
```

O backend tem a estrutura de testes com Spring Boot Test e Spring Security Test pronta para uso:

```bash
cd backend
./mvnw test
```

## Licença

Projeto de uso livre como base para outros projetos.
