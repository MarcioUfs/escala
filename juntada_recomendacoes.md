# Recomendações — E-Escala (branch `hotcode`) — Revisão verificada in-loco

Revisão do documento `RECOMENDACOES E-ESCALA.md`, com cada item conferido diretamente no código e no banco de dados reais (não apenas lido por amostragem). Commit auditado originalmente: `5d7deee` (mesmo que o documento original). **Atualizado após a execução dos itens 1 e 3 da "Ordem sugerida"** — as seções corrigidas ganharam a marca 🔓 e uma nota do que foi feito; o changelog completo está no final do arquivo.

**Legenda de verificação:** ✅ Confirmado exatamente como descrito · ⚠️ Confirmado e ampliado (achei mais do que o relato original) · 🆕 Item novo (não estava no documento original) · 🔓 Resolvido/mitigado desde então

---

## Resumo para decisão

| # | Item | Impacto | Esforço | Status da verificação |
|---|------|---------|---------|---|
| S1 | Desativar usuário/admin não bloqueia login nem token | **Alto** | P | 🔓 **Corrigido** — afetava user E admin, login unificado via `senhaConfere` checa `is_active` nos 3 perfis |
| S2 | Login revela se o CPF existe | Médio | P | 🔓 **Corrigido** — mensagem genérica única nos 3 perfis (user e admin agora iguais ao master) |
| S3 | Rate limit do login: chave crua e bloqueio de terceiros | Médio | P | 🔓 **Corrigido** — chave normaliza o CPF antes de gerar o bucket |
| S4 | Senha inicial igual para todos, sem troca obrigatória | **Alto** | M | 🔓 **Corrigido** — `must_change_password` + tela de troca forçada |
| S5 | 500 devolve erro cru ao cliente | Médio | P | 🔓 **Corrigido** — 25 pontos, campo `error` removido, log só no servidor |
| S6 | Token expirado responde 403 e o front não reage | Médio | P | 🔓 **Corrigido** — 401 + `tokenError:true`, front desloga automaticamente |
| S7 | Endurecer JWT (algoritmo, env, revogação) | Médio | M | 🔓 **Corrigido** (exceto revogação) — `SECRET`/`SECRET_ADMIN` regenerados (só local), `algorithms:['HS256']` fixo nos 6 `jwt.verify`, validação no boot (processo não sobe com segredo ausente/curto) |
| S8 | `/docs` (Swagger) público em produção | Médio | P | 🔓 **Corrigido** — só monta a rota quando `NODE_ENV !== "production"` |
| S9 🆕 | IDs sequenciais expostos na API (não só no front) | Baixo-Médio | M | 🆕 Sem alteração — decisão mantida de não fazer agora |
| O1 | Scraper/cron frágil, sem alerta; credencial pessoal | Alto | M | 🔓 **Corrigido** (exceto a credencial pessoal, que é organizacional) — execuções persistidas em `scraper_execucoes` + endpoint de consulta; catch-up automático pós-restart (só em produção — ver nota de incidente abaixo) |
| O2 | Erros engolidos sem log | Médio | M | 🔓 **Corrigido** — 54 blocos `catch`/`.catch()` sem log (eram 70−25 já cobertos pelo S5) ganharam `console.error` |
| O3 | Corrida em "checa e insere" vira 500 em vez de 409 | Baixo | P | ✅ Confirmado, com trecho exato — **ainda não corrigido** |
| O4 | Chave do `authenticatedLimiter` pode colidir | Baixo | P | 🔓 **Corrigido** — chave agora inclui o `role` (`user_123` ≠ `admin_123`), resolve a colisão real confirmada |
| O5 | IPs/portas fixos no código e `.env.example` inconsistente | Baixo | P | ✅ Confirmado (4 valores de porta diferentes) — **ainda não corrigido** |
| O6 | SSL do banco com `rejectUnauthorized: false` | Baixo | P | ✅ Confirmado — **ainda não corrigido** (baixa prioridade, mantido) |
| Q1 | Sem testes e sem CI | Alto | M | ✅ Confirmado — **ainda não iniciado** |
| Q2 | Verificação de token duplicada em 6 handlers | Baixo | P | ✅ Confirmado — handlers ganharam `tokenError`/log nesta sessão, mas a duplicação da verificação em si **não foi removida** |
| Q3 | Código morto e arquivos legados versionados | Baixo | P | 🔓 **Corrigido** — 4 arquivos legados deletados, `pagedjs` removido do `package.json`, `UserController.js` limpo de ~290 linhas de código comentado morto |
| Q4 | Arquivos gigantes (front e controllers) | Médio | G | ✅ Confirmado, números exatos batem — **ainda não corrigido** |
| Q5 | Front sem lazy loading | Baixo | P | 🔓 **Corrigido** — code-splitting por rota com `React.lazy`+`Suspense` em todas as páginas e layouts; bundle principal caiu de 636kB pra 283kB |
| Q6 | `onClick={signOut}` passa o evento como argumento | Baixo | P | 🔓 **Corrigido** — existia em 3 layouts, todos trocados por `onClick={() => signOut()}` |
| Q7 | README desatualizado | Médio | P | 🔓 **Corrigido** — reescrito com os módulos reais (permutas, afastamentos, avisos, master, scraper), variáveis de ambiente, passo a passo completo (back + front) e a inconsistência do `dados_profissionais` (nunca existiu) removida |
| Q8 | Criar `CLAUDE.md` na raiz | Médio | P | ✅ Confirmado (não existe) — **ainda não corrigido** |
| Q9 🆕 | Documentação de arquitetura perdida | Baixo | P | 🆕 Ver nota — **ainda não corrigido** |
| Q10 🆕 | Dado de produção sem explicação registrada | — | — | 🔓 **Resolvido** — reverificado (achado mais do que o suposto: o CPF também não bate com o seed atual, não só o nome); decisão do usuário foi não alterar, pois é zerado no próximo ciclo de migration+seed |
| — 🆕 | `getUser` sempre reporta "Inativo" e devolve `updated_at` de `tbl_patentes`, não do usuário | Médio | P | 🔓 **Corrigido** — achado durante o teste do S4, fora da lista original |

