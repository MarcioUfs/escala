require("dotenv").config();
const axios = require("axios");
const cheerio = require("cheerio");
const https = require("https");

// Conexão com o banco via Knex
const db = require("../database/db.js");

// Ignora erros de certificado
const agent = new https.Agent({
  rejectUnauthorized: false,
});

async function rasparListaAntiguidade() {
  try {
    const urlLogin = "https://intranet.pm.se.gov.br/portal/login";

    const dadosLogin = new URLSearchParams({
      login: process.env.PMSE_USER,
      senha: process.env.PMSE_PASS,
    });

    console.log("Tentando fazer login...");

    const respostaLogin = await axios.post(urlLogin, dadosLogin, {
      httpsAgent: agent,
      maxRedirects: 0,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      validateStatus: function (status) {
        return status >= 200 && status < 400;
      },
    });

    const cookies = respostaLogin.headers["set-cookie"];
    if (!cookies) {
      console.log("Falha no login: O servidor não retornou o cookie de sessão.");
      return false; // <-- Avisa o agendador que falhou
    }

    console.log("Login efetuado! Acessando a lista de antiguidade...");

    const urlLista = "https://intranet.pm.se.gov.br/portal/policialAntiguidadeListar";
    const respostaLista = await axios.get(urlLista, {
      httpsAgent: agent,
      headers: {
        Cookie: cookies.join("; "),
      },
    });

    const $ = cheerio.load(respostaLista.data);
    const listaExtraida = [];

    $("table tbody tr").each((index, elemento) => {
      // Índices corretos mapeados no Raio-X
      const antiguidade = $(elemento).find('td').eq(1).text().trim(); 
      const ordem = parseInt($(elemento).find('td').eq(1).text().trim().replace(/\D/g, ''), 10);
      const patente = $(elemento).find('td').eq(2).text().trim(); 
      const quadro = $(elemento).find('td').eq(3).text().trim(); 
      const matricula = $(elemento).find('td').eq(4).text().trim().replace(/\D/g, '');   
      const nome = $(elemento).find('td').eq(5).text().trim();        
      const data_promocao = $(elemento).find('td').eq(6).text().trim();        
      const tempo_promocao = $(elemento).find('td').eq(7).text().trim();        

      // Validação de segurança
      if (matricula && !matricula.toLowerCase().includes('matr')) {
        listaExtraida.push({ nome, antiguidade, matricula, patente, ordem, quadro, data_promocao, tempo_promocao  });
      }
    });

    console.log(`Extração concluída! Foram encontrados ${listaExtraida.length} registros.`);

    // === INTEGRAÇÃO COM O BANCO DE DADOS ===
    if (listaExtraida.length > 0) {
      console.log('Limpando matrículas duplicadas vindas do portal...');
      
      // Filtra as matrículas únicas
      const listaSemDuplicatas = Array.from(
        new Map(listaExtraida.map(policial => [policial.matricula, policial])).values()
      );

      console.log(`De ${listaExtraida.length} linhas lidas, temos ${listaSemDuplicatas.length} policiais únicos.`);
      console.log('Salvando e atualizando dados no banco...');
      
      // Salva no PostgreSQL atualizando quem já existe
      await db('efetivo_antiguidade')
        .insert(listaSemDuplicatas)
        .onConflict('matricula')
        .merge();

      console.log('Sucesso! Banco de dados sincronizado.');
      return true; // <-- Avisa o agendador que deu tudo certo!

    } else {
      console.log('Nenhum dado encontrado para salvar.');
      return false; // <-- Avisa o agendador que a lista veio vazia
    }
  } catch (erro) {
    console.error("Erro na automação:", erro.message);
    return false; // <-- Avisa o agendador se houver queda de internet/timeout
  } 
}

// O db.destroy() foi removido para não derrubar o servidor
// A execução automática também foi removida, agora quem controla é o cron job

module.exports = rasparListaAntiguidade;