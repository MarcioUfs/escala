const cron = require('node-cron');
const rasparListaAntiguidade = require('../services/scraperAntiguidade');

const aguardar = (minutos) => new Promise(resolve => setTimeout(resolve, minutos * 60 * 1000));

async function rotinaDiaria() {
  console.log('\n[CRON] Iniciando rotina automática de atualização de antiguidade...');
  
  let sucesso = await rasparListaAntiguidade();

  if (!sucesso) {
    console.log('[CRON] Falha na 1ª tentativa. Aguardando 10 minutos...');
    await aguardar(10);
    
    console.log('[CRON] Iniciando 2ª tentativa...');
    sucesso = await rasparListaAntiguidade();

    if (!sucesso) {
      console.error('[CRON] A 2ª tentativa falhou. Nova tentativa apenas amanhã.');
    } else {
      console.log('[CRON] 2ª tentativa bem-sucedida! Banco atualizado.');
    }
  } else {
    console.log('[CRON] Rotina diária concluída de primeira!');
  }
}

function iniciarAgendamentos() {
  // Roda todos os dias às 03:00 da manhã
  // Agendador parado!!!
  // cron.schedule('0 3 * * *', rotinaDiaria, {
  //   scheduled: true,
  //   timezone: "America/Maceio" 
  // });

  console.log('Agendador de tarefas iniciado! O scraper da PMSE rodará todos os dias às 03:00.');
}

module.exports = iniciarAgendamentos;