---

## Segurança

### S1 — Desativar usuário/admin não bloqueia nada — 🔓 Corrigido
- **Era:** `userController.login` fazia `SELECT ... FROM users WHERE cpf = ?` sem filtro de `is_active`; `adminController.loginAdmin` tinha o mesmo problema (tabela `admins` tem a coluna, mas não era consultada). Só `loginMaster` checava `is_active` corretamente.
- **Correção aplicada:** os três logins passaram a usar o helper `src/functions/compararCredencialLogin.js` (`senhaConfere`), que busca a conta primeiro e sempre compara a senha (contra a senha real ou um hash fictício, se a conta não existir), e then `if (!user || !user.is_active || !senhaOk) return 401` — um único ponto de bloqueio, pros três motivos de recusa.
- **Testado:** conta descartável desativada, senha correta → 401 genérico, em `user` e `admin`.

### S2 — Login revela se o CPF existe — 🔓 Corrigido
- **Era:** `user` e `admin` devolviam mensagens diferentes pra CPF inexistente vs. senha errada; só `master` já usava a mesma mensagem nos dois casos.
- **Correção aplicada:** `user` e `admin` agora devolvem exatamente a mesma mensagem (`"Credencial inválida!"`) e o mesmo status (401) nos dois casos, igual ao `master`.
- **Testado:** respostas idênticas (corpo e status) nos dois cenários, nos dois perfis.

