# 🛡️ E-Escala | Sistema de Gerenciamento de Escalas de Serviço

> Uma plataforma robusta, responsiva e adaptável, projetada para automatizar o gerenciamento de escalas de serviço. Ideal para instituições que demandam controle rigoroso de hierarquia e antiguidade, como Forças Policiais, Guardas Municipais, Empresas de Segurança Privada e Setores de Saúde.

## 📋 Sobre o Projeto

O **E-Escala** foi desenvolvido para otimizar a criação e o controle de turnos e escalas de serviço. O grande diferencial do sistema é o seu motor de regras de negócio, que permite aplicar critérios de precedência (cargo, peso hierárquico e tempo de serviço) para garantir que a ordenação e a distribuição das escalas ocorram de forma justa, correta e automática, adaptando-se à realidade de diferentes corporações.

## ✨ Principais Funcionalidades

* **Três perfis de acesso** — `user` (militar/operacional), `admin` (gestor) e `master` (super-administrador, herda tudo que o admin faz, com segredo de JWT e login próprios). Cada perfil tem sua própria tabela (`users`, `admins`, `masters`) e sua própria rota de login.
* **Troca de senha obrigatória no primeiro acesso:** todo `user` novo nasce com a senha padrão da instituição (`SEED_PASS`) e é forçado a trocá-la antes de usar o resto do painel.
* **Módulo de Hierarquia e Antiguidade:** patentes/graduações com peso hierárquico (`tbl_patentes`), usadas pra ordenar e desempatar escalas por tempo de serviço.
* **Importação de antiguidade:** scraper automático (cron diário, horário aleatório) que sincroniza a lista de antiguidade a partir do sistema da corporação, com histórico de execuções consultável pelo admin — mais um upload manual de CSV como alternativa.
* **Módulo de Escala de Serviço (Core, `v2_*`):** geração de escala por ciclo/turno/grupamento, vínculo mensal de militares a grupamentos, substituições pontuais (adição/exclusão/permuta) e reversão pra escalas já geradas.
* **Permutas:** fluxo de solicitação entre militares (solicitante ↔ alvo), com análise e decisão do admin/master.
* **Afastamentos:** registro de licenças/afastamentos com restrição automática de alocação em escala durante o período, e encerramento quando o militar retorna.
* **Mural de avisos:** publicação pelo admin, leitura por todos os perfis, com histórico de avisos anteriores.
* **Boletins/relatórios:** boletim do efetivo, escala de despachantes e escalas consolidadas, prontos pra impressão/PDF direto do navegador.
* **Interface Responsiva (Mobile First):** telas de listagem exibem tabela completa no desktop e *cards* no mobile.

## 🚀 Tecnologias Utilizadas

**Backend:**
* **Node.js** & **Express 5** — API RESTful.
* **Knex.js** + **PostgreSQL** — query builder, migrations e banco relacional.
* **jsonwebtoken** + **bcryptjs** — autenticação por perfil com segredos de JWT separados.
* **helmet**, **cors**, **express-rate-limit** — camadas de segurança HTTP e limitação de requisições (geral, por usuário autenticado e rigorosa pra login).
* **node-cron** — agendamento do scraper diário de antiguidade.
* **swagger-ui-express** — documentação interativa das rotas (só em desenvolvimento; ver variáveis de ambiente).

**Frontend:**
* **React 19** + **Vite** — SPA com code-splitting por rota (cada página carrega seu próprio chunk, via `React.lazy`).
* **React Router 7** — roteamento e proteção de rotas por perfil (`ProtectedRoute`).
* **Tailwind CSS** — estilização utilitária, responsiva.
* **Axios** — cliente HTTP, com interceptores globais pra rate-limit (429) e sessão expirada/token inválido (401 → logout automático).

## 🗄️ Modelagem de Dados (destaque arquitetural)

A autenticação é isolada por perfil, cada um em sua própria tabela — não existe uma tabela única de "usuários genéricos":

