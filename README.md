# 🛡️ E-Escala | Sistema de Gerenciamento de Escalas de Serviço

> Uma plataforma robusta, responsiva e adaptável, projetada para automatizar o gerenciamento de escalas de serviço. Ideal para instituições que demandam controle rigoroso de hierarquia e antiguidade, como Forças Policiais, Guardas Municipais, Empresas de Segurança Privada e Setores de Saúde.

## 📋 Sobre o Projeto

O **E-Escala** foi desenvolvido para otimizar a criação e o controle de turnos e escalas de serviço. O grande diferencial do sistema é o seu motor de regras de negócio, que permite aplicar critérios de precedência (cargo, peso hierárquico e tempo de serviço) para garantir que a ordenação e a distribuição das escalas ocorram de forma justa, correta e automática, adaptando-se à realidade de diferentes corporações.

## ✨ Principais Funcionalidades

* **Gestão Adaptável de Usuários:** Sistema seguro para login e controle de acesso baseado em perfis.
* **Módulo de Hierarquia e Antiguidade:** Estrutura de dados desenhada para lidar com precedência de forma dinâmica, armazenando:
  * Cargo / Patente / Função
  * Sigla e Peso Hierárquico
  * Tempo de Serviço (Anos, Meses e Dias) para desempate rigoroso de antiguidade.
* **Painel de Controle (Dashboard):** Interface dedicada para visualização rápida e intuitiva das informações do profissional.
* **Módulo de Escala de Serviço (Core):** Motor de geração e listagem de escalas baseadas nas regras da corporação.
* **Interface Responsiva (Mobile First):** Listagem de usuários que se adapta dinamicamente, exibindo tabelas completas no desktop e transformando-se em *cards* intuitivos em dispositivos móveis.

## 🚀 Tecnologias Utilizadas

O projeto foi construído utilizando tecnologias modernas para garantir alta performance, segurança e facilidade de manutenção:

**Backend:**
* **Node.js** & **Express** - Construção da API RESTful.
* **Knex.js** - Query Builder para gerenciamento prático de migrações e consultas.
* **PostgreSQL** - Banco de dados relacional robusto para garantir a integridade de relacionamentos complexos.

**Frontend:**
* Interface responsiva com foco em UX/UI.
* Design adaptativo focado na usabilidade de quem gerencia a escala em qualquer dispositivo.

## 🗄️ Modelagem de Dados (Destaque Arquitetural)

Para garantir a flexibilidade e a correta aplicação de regras de precedência de diferentes nichos, o banco de dados isola a autenticação dos dados profissionais:

- `users`: Gerencia credenciais de acesso (email, senha, status da conta).
- `dados_profissionais` (relacionada 1:1 via `user_id`): Armazena as variáveis cruciais para a ordenação das escalas, como peso da função e cálculo exato do tempo de serviço corporativo.

---

## 🛠️ Como Executar o Projeto Localmente

Siga os passos abaixo para rodar o E-Escala no seu ambiente de desenvolvimento.

### Pré-requisitos
* Node.js instalado (versão 16 ou superior recomendada)
* PostgreSQL rodando localmente ou via container (Docker)
* Git instalado

### Passo a Passo da Instalação

1. **Clone o repositório:**
   ```bash
   git clone [https://github.com/SEU_USUARIO/e-escala.git](https://github.com/SEU_USUARIO/e-escala.git)