### S3 — Rate limit do login — 🔓 Corrigido
- **Era:** `rateLimiter.js` usava `` `limit_cpf_${req.body.cpf}` `` com o CPF cru, sem normalizar — CPF pontuado e sem pontuação geravam chaves (e cotas de 10/h) diferentes.
- **Correção aplicada:** `keyGenerator` do `strictLimiter` agora normaliza o CPF via `somenteCpf()` antes de montar a chave.
- **Testado:** CPF pontuado e sem pontuação alternados em 11 tentativas bloquearam juntos na 11ª tentativa (mesmo bucket).
- **Não corrigido, decisão consciente:** a chave continua só pelo CPF, sem combinar com IP.

### S4 — Senha inicial única — 🔓 Corrigido
- **Era:** `createUser` travava a senha inicial em `process.env.SEED_PASS`, igual pra todo mundo, sem nenhuma coluna ou mecanismo de troca obrigatória.
- **Correção aplicada:**
  - Migration `20261003130000_must_change_password.js`: coluna `must_change_password` (boolean, not null, default `true`) em `users` — default `true` também pras contas já existentes, já que não havia registro de quem já tinha trocado.
  - `createUser` marca `must_change_password: true` explicitamente.
  - `updatePassword` desliga pra `false` na troca bem-sucedida.
  - `getUser` devolve `mustChangePassword` na resposta.
  - Frontend: `UserLayout` redireciona à força pra `/user/reset-password` enquanto `mustChangePassword` for `true`; `UserResetPassword` esconde o botão "Cancelar" e mostra aviso nesse modo; `AuthContext` ganhou `updateUser()` pra desligar o sinalizador na hora, sem esperar F5.
- **Testado:** conta nova nasce com `mustChangePassword:true`; após `updatePassword`, vira `false`.
- **`createAdmin` não foi alterado** — continua aceitando senha do formulário, como já fazia.

### S5 — Erro cru vazando ao cliente — 🔓 Corrigido
- **Era:** 25 pontos em `setorController.js` (1, vazando o objeto de erro inteiro), `v2PermutaController.js` (12), `v2EscalaController.js` (10) e `v2AfastamentoController.js` (2) devolviam `error`/`error.message` no corpo da resposta 500.
- **Correção aplicada:** todos os 25 pontos deixaram de devolver o campo `error` — o detalhe agora só vai pro `console.error` do servidor.
- **Testado:** 500 real disparado via `:id` não numérico em `/afastamentos/:id` — resposta sem campo `error`, só a mensagem genérica.

### S6 — Token expirado responde 403 — 🔓 Corrigido
- **Era:** token ausente/mal formatado → 401; token inválido ou expirado → 403 (inconsistente com os 6 handlers duplicados do `v2EscalaController.js`, que já respondiam 401 nesse caso); front não reagia a nada disso no meio do uso.
- **Correção aplicada:** os três middlewares (`verifyJWT.js`, `verifyJWTAdmin.js`, `verifyJWTMaster.js`) e os 6 handlers duplicados agora respondem 401 de forma consistente, com `tokenError:true` marcando especificamente falha de autenticação (não confundir com um 401 de regra de negócio, como senha atual errada). `frontend/src/services/api.js` ganhou um segundo gatilho no interceptor de resposta (`api:unauthorized`), e `AuthContext.jsx` escuta esse evento e desloga automaticamente, redirecionando pra Home.
- **Testado:** nos 3 painéis (user/admin/master), evento simulado → sessão limpa e redirecionamento confirmados.

