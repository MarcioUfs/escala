const { parse: csvParseSync } = require("csv-parse/sync");
const validarCPF = require("./validarCPF");

// Formato aceito: o mesmo CSV que a tela de antiguidade do site da PM
// permite exportar (separado por ";", campos entre aspas, cabeçalho em
// português) — ver src/database/arquivos/lista_antiguidade_completa.csv
// como referência real. CPF e Data de Admissão são colunas extras que só
// existem na API interna do site (usada pelo job automático em
// scraperAntiguidade.js), não no export manual — por isso são opcionais
// aqui.
const LIMITE_BYTES = 5 * 1024 * 1024; // 5MB — o export real (~5500 linhas) tem ~570KB
const LIMITE_LINHAS = 20000;
const LIMITE_ERROS_EXIBIDOS = 200;

// Chave = cabeçalho normalizado (minúsculo, sem espaços duplicados) ->
// nome do campo no banco.
const MAPA_CABECALHOS = {
  "nº": "ordem",
  patente: "patente",
  quadro: "quadro",
  matrícula: "matricula",
  nome: "nome",
  "data de promoção": "data_promocao",
  "tempo de promoção": "tempo_promocao",
  cpf: "cpf",
  "data de admissão": "data_admissao",
};

const CAMPOS_OBRIGATORIOS = [
  "nº",
  "patente",
  "quadro",
  "matrícula",
  "nome",
  "data de promoção",
  "tempo de promoção",
];

const CAMPOS_OPCIONAIS = ["cpf", "data de admissão"];

// Todo campo aceito começa obrigatoriamente com letra/dígito — isso, por
// si só, já barra os prefixos clássicos de injeção de fórmula em planilha
// (=, +, -, @, tab) em qualquer coluna, sem precisar de uma checagem
// separada pra isso: nada que não bata 100% com o formato esperado entra
// no banco.
const REGEX_ORDEM = /^\d{1,6}$/;
const REGEX_MATRICULA = /^\d{4,15}-\d{2}$/;
const REGEX_NOME = /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ' .-]{1,149}$/;
const REGEX_PATENTE = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9ºª][A-Za-zÀ-ÖØ-öø-ÿ0-9ºª ]{0,19}$/;
const REGEX_QUADRO = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9][A-Za-zÀ-ÖØ-öø-ÿ0-9/\- ]{0,19}$/;
const REGEX_DATA = /^\d{2}\/\d{2}\/\d{4}$/;
const REGEX_TEMPO_PROMOCAO = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9][A-Za-zÀ-ÖØ-öø-ÿ0-9 ]{0,59}$/;

// "Tempo de Promoção" pode vir vazio (militar recém-promovido, ainda sem
// tempo suficiente pro site calcular) — mesmo comportamento tolerado pelo
// job automático (scraperAntiguidade.js) e pela migration que tornou essa
// coluna opcional no banco.

function normalizarCabecalho(texto) {
  return (texto || "")
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

// Trunca e remove caracteres de controle antes de ecoar um valor bruto do
// CSV numa mensagem de erro — a mensagem é só texto exibido no front
// (nunca renderizado como HTML), mas mesmo assim não custa evitar lixo
// binário/control chars no log e na resposta.
function amostraSegura(valor) {
  return String(valor ?? "")
    .replace(/[\x00-\x1F\x7F]/g, "")
    .slice(0, 40);
}

function validarCsvAntiguidade(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    return { ok: false, erros: ["Arquivo vazio ou ilegível."], registros: [] };
  }

  if (buffer.length > LIMITE_BYTES) {
    return {
      ok: false,
      erros: [`Arquivo maior que o limite permitido de ${LIMITE_BYTES / (1024 * 1024)}MB.`],
      registros: [],
    };
  }

  // Detecta arquivo binário (não-texto) antes de tentar decodificar.
  if (buffer.includes(0)) {
    return {
      ok: false,
      erros: ["Arquivo não parece ser um CSV de texto (contém dados binários)."],
      registros: [],
    };
  }

  const textoBruto = buffer.toString("utf8");
  if (textoBruto.includes("�")) {
    return {
      ok: false,
      erros: ["Arquivo não está em UTF-8 válido. Salve o CSV como 'UTF-8' e tente novamente."],
      registros: [],
    };
  }

  const texto = textoBruto.replace(/^﻿/, "");

  let linhas;
  try {
    linhas = csvParseSync(texto, {
      delimiter: ";",
      quote: '"',
      relax_column_count: false,
      skip_empty_lines: true,
      trim: true,
    });
  } catch (erroParse) {
    return {
      ok: false,
      erros: [`Falha ao interpretar o CSV: ${erroParse.message}`],
      registros: [],
    };
  }

  if (linhas.length === 0) {
    return { ok: false, erros: ["Arquivo não contém nenhuma linha."], registros: [] };
  }

  const cabecalhoBruto = linhas[0];
  const linhasDados = linhas.slice(1);

  if (linhasDados.length === 0) {
    return { ok: false, erros: ["Arquivo só tem cabeçalho, nenhum registro."], registros: [] };
  }

  if (linhasDados.length > LIMITE_LINHAS) {
    return {
      ok: false,
      erros: [`Arquivo tem mais de ${LIMITE_LINHAS} registros — acima do limite permitido.`],
      registros: [],
    };
  }

  const errosCabecalho = [];
  const cabecalhoNormalizado = cabecalhoBruto.map(normalizarCabecalho);

  const vistos = new Set();
  cabecalhoNormalizado.forEach((chave) => {
    if (vistos.has(chave)) {
      errosCabecalho.push(`Coluna duplicada no cabeçalho: "${chave}".`);
    }
    vistos.add(chave);
  });

  cabecalhoNormalizado.forEach((chave) => {
    if (!MAPA_CABECALHOS[chave]) {
      errosCabecalho.push(`Coluna não reconhecida no cabeçalho: "${amostraSegura(chave)}".`);
    }
  });

  CAMPOS_OBRIGATORIOS.forEach((chave) => {
    if (!cabecalhoNormalizado.includes(chave)) {
      errosCabecalho.push(`Coluna obrigatória ausente: "${chave}".`);
    }
  });

  if (errosCabecalho.length > 0) {
    return { ok: false, erros: errosCabecalho, registros: [] };
  }

  const indicePorCampo = {};
  [...CAMPOS_OBRIGATORIOS, ...CAMPOS_OPCIONAIS].forEach((chave) => {
    const indice = cabecalhoNormalizado.indexOf(chave);
    if (indice !== -1) {
      indicePorCampo[MAPA_CABECALHOS[chave]] = indice;
    }
  });

  const pegar = (linha, campo) => {
    const indice = indicePorCampo[campo];
    return indice === undefined ? "" : (linha[indice] || "").trim();
  };

  const erros = [];
  const registros = [];
  const matriculasVistas = new Set();

  linhasDados.forEach((linha, i) => {
    const numeroRegistro = i + 1;

    if (linha.length !== cabecalhoBruto.length) {
      erros.push(
        `Registro ${numeroRegistro}: número de colunas (${linha.length}) diferente do cabeçalho (${cabecalhoBruto.length}).`,
      );
      return;
    }

    const ordemBruta = pegar(linha, "ordem");
    const matriculaBruta = pegar(linha, "matricula");
    const nomeBruto = pegar(linha, "nome");
    const patenteBruta = pegar(linha, "patente");
    const quadroBruto = pegar(linha, "quadro");
    const dataPromocaoBruta = pegar(linha, "data_promocao");
    const tempoPromocaoBruto = pegar(linha, "tempo_promocao");
    const cpfBruto = pegar(linha, "cpf");
    const dataAdmissaoBruta = pegar(linha, "data_admissao");

    let temErro = false;
    const erroRegistro = (campo, valor) => {
      erros.push(`Registro ${numeroRegistro}: campo "${campo}" inválido ("${amostraSegura(valor)}").`);
      temErro = true;
    };

    if (!REGEX_ORDEM.test(ordemBruta)) erroRegistro("Nº", ordemBruta);
    if (!REGEX_MATRICULA.test(matriculaBruta)) erroRegistro("Matrícula", matriculaBruta);
    if (!REGEX_NOME.test(nomeBruto)) erroRegistro("Nome", nomeBruto);
    if (!REGEX_PATENTE.test(patenteBruta)) erroRegistro("Patente", patenteBruta);
    if (!REGEX_QUADRO.test(quadroBruto)) erroRegistro("Quadro", quadroBruto);
    if (!REGEX_DATA.test(dataPromocaoBruta)) erroRegistro("Data de Promoção", dataPromocaoBruta);
    if (tempoPromocaoBruto && !REGEX_TEMPO_PROMOCAO.test(tempoPromocaoBruto)) {
      erroRegistro("Tempo de Promoção", tempoPromocaoBruto);
    }

    let cpfLimpo = null;
    if (cpfBruto) {
      cpfLimpo = cpfBruto.replace(/\D/g, "");
      if (!validarCPF(cpfLimpo)) erroRegistro("CPF", cpfBruto);
    }

    if (dataAdmissaoBruta && !REGEX_DATA.test(dataAdmissaoBruta)) {
      erroRegistro("Data de Admissão", dataAdmissaoBruta);
    }

    if (temErro) return;

    if (matriculasVistas.has(matriculaBruta)) {
      erros.push(`Registro ${numeroRegistro}: matrícula "${amostraSegura(matriculaBruta)}" duplicada no arquivo.`);
      return;
    }
    matriculasVistas.add(matriculaBruta);

    registros.push({
      matricula: matriculaBruta,
      nome: nomeBruto,
      patente: patenteBruta,
      quadro: quadroBruto,
      ordem: parseInt(ordemBruta, 10),
      antiguidade: ordemBruta,
      data_promocao: dataPromocaoBruta,
      tempo_promocao: tempoPromocaoBruto || null,
      cpf: cpfLimpo,
      data_admissao: dataAdmissaoBruta || null,
    });
  });

  if (erros.length > 0) {
    const errosExibidos = erros.slice(0, LIMITE_ERROS_EXIBIDOS);
    if (erros.length > LIMITE_ERROS_EXIBIDOS) {
      errosExibidos.push(`... e mais ${erros.length - LIMITE_ERROS_EXIBIDOS} erro(s) não exibido(s).`);
    }
    return { ok: false, erros: errosExibidos, registros: [] };
  }

  return { ok: true, erros: [], registros };
}

module.exports = validarCsvAntiguidade;