- `users`: militares/operacionais. Credenciais, status (`is_active`), sinalizador de troca de senha obrigatória (`must_change_password`) e vínculo com `tbl_patentes` (hierarquia).
- `admins`: gestores administrativos. Mesma lógica de credenciais e status.
- `masters`: super-administradores — segredo de JWT próprio (`SECRET_MASTER`), separado dos outros dois perfis por segurança.
- `tbl_patentes`: patentes/graduações com peso hierárquico, usado na ordenação de escalas e antiguidade.
- Módulos de domínio com prefixo `v2_` (`v2_escala`, `v2_grupamento_usuario`, `v2_permuta_solicitacao`, `v2_afastamentos`, etc.) — cada um com `constraints` no banco (`EXCLUDE USING gist`) que impedem sobreposição de escala/vínculo/afastamento mesmo se a camada de aplicação falhar.
- `scraper_execucoes`: histórico de cada rodada do cron de antiguidade (sucesso/falha, tentativas, detalhe do erro).

## 🛠️ Como Executar o Projeto Localmente

O projeto é um monorepo simples: `desenvolvimento/backend` (API) e `desenvolvimento/frontend` (SPA), rodados como dois processos separados.

### Pré-requisitos
* Node.js 18+ e npm
* PostgreSQL rodando localmente (ou via container)
* Git

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd escala
```

### 2. Backend

```bash
cd desenvolvimento/backend
npm install
```

Crie um arquivo `.env` na pasta `backend/` com as variáveis abaixo (sem valor de exemplo pros segredos — gere valores aleatórios únicos pro seu ambiente, nunca reaproveite os de outro ambiente):

| Variável | Para quê serve |
|---|---|
| `DATABASE`, `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` | Conexão com o PostgreSQL |
| `PORT` | Porta do backend (padrão `3030` se omitida) |
| `SECRET`, `SECRET_ADMIN`, `SECRET_MASTER` | Segredos de JWT, um por perfil — **mínimo 32 caracteres aleatórios cada**, o servidor recusa subir se algum estiver ausente ou curto demais |
| `SEED_PASS` | Senha padrão usada ao criar um `user` novo (e pelo seed de desenvolvimento) — o militar é obrigado a trocá-la no primeiro acesso |
| `PMSE_USER`, `PMSE_PASS` | Credencial usada pelo scraper de antiguidade pra autenticar no sistema de origem |
| `FRONTEND_URL` | Origem extra liberada no CORS (além de `localhost:5173`), útil pra um ambiente de staging |
| `NODE_ENV` | `development` localmente; `production` desliga o Swagger (`/docs`) e liga o catch-up automático do scraper |

Depois, rode as migrations e (opcionalmente) o seed de dados de desenvolvimento:
```bash
npx knex migrate:latest
SEED_PASS=suaSenhaDeTeste npx knex seed:run
```

E inicie o servidor:
```bash
npm run dev    # com nodemon + regeneração do swagger-output.json
# ou
npm start      # direto, sem nodemon
```

O backend sobe em `http://localhost:<PORT>` (padrão `3030`). Em desenvolvimento, a documentação interativa das rotas fica em `/docs`.

### 3. Frontend

```bash
cd desenvolvimento/frontend
npm install
npm run dev
```

O frontend sobe em `http://localhost:5173` (Vite). Por padrão ele aponta pro backend em `http://192.168.56.1:3000` — ajuste `VITE_API_URL` num `.env` do frontend, ou edite `src/services/api.js`, se a porta/host do seu backend for diferente.

### 4. Acessando o sistema

- `/login` — perfil `user`.
- `/login-admin` — perfil `admin`.
- `/login-master` — perfil `master` (sem link em nenhuma tela; acessa quem souber o endereço).

Se você rodou o seed de desenvolvimento, as credenciais de teste usam a senha definida em `SEED_PASS` no momento do seed — confira `src/database/seeds/01_seed.js` pros CPFs cadastrados.