### S7 — Endurecer o JWT — 🔓 Corrigido (exceto revogação)
- **Era:** `SECRET` (10 caracteres) e `SECRET_ADMIN` (15 caracteres) eram curtos demais pra HMAC-SHA256; `SECRET_MASTER` (64 caracteres, `crypto.randomBytes(48)`) já estava no padrão adequado; nenhum `jwt.verify` fixava o algoritmo; nenhuma validação de segredo no boot.
- **Correção aplicada:**
  - `SECRET` e `SECRET_ADMIN` regenerados no `.env` **local**, mesmo padrão do `SECRET_MASTER` (64 caracteres base64 via `crypto.randomBytes(48)`).
  - Os 6 `jwt.verify` do backend (`verifyJWT.js`, `verifyJWTAdmin.js` ×2, `verifyJWTMaster.js`, `v2EscalaController.js` ×2) agora passam `{ algorithms: ['HS256'] }` explicitamente.
  - `app.js` valida no boot que `SECRET`/`SECRET_ADMIN`/`SECRET_MASTER` existem e têm pelo menos 32 caracteres — se não, o processo nem sobe (`process.exit(1)`), em vez de rodar silenciosamente com um segredo fraco ou ausente. Pulado quando `NODE_ENV=test`, pra não travar testes automatizados que só importam `app.js`.
- **Testado:** login normal nos 3 perfis continua funcionando com o algoritmo fixo; um token forjado `alg:none` (sem assinatura) é rejeitado com 401; `node -e` com `SECRET` curto proposital confirma que o processo sai com código 1 e a mensagem de erro certa.
- **Ainda não feito:** revogação de token (ex: blocklist de tokens invalidados antes do `expiresIn` natural) — exigiria estado persistente (Redis/tabela) e não foi pedido nesta rodada.
- **Pendência que não dá pra resolver por aqui:** não tenho acesso ao ambiente de produção (Render) — os segredos lá seguem como estavam antes. Se forem os mesmos valores fracos do `.env` local, a troca precisa ser feita manualmente lá também, e isso desloga qualquer sessão ativa no momento da troca.

### S8 — `/docs` público — 🔓 Corrigido
- **Era:** `app.js` montava `/docs` incondicionalmente, sem checar `NODE_ENV` nem exigir autenticação.
- **Correção aplicada:** `/docs` só é montado quando `NODE_ENV !== "production"` (reaproveitando a flag `isProduction` que já existia em `app.js`).
- **Testado:** em dev, `/docs` responde 200; a montagem condicional foi confirmada por inspeção de código e por um teste isolado com `NODE_ENV=production` (rota não registrada).

### S9 🆕 — IDs sequenciais expostos na própria API — sem alteração
- Mantida a decisão de não implementar IDs opacos (`hashids`/`sqids`) agora — custo maior que o benefício frente ao que já foi resolvido via autorização por escopo. Nenhuma mudança nesta rodada; não fazia parte dos itens 1 ou 3 da ordem sugerida.

---

## Operação e robustez

### O1 — Scraper de antiguidade — 🔓 Corrigido (exceto a credencial pessoal)
- **Era:** só `console.log`/`console.error`, sem persistência de "última execução" em lugar nenhum — um restart no meio da rotina fazia o dia desaparecer silenciosamente, sem nenhum catch-up.
- **Correção aplicada:**
  - Nova tabela `scraper_execucoes` (migration `20261003140000_scraper_execucoes.js`) grava cada rodada do cron (status, tentativas, início/fim, detalhe do erro, sem dado sensível). Novo endpoint `GET /admin/antiguidade/historico-scraper` expõe isso pro admin, sem precisar de acesso ao log do servidor.
  - Catch-up automático: no boot do servidor, se já passou das 02h (fuso America/Maceio) e não existe execução com sucesso registrada hoje, a rotina dispara imediatamente em vez de esperar o cron do dia seguinte. **Só em produção** (`NODE_ENV === "production"`) — ver incidente abaixo.
