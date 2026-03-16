const database = require("../database/db");
const somenteMatricula = require("../functions/somenteMatricula");

// Função auxiliar para converter "21/04/2023" do CSV para "2023-04-21" do PostgreSQL
const formatarData = (dataBr) => {
  const partes = dataBr.split('/');
  if (partes.length === 3) {
    return `${partes[2]}-${partes[1]}-${partes[0]}`;
  }
  return dataBr;
};

async function syncAlmanaqueCsv(req, res) {
  // A automação enviará o CSV convertido em JSON no body.csvData
  const { csvData } = req.body;

  if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
    return res.status(400).json({ msg: "Nenhum dado enviado para sincronização." });
  }

  try {
    // 1. Limpeza e formatação dos dados do CSV
    const dadosParaInserir = csvData.map((linha) => {
      return {
        // Pega "9º" e deixa só "9"
        ordem: parseInt(linha.Ordem.replace(/\D/g, '')), 
        patente: linha.Patente.trim(),
        quadro: linha.Quadro.trim(),
        // Usa a sua função já existente para limpar a matrícula
        matricula: somenteMatricula(linha.Matricula),
        nome: linha.Nome.trim(),
        data_promocao: formatarData(linha['Data de Promoção']),
        tempo_promocao: linha['Tempo de Promoção'].trim(),
        updated_at: new Date() // Força a atualização da data da raspagem
      };
    });

    // 2. Inserção Inteligente (UPSERT)
    // O PostgreSQL tenta inserir. Se a matrícula já existir, ele atualiza os dados daquele PM.
    await database("almanaque_pmse")
      .insert(dadosParaInserir)
      .onConflict("matricula")
      .merge(); // <-- A mágica acontece aqui!

    return res.status(200).json({ 
      msg: "Sincronização concluída com sucesso!", 
      total_processado: dadosParaInserir.length 
    });

  } catch (error) {
    console.error("Erro na sincronização do Almanaque:", error);
    return res.status(500).json({ msg: "Erro interno ao salvar os dados da raspagem." });
  }
}

module.exports = { syncAlmanaqueCsv };