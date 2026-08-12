const cron = require('node-cron');
const rasparListaAntiguidade = require('../services/scraperAntiguidade');

const aguardar = (minutos) => new Promise(resolve => setTimeout(resolve, minutos * 60 * 1000));

// Intervalos de espera entre tentativas, em minutos. A 1ª tentativa é
// imediata; se falhar, espera 10 min e tenta de novo; se falhar de
// novo, espera mais 30 min (cobre o cenário de instabilidade momentânea
// no servidor da PM — sistema fora do ar e voltando dentro da janela)
// e faz a última tentativa do dia.
const INTERVALOS_RETENTATIVA_MIN = [10, 30];

async function rotinaDiaria() {
  console.log('\n[CRON] Iniciando rotina automática de atualização de antiguidade...');

  let sucesso = await rasparListaAntiguidade();
  let tentativa = 1;

  for (const minutos of INTERVALOS_RETENTATIVA_MIN) {
    if (sucesso) break;

    tentativa += 1;
    console.log(`[CRON] Falha na tentativa ${tentativa - 1}. Aguardando ${minutos} minutos antes da tentativa ${tentativa}...`);
    await aguardar(minutos);

    console.log(`[CRON] Iniciando tentativa ${tentativa}...`);
    sucesso = await rasparListaAntiguidade();
  }

  if (sucesso) {
    console.log(`[CRON] Rotina diária concluída com sucesso na tentativa ${tentativa}.`);
  } else {
    console.error(`[CRON] Todas as ${tentativa} tentativas falharam. Nova tentativa apenas amanhã.`);
  }
}

// Janela de execução: 02:00 até 04:00, com hora/minuto/segundo variando
// aleatoriamente dentro desse intervalo. Cron sozinho não sorteia
// horário — ele só dispara em ponto fixo — então o padrão aqui é:
// o cron chama sempre às 02:00 em ponto, e o próprio código sorteia um
// atraso extra de 0 a 2 horas antes de rodar a rotina de verdade. Isso
// dificulta a previsão do horário exato por quem estiver observando o
// tráfego da intranet (evita um padrão fixo e repetitivo todo dia).
const JANELA_MS = 2 * 60 * 60 * 1000; // 2 horas em milissegundos

function iniciarAgendamentos() {
  // rasparListaAntiguidade() já engole seus próprios erros (retorna
  // false, nunca lança), então rotinaDiaria() em si não deveria estourar.
  // Mesmo assim, o .catch() abaixo é uma segunda camada de proteção: se
  // qualquer coisa aqui dentro lançar uma exceção não prevista no futuro,
  // ela vira um "unhandled promise rejection" dentro do callback do
  // cron — e dependendo da versão do Node, isso pode derrubar o processo
  // inteiro (não só o scraper, o servidor Express junto). Sem o .catch,
  // um bug isolado no job de antiguidade poderia tirar toda a API do ar.
  cron.schedule('0 2 * * *', () => {
    const atrasoMs = Math.floor(Math.random() * JANELA_MS);
    const horarioPrevisto = new Date(Date.now() + atrasoMs);

    console.log(
      `[CRON] Gatilho das 02:00 disparado. Rotina vai rodar em ~${Math.round(atrasoMs / 60000)} min (por volta de ${horarioPrevisto.toLocaleTimeString('pt-BR', { timeZone: 'America/Maceio' })}).`,
    );

    setTimeout(() => {
      rotinaDiaria().catch((erro) => {
        console.error('[CRON] Erro inesperado na rotina diária:', erro);
      });
    }, atrasoMs);
  }, {
    scheduled: true,
    timezone: "America/Maceio"
  });

  console.log('Agendador de tarefas iniciado! O scraper da PMSE roda todos os dias em horário aleatório entre 02:00 e 04:00 (fuso America/Maceio).');
}

module.exports = iniciarAgendamentos;