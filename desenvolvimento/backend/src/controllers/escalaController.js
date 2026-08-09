// const escalaService = require("../services/escalaService");

// async function criarGuarnicao(req, res) {
//   try {
//     const { nome, codigo, capacidade_maxima, descricao } = req.body;

//     if (!nome || !codigo || !capacidade_maxima) {
//       return res.status(400).json({
//         msg: "nome, codigo e capacidade_maxima são obrigatórios",
//       });
//     }

//     if (Number(capacidade_maxima) <= 0) {
//       return res.status(400).json({
//         msg: "capacidade_maxima deve ser maior que zero",
//       });
//     }

//     const guarnicao = await escalaService.criarGuarnicao({
//       nome,
//       codigo,
//       capacidade_maxima: Number(capacidade_maxima),
//       descricao: descricao || null,
//     });

//     return res.status(201).json({
//       msg: "Guarnição criada com sucesso",
//       guarnicao,
//     });
//   } catch (error) {

//     if (error.message === "Já existe uma guarnição com esse código") {
//       return res.status(409).json({ msg: error.message });
//     }

//     return res.status(500).json({
//       msg: "Erro interno do servidor",
//     });
//   }
// }

// async function listarGuarnicoes(req, res) {
//   try {
//     const guarnicoes = await escalaService.listarGuarnicoes();

//     return res.status(200).json(guarnicoes);
//   } catch (error) {
//     return res.status(500).json({
//       msg: "Erro interno do servidor",
//     });
//   }
// }

// async function gerarEscala(req, res) {
//   try {
//     const {
//       nome_escala,
//       ano,
//       mes,
//       id_guarnicao,
//       modelo_codigo,
//       militares,
//       dias,
//       data_inicial,
//       quantidade_dias,
//     } = req.body;

//     if (!nome_escala || !ano || !mes || !id_guarnicao || !modelo_codigo) {
//       return res.status(400).json({
//         msg: "nome_escala, ano, mes, id_guarnicao e modelo_codigo são obrigatórios",
//       });
//     }

//     if (!Array.isArray(militares) || militares.length === 0) {
//       return res.status(400).json({
//         msg: "O campo militares deve ser um array com ids de usuários",
//       });
//     }

//     const usarDias = Array.isArray(dias) && dias.length > 0;
//     const usarDataInicialEQuantidade = !!data_inicial && !!quantidade_dias;

//     if (!usarDias && !usarDataInicialEQuantidade) {
//       return res.status(400).json({
//         msg: "Informe 'dias' ou então 'data_inicial' com 'quantidade_dias'",
//       });
//     }

//     const escala = await escalaService.gerarEscala({
//       nome_escala,
//       ano: Number(ano),
//       mes: Number(mes),
//       id_guarnicao: Number(id_guarnicao),
//       modelo_codigo,
//       militares: militares.map(Number),
//       dias: usarDias ? dias.map(Number) : null,
//       data_inicial: data_inicial || null,
//       quantidade_dias: quantidade_dias ? Number(quantidade_dias) : null,
//       id_admin_criador: req.user?.id_admin || null,
//     });

//     return res.status(201).json({
//       msg: "Escala gerada com sucesso",
//       escala,
//     });
//   } catch (error) {

//     const errosConhecidos = [
//       "Guarnição não encontrada",
//       "Modelo de escala não encontrado",
//       "Quantidade de militares maior que a capacidade da guarnição",
//       "Nenhum militar ativo encontrado",
//       "Existem militares inválidos ou inativos na lista enviada",
//       "O array de dias deve conter apenas números inteiros positivos",
//       "data_inicial inválida",
//       "quantidade_dias deve ser maior que zero",
//       "Modelo de escala ainda não implementado",
//     ];

//     if (errosConhecidos.includes(error.message)) {
//       return res.status(400).json({ msg: error.message });
//     }

//     return res.status(500).json({
//       msg: "Erro interno do servidor",
//     });
//   }
// }

// async function listarModelosEscala(req, res) {
//   try {
//     const modelos = await escalaService.listarModelosEscala();

//     return res.status(200).json(modelos);
//   } catch (error) {
//     return res.status(500).json({
//       msg: "Erro interno do servidor",
//     });
//   }
// }

// module.exports = {
//   criarGuarnicao,
//   listarGuarnicoes,
//   gerarEscala,
//   listarModelosEscala,
// };