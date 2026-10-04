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
| S7 | Endurecer JWT (algoritmo, env, revogação) | Médio | M | 🔓 **Parcialmente corrigido** — `SECRET`/`SECRET_ADMIN` regenerados (só local); algoritmo explícito, validação no boot e revogação **ainda não feitos** |
| S8 | `/docs` (Swagger) público em produção | Médio | P | 🔓 **Corrigido** — só monta a rota quando `NODE_ENV !== "production"` |
| S9 🆕 | IDs sequenciais expostos na API (não só no front) | Baixo-Médio | M | 🆕 Sem alteração — decisão mantida de não fazer agora |
| O1 | Scraper/cron frágil, sem alerta; credencial pessoal | Alto | M | 🔓 **Parcialmente corrigido** — execuções persistidas em `scraper_execucoes` + endpoint de consulta; credencial pessoal e catch-up após restart **ainda pendentes** |
| O2 | Erros engolidos sem log | Médio | M | 🔓 **Corrigido** — 54 blocos `catch`/`.catch()` sem log (eram 70−25 já cobertos pelo S5) ganharam `console.error` |
| O3 | Corrida em "checa e insere" vira 500 em vez de 409 | Baixo | P | ✅ Confirmado, com trecho exato — **ainda não corrigido** |
| O4 | Chave do `authenticatedLimiter` pode colidir | Baixo | P | 🔓 **Corrigido** — chave agora inclui o `role` (`user_123` ≠ `admin_123`), resolve a colisão real confirmada |
| O5 | IPs/portas fixos no código e `.env.example` inconsistente | Baixo | P | ✅ Confirmado (4 valores de porta diferentes) — **ainda não corrigido** |
| O6 | SSL do banco com `rejectUnauthorized: false` | Baixo | P | ✅ Confirmado — **ainda não corrigido** (baixa prioridade, mantido) |
| Q1 | Sem testes e sem CI | Alto | M | ✅ Confirmado — **ainda não iniciado** |
| Q2 | Verificação de token duplicada em 6 handlers | Baixo | P | ✅ Confirmado — handlers ganharam `tokenError`/log nesta sessão, mas a duplicação da verificação em si **não foi removida** |
| Q3 | Código morto e arquivos legados versionados | Baixo | P | ⚠️ Confirmado + 1 dependência órfã nova — **ainda não corrigido** |
| Q4 | Arquivos gigantes (front e controllers) | Médio | G | ✅ Confirmado, números exatos batem — **ainda não corrigido** |
| Q5 | Front sem lazy loading | Baixo | P | ✅ Confirmado (zero ocorrências) — **ainda não corrigido** |
| Q6 | `onClick={signOut}` passa o evento como argumento | Baixo | P | 🔓 **Corrigido** — existia em 3 layouts, todos trocados por `onClick={() => signOut()}` |
| Q7 | README desatualizado | Médio | P | ✅ Confirmado — **ainda não corrigido** |
| Q8 | Criar `CLAUDE.md` na raiz | Médio | P | ✅ Confirmado (não existe) — **ainda não corrigido** |
| Q9 🆕 | Documentação de arquitetura perdida | Baixo | P | 🆕 Ver nota — **ainda não corrigido** |
| Q10 🆕 | Dado de produção sem explicação registrada | — | — | 🆕 Pendência em aberto, não é bug de código |
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

### S7 — Endurecer o JWT — 🔓 Parcialmente corrigido
- **Era:** `SECRET` (10 caracteres) e `SECRET_ADMIN` (15 caracteres) eram curtos demais pra HMAC-SHA256; `SECRET_MASTER` (64 caracteres, `crypto.randomBytes(48)`) já estava no padrão adequado.
- **Correção aplicada:** `SECRET` e `SECRET_ADMIN` regenerados no `.env` **local**, mesmo padrão do `SECRET_MASTER` (64 caracteres base64 via `crypto.randomBytes(48)`).
- **Ainda não feito:** nenhum `jwt.verify` passa `{ algorithms: ['HS256'] }` explicitamente; não há validação de `SECRET`/`SECRET_ADMIN`/`SECRET_MASTER` no boot do servidor; não há mecanismo de revogação de token.
- **Pendência que não dá pra resolver por aqui:** não tenho acesso ao ambiente de produção (Render) — os segredos lá seguem como estavam antes. Se forem os mesmos valores fracos do `.env` local, a troca precisa ser feita manualmente lá também, e isso desloga qualquer sessão ativa no momento da troca.

### S8 — `/docs` público — 🔓 Corrigido
- **Era:** `app.js` montava `/docs` incondicionalmente, sem checar `NODE_ENV` nem exigir autenticação.
- **Correção aplicada:** `/docs` só é montado quando `NODE_ENV !== "production"` (reaproveitando a flag `isProduction` que já existia em `app.js`).
- **Testado:** em dev, `/docs` responde 200; a montagem condicional foi confirmada por inspeção de código e por um teste isolado com `NODE_ENV=production` (rota não registrada).

### S9 🆕 — IDs sequenciais expostos na própria API — sem alteração
- Mantida a decisão de não implementar IDs opacos (`hashids`/`sqids`) agora — custo maior que o benefício frente ao que já foi resolvido via autorização por escopo. Nenhuma mudança nesta rodada; não fazia parte dos itens 1 ou 3 da ordem sugerida.

---

## Operação e robustez

### O1 — Scraper de antiguidade — 🔓 Parcialmente corrigido
- **Era:** só `console.log`/`console.error`, sem persistência de "última execução" em lugar nenhum — um restart no meio da rotina fazia o dia desaparecer silenciosamente.
- **Correção aplicada:** nova tabela `scraper_execucoes` (migration `20261003140000_scraper_execucoes.js`) grava cada rodada do cron (status, tentativas, início/fim, detalhe do erro, sem dado sensível). Novo endpoint `GET /admin/antiguidade/historico-scraper` expõe isso pro admin, sem precisar de acesso ao log do servidor.
- **Testado:** linhas inseridas manualmente e lidas corretamente via HTTP, protegidas por `verifyJwt + isAdmin`.
- **Ainda não feito:** o scraper continua usando `PMSE_USER`/`PMSE_PASS` (credencial pessoal, não institucional) — decisão organizacional, não um bug de código, fora do meu alcance resolver sozinho. Também não existe catch-up automático: se o processo reiniciar durante a janela de execução (02h–04h), o dia ainda fica sem rodar — a diferença é que agora isso fica visível no histórico (ausência de linha daquele dia) em vez de completamente invisível.

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

### Q3 — Código morto e legado — sem alteração
Confirmados os 4 arquivos legados e a dependência órfã (`pagedjs`). Não corrigido nesta rodada.

### Q4 — Arquivos gigantes — sem alteração
Números batem com o documento original. Não corrigido nesta rodada (G = esforço grande, não estava no item 3).

### Q5 — Lazy loading — sem alteração
Zero ocorrências de `React.lazy`/`lazy(`. Não corrigido nesta rodada.

### Q6 — `onClick={signOut}` — 🔓 Corrigido
- **Era:** existia em `AdminLayout.jsx`, `UserLayout.jsx` e `MasterLayout.jsx` — o evento de clique do React era passado como primeiro argumento de `signOut(redirect=true)`, inofensivo por coincidência (qualquer valor truthy já significa "redireciona"), mas frágil.
- **Correção aplicada:** os 3 layouts trocaram `onClick={signOut}` por `onClick={() => signOut()}`.
- **Testado:** clique real em "Sair" nos 3 painéis — logout funciona nos 3.

### Q7 — README desatualizado — sem alteração
Continua com 35 linhas, sem citar os módulos novos nem variáveis de ambiente além do roteiro de instalação. Não corrigido nesta rodada.

### Q8 — `CLAUDE.md` — sem alteração
Continua não existindo em nenhum nível do repositório. Não corrigido nesta rodada.

### Q9 🆕 — Documentação de arquitetura perdida — sem alteração
Decisões de arquitetura desta e de sessões anteriores (segredo JWT próprio do master, `isAdmin` aceitando os dois perfis, autoria dupla `fk_id_admin`/`fk_id_master`, e agora também o padrão `must_change_password`/`scraper_execucoes`) continuam só registradas nesta conversa. Reforça a prioridade do Q8.

### Q10 🆕 — Dado de produção sem explicação — sem alteração
Pendência em aberto, sem resposta ainda: o admin `id_admin=100001` (CPF `032.510.074-82`) está gravado como "Admin do Master" em vez do "John Doe" do seed. Aguardando decisão sua.

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
2. **Base para trabalhar com segurança:** Q8 + Q9, Q7, início do Q1. — **Pendente.**
3. ~~**Antes de crescer o uso:** S4, S7, S8, O1, O2, O4.~~ **✅ Feito e testado** (S7 e O1 parcialmente — ver notas acima).
4. **Quando passar por cada arquivo:** O3, O5, O6, Q2–Q5. — **Pendente.**
5. **Decisões suas, não técnicas:** Q10 (nome do admin 100001). — **Pendente, aguardando resposta.**

---

## Changelog desta atualização

- **Item 1** (sessão anterior, já commitado em 6 commits separados): S1, S2, S3, S5, S6, Q6.
- **Item 3** (esta sessão, ainda **não commitado**): S4, S7 (parcial — só os segredos locais), S8, O1 (parcial — só a persistência/endpoint), O2, O4.
- **Achado e corrigido fora da lista, ainda não commitado**: bug do `getUser` (`ativo` sempre "Inativo" + `updated_at` da patente em vez do usuário).
- **Itens 2, 4 e 5 da ordem sugerida**: não iniciados.