- **Incidente durante o teste (transparência):** a primeira versão do catch-up não tinha essa restrição de ambiente. Ao reiniciar o backend local pra testar, ele disparou uma raspagem **real** contra a intranet da PMSE usando sua credencial pessoal (`PMSE_USER`/`PMSE_PASS`) — o login aconteceu de verdade (status 200), a busca de dados falhou (formato de resposta inesperado) e eu interrompi o processo antes do ciclo de retentativas terminar (não chegou a escrever nada no banco, falhou antes dessa etapa). Corrigido na hora, restringindo o catch-up a produção, antes de qualquer outro teste. Reinícios locais frequentes (normais numa sessão de desenvolvimento) não devem martelar o site real.
- **Testado:** linhas inseridas manualmente e lidas corretamente via HTTP, protegidas por `verifyJwt + isAdmin`; backend reiniciado em modo dev não disparou o catch-up (confirmado no log).
- **Ainda não feito:** o scraper continua usando `PMSE_USER`/`PMSE_PASS` (credencial pessoal, não institucional) — decisão organizacional, não um bug de código, fora do meu alcance resolver sozinho.

### O2 — Erros sem log — 🔓 Corrigido
- **Era:** 70 blocos `catch` nos controllers, só 1 `console.error` em todo esse conjunto.
- **Correção aplicada:** varredura comment-aware (comentários e strings mascarados antes do match, pra não inserir log dentro de código morto comentado — um primeiro script sem essa proteção corrompeu trechos comentados e foi revertido antes de commitar qualquer coisa) encontrou 54 blocos `catch`/`.catch()` ainda sem log (os outros ~16 já tinham sido cobertos pelo S5 ou já logavam). Todos os 54 ganharam `console.error("[Controller]", erro)`, em 9 controllers: `adminController`, `avisosController`, `masterController`, `setorController`, `UserController`, `v2AfastamentoController`, `v2EscalaController`, `v2MinhaEscalaController`, `v2PermutaController`.
- **Testado:** `node -c` e `require()` em todos os 9 arquivos, sem erro de sintaxe ou carregamento; inspeção manual de todos os pontos de inserção.

### O3 — Corrida no "checa e insere" — sem alteração
Continua exatamente como descrito: `vincularUsuarioGrupamentoV2` (`v2EscalaController.js:574-629`) ainda faz `SELECT` seguido de `INSERT` sem lock nem transação. Não fazia parte do item 3 da ordem sugerida; não corrigido nesta rodada.

### O4 — Chave do `authenticatedLimiter` — 🔓 Corrigido
- **Era:** chave gerada só por `` `user_${id_user || id_admin}` ``, sem o `role` — colisão **real confirmada**: existe hoje um usuário com `id_user = 100000` e um admin com `id_admin = 100000`, ambos caindo na mesma chave `user_100000` e dividindo a mesma cota de 600 req/5min. `id_master` nem entrava na fórmula.
- **Correção aplicada:** `keyGenerator` agora prefixa a chave pelo `role` (`user_123`, `admin_123`, `master_45`), e passou a incluir `id_master` na fórmula (antes caía sempre no fallback por IP).
- **Testado:** isoladamente — mesmo número com roles diferentes agora gera chaves diferentes (`user_100000` ≠ `admin_100000`).

### O5 — Configuração fixa no código — sem alteração
Confirmado com os números exatos (porta padrão do backend 3030, fallback do front 3000, `.env.example` com 3111/5284, CORS liberando 5173). Não fazia parte do item 3; não corrigido nesta rodada.

### O6 — SSL do banco — sem alteração
Confirmado: `knexfile.js:36`, `ssl: { rejectUnauthorized: false }`. Mantido como baixa prioridade; não corrigido nesta rodada.

---

## Qualidade e manutenção

### Q1 — Testes e CI — sem alteração
Confirmado: `"test"` ainda é `echo "Error: no test specified" && exit 1`; sem `.github/`; sem `*.test.js`/`*.spec.js`. O terreno (`app.js:138` já protege o cron contra `NODE_ENV=test`) continua preparado, mas nenhum teste foi escrito nesta rodada.

### Q2 — Verificação de token duplicada — sem alteração (parcialmente tocado)
Os 6 handlers duplicados do `v2EscalaController.js` ganharam `tokenError:true` (S6) e `console.error` (O2) nesta sessão, mas a duplicação da verificação de token em si (`req.headers.authorization.split(" ")[1]` + `jwt.verify` manual dentro do handler, mesmo já passando por `verifyJwt + isAdmin`) **não foi removida**. O item do documento continua válido.

### Q3 — Código morto e legado — 🔓 Corrigido
- **Era:** 4 arquivos legados versionados sem nenhuma referência real (`database/base/schema copy.js`, `seed copy.js`, `controllers/XDashBoardController.js`, `pages/user/XoldAdminCreateUser.jsx`), dependência `pagedjs` órfã no `package.json` do frontend (só sobravam comentários mencionando o nome), e `UserController.js` com 463 linhas, 282 comentadas (~61%) — implementações antigas inteiras deixadas como comentário ao lado da versão nova.
- **Correção aplicada:**
  - Confirmei zero referência a cada um dos 4 arquivos em todo o projeto (fora deles mesmos) antes de deletar — nenhum `require`/`import` os alcançava.
  - `npm uninstall pagedjs` no frontend.
  - `UserController.js` reescrito sem os blocos comentados mortos (3 implementações antigas de `login`/`getUser`/`updatePassword`, mais `updateMyUser`/`catchUser`, nunca usadas) — caiu de 481 pra 178 linhas, só com o código que roda de verdade.
- **Não entrou nesta rodada:** as 4 telas de admin que vivem dentro de `pages/user/` (`AdminCreateUser.jsx`, `AdminEditUser.jsx`, `AdminListUsers.jsx`, `AdminViewUser.jsx`) — é uma questão de organização de pastas (deveriam estar em `pages/admin/`), não de código morto, e mover exigiria atualizar todas as referências em `App.jsx` com risco de regressão maior do que o benefício agora.
- **Testado:** `node -c` + `require('./app')` depois de deletar os 4 arquivos — carrega sem erro; login/getUser/updatePassword testados de ponta a ponta depois da reescrita do `UserController.js` — continuam funcionando.

### Q4 — Arquivos gigantes — sem alteração
Números batem com o documento original. Não corrigido nesta rodada (G = esforço grande, não estava no item 3).

### Q5 — Lazy loading — 🔓 Corrigido
- **Era:** zero ocorrências de `React.lazy`/`lazy(` — toda página entrava no bundle inicial de uma vez.
- **Correção aplicada:** `App.jsx` reescrito pra carregar todas as páginas e os 3 layouts via `React.lazy()`, com um único `<Suspense fallback={<CarregandoPagina />}>` envolvendo as `<Routes>`.
- **Testado:** `vite build` mostra cada página como um chunk separado (de ~1kB a ~46kB); o bundle principal (`index-*.js`) caiu de 636kB pra 283kB, e o aviso de "chunk maior que 500kB" desapareceu. Navegação real (Puppeteer) por 7 rotas administrativas distintas — todas renderizaram, zero erro de console/página.

### Q6 — `onClick={signOut}` — 🔓 Corrigido
- **Era:** existia em `AdminLayout.jsx`, `UserLayout.jsx` e `MasterLayout.jsx` — o evento de clique do React era passado como primeiro argumento de `signOut(redirect=true)`, inofensivo por coincidência (qualquer valor truthy já significa "redireciona"), mas frágil.
- **Correção aplicada:** os 3 layouts trocaram `onClick={signOut}` por `onClick={() => signOut()}`.
- **Testado:** clique real em "Sair" nos 3 painéis — logout funciona nos 3.

### Q7 — README desatualizado — 🔓 Corrigido
- **Era:** 35-55 linhas, roteiro de instalação incompleto (parava no meio do `git clone`), citava uma tabela `dados_profissionais` que **nunca existiu** no código, não mencionava permutas/afastamentos/avisos/master/scraper nem nenhuma variável de ambiente.
- **Correção aplicada:** README reescrito — funcionalidades reais (3 perfis, troca de senha obrigatória, antiguidade/scraper, escala v2, permutas, afastamentos, avisos, boletins), stack real do frontend (antes só dizia "interface responsiva", sem citar React/Vite/Tailwind), modelagem de dados corrigida (removida a tabela fictícia, documentadas `users`/`admins`/`masters`/`tbl_patentes`/`scraper_execucoes`), passo a passo completo cobrindo backend E frontend (antes só citava o backend, e nem isso terminava), tabela com todas as variáveis de ambiente (nomes e pra que servem, sem valores) e as 3 rotas de login.
- **Testado:** confirmei cada comando contra o `package.json` real (`npm run dev`/`npm start` do backend, `npm run dev` do frontend) e contra o `knexfile.js`/arquivo de seed reais, não inventado.

### Q8 — `CLAUDE.md` — sem alteração
Continua não existindo em nenhum nível do repositório. Não corrigido nesta rodada.

### Q9 🆕 — Documentação de arquitetura perdida — sem alteração
Decisões de arquitetura desta e de sessões anteriores (segredo JWT próprio do master, `isAdmin` aceitando os dois perfis, autoria dupla `fk_id_admin`/`fk_id_master`, e agora também o padrão `must_change_password`/`scraper_execucoes`) continuam só registradas nesta conversa. Reforça a prioridade do Q8.

### Q10 🆕 — Dado de produção sem explicação — 🔓 Resolvido (decisão: não alterar)
- **Reverificado:** o registro é `id_admin=100001`, nome "Admin do Master", CPF `032.510.074-82`, `created_at` no mesmo instante do seed (14/09) mas `updated_at` em 02/10 — ou seja, foi alterado depois de criado. A suposição original ("era 'John Doe' no seed") não se confirmou à risca: o seed **atual** (`01_seed.js`) define esse mesmo `id_admin=100001` como "Claudenice" (CPF `782.024.265-53`) — um CPF completamente diferente, não só um nome. O comentário do seed ainda cita "John Doe", mas isso não existe em lugar nenhum do array atual — é comentário desatualizado de uma versão anterior do seed, não o estado real.
- **Decisão do usuário:** não alterar nada — esses dados são zerados/recriados a cada novo ciclo de migration+seed do Knex, então não vale a pena ajustar manualmente um registro que será sobrescrito de qualquer forma na próxima vez que o banco for resetado.
- **Nenhuma alteração feita no banco.**

---

## 🆕 Achado durante os testes (fora da lista original) — 🔓 Corrigido

Ao testar o S4 (flag `mustChangePassword` em `getUser`), descobri que `getUser` (`userController.js`) usava `.table(coluna1, coluna2, ...)` com uma lista de ~13 colunas — mas o `.table()` do Knex **ignora todos os argumentos além do primeiro** (serve só pra indicar a tabela). Na prática, a query real sempre foi um `select *` puro, com dois efeitos colaterais nunca percebidos:

1. O alias `"users.is_active AS ativo"` nunca existia de fato — `data[0].ativo` sempre vinha `undefined`, então o campo `ativo` da resposta era **sempre** `"Inativo"`, independente do valor real de `is_active`.
2. Como o `LEFT JOIN` trazia `tbl_patentes.*` também, e essa tabela tem suas próprias colunas `created_at`/`updated_at`, elas sobrescreviam silenciosamente as de `users` no objeto JS final (mesma chave, último valor atribuído vence) — o `updated_at` devolvido pro front era o da **patente** vinculada, não o do usuário.

Corrigido trocando por um `.select(...)` de verdade, com as colunas certas e o alias funcionando. Testado via DB direto e via HTTP: `ativo` e `updated_at` agora refletem o usuário real.

---

## O que já está bom (mantido/confirmado, sem mudança nesta rodada)

- `helmet()`, `express.json({ limit: "1mb" })`, CORS com lista explícita de origens.
- Rate limit em 3 camadas — desenho correto (a chave que tinha problema no S3/O4 já foi corrigida).
- Segredos JWT separados por perfil (e agora os 3 no mesmo padrão de tamanho, após o S7 parcial).
- Upload de CSV com limite de 5MB e validação que não confia só na extensão.
- `.env` no `.gitignore`.
- Handler global de erro e 404 em JSON.
- Função `fn_v2_gerar_escala` e 3 constraints `EXCLUDE USING gist` no banco.
- Transações em `v2PermutaController.js` (2), `v2AfastamentoController.js` (2) e `adminController.js` (1).
- Autoria de ações do master registrada e testada.

---

## Ordem sugerida (atualizada)

1. ~~**Rápidos, mesmo conjunto de arquivos (login/middlewares):** S1, S2, S3, S5, S6, Q6.~~ **✅ Feito e testado.**
2. **Base para trabalhar com segurança:** Q8 + Q9, ~~Q7~~, início do Q1. — **Q7 feito; Q8/Q9/Q1 pendentes.**
3. ~~**Antes de crescer o uso:** S4, S7, S8, O1, O2, O4.~~ **✅ Feito e testado** (S7 falta só revogação de token; O1 falta só a credencial pessoal — as duas são decisões/infra fora do alcance de uma correção de código).
4. **Quando passar por cada arquivo:** O3, O5, O6, Q2, ~~Q3~~, Q4, ~~Q5~~. — **Q3 e Q5 feitos; O3/O5/O6/Q2/Q4 pendentes.**
5. ~~**Decisões suas, não técnicas:** Q10 (nome do admin 100001).~~ **✅ Resolvido — decisão: não alterar.**

---

## Changelog desta atualização

- **Item 1** (sessão anterior, já commitado em 6 commits separados): S1, S2, S3, S5, S6, Q6.
- **Item 3** (sessão anterior, já commitado em 6 commits de código + 1 de documentação): S4, S8, O1 (persistência/endpoint), O2, O4, mais o bugfix do `getUser`.
- **Fechamento do item 3** (esta rodada, ainda **não commitado**): completei o que tinha ficado parcial —
  - S7: `algorithms:['HS256']` fixo nos 6 `jwt.verify`, validação de segredo no boot.
  - O1: catch-up automático pós-restart (só em produção).
- **Novo bug achado e já corrigido nesta rodada, ainda não commitado:** a primeira versão do catch-up do O1 não restringia a produção -- ao reiniciar o backend local pra testar, ela disparou uma raspagem real contra a intranet da PMSE com a credencial pessoal (login de verdade, status 200; falhou depois ao interpretar a resposta, antes de escrever qualquer coisa no banco). Corrigido na hora, antes de qualquer outro teste.
- **Varredura adicional por outros bugs (pedido nesta rodada):** procurei especificamente por outras ocorrências do padrão que causou o bug do `getUser` (`.table()` do Knex com múltiplas colunas, que o Knex ignora silenciosamente) em todo o restante do backend — não achei nenhuma outra ocorrência. Não achei nenhum outro bug novo além do já descrito acima.
- **Pendências que seguem fora do alcance de uma correção de código:** revogação de token (S7) e a credencial pessoal do scraper (O1) -- as duas exigiriam infraestrutura ou decisão organizacional, não só uma mudança no código.
- **Mais uma rodada (esta, ainda não commitada):** Q3 (4 arquivos legados + `pagedjs` deletados, `UserController.js` limpo), Q5 (code-splitting por rota com `React.lazy`), Q7 (README reescrito), Q10 (reverificado — achado mais que o suposto, decisão do usuário: não alterar, dado é zerado no próximo ciclo de migration+seed).
- **Itens 2 e 4 da ordem sugerida**: parcialmente feitos (Q7, Q3, Q5); Q8, Q9, Q1, O3, O5, O6, Q2, Q4 continuam pendentes. **Item 5**: concluído (Q10 resolvido).
