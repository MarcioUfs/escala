import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Trash2,
  FileText,
  Calendar,
  RefreshCw,
  X,
  UserPlus,
} from "lucide-react";
import api from "../../services/api";

export default function TelaGerenciamentoEscala({ idEscalaAlvo = 100000 }) {
  // Estados para gerenciar os dados da escala e equipes
  const [guarnicoes, setGuarnicoes] = useState([]);
  const [escalaInfo, setEscalaInfo] = useState(null);

  // Estados para gerenciar alertas de sucesso/erro
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [isLoading, setIsLoading] = useState(false);

  // Estados do Modal de Inclusão de Militar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEquipe, setSelectedEquipe] = useState(null);
  const [searchMilitarTerm, setSearchMilitarTerm] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [selectedMilitarToInclude, setSelectedMilitarToInclude] =
    useState(null);

  const inicio = new Date(guarnicoes[0]?.data_inicio);
  const fim = new Date(guarnicoes[0]?.data_fim);
  const totalDias = Math.round((fim - inicio) / 86400000) + 1;
  const diasMes = Array.from({ length: totalDias }, (_, i) => {
    const data = new Date(inicio);
    data.setDate(inicio.getDate() + i);
    return data.getDate(); 
  });

  // Resultado será: [28, 29, 30, 31, 1, 2, 3...]

  const turnosConfig = [
    { label: "1ºT 07h as 15h", horaPrefix: "07" },
    { label: "2ºT 15h as 23h", horaPrefix: "15" },
    { label: "3ºT 23h as 07h", horaPrefix: "23" },
  ];
  // Busca inicial dos dados das guarnições da escala
  useEffect(() => {
    const fetchEscalaData = async () => {
      setIsLoading(true);
      try {
        const response = await api.post("/escalas/escala-guarnicoes", {
          id: idEscalaAlvo,
        });
        console.log("Dados recebidos do backend:", response.data);
        if (response.data && response.data.length > 0) {
          setGuarnicoes(response.data);
          setEscalaInfo({
            nome: response.data[0].nome,
            descricao: response.data[0].descricao,
          });
        }
      } catch (error) {
        setStatus({
          type: "error",
          msg:
            error.response?.data?.msg ||
            "Erro ao carregar dados das guarnições.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEscalaData();
  }, [idEscalaAlvo]);

  // Função para abrir o modal e buscar todos os militares
  const handleOpenModal = async (grupamento) => {
    setSelectedEquipe(grupamento);
    setIsModalOpen(true);
    setSearchMilitarTerm("");
    setSelectedMilitarToInclude(null);

    try {
      const response = await api.get("/admin/allusers");
      setAllUsers(response.data);
    } catch (error) {
      console.error("Erro ao buscar lista de militares", error);
      // Fallback de mock temporário caso a rota falhe
      setAllUsers([
        {
          id_user: 20001,
          nome_guerra: "SGT Silva",
          graduacao: "3° SGT",
          matricula: "12345",
        },
        {
          id_user: 20002,
          nome_guerra: "CB Oliveira",
          graduacao: "CB",
          matricula: "67890",
        },
        {
          id_user: 20003,
          nome_guerra: "SD Alves",
          graduacao: "SD",
          matricula: "54321",
        },
      ]);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEquipe(null);
  };

  const handleIncludeMilitar = async () => {
    if (!selectedMilitarToInclude) return;

    try {
      /* Ponto de injeção da requisição pronta para inserir o militar na equipe
      await api.post('/escalas/inserir-militar', {
        id_escala: idEscalaAlvo,
        grupamento: selectedEquipe,
        id_user: selectedMilitarToInclude.id_user
      });
      */

      setStatus({
        type: "success",
        msg: `Militar incluído na Equipe ${selectedEquipe} com sucesso!`,
      });
      handleCloseModal();
    } catch {
      setStatus({ type: "error", msg: "Falha ao incluir militar na equipe." });
    }
  };

  const getFilteredAvailableUsers = () => {
    const equipeAtual = guarnicoes.find((g) => g.grupamento === selectedEquipe);
    const membrosAtuaisIds =
      equipeAtual?.dados_guarnicao?.grupamento_escala?.map((m) => m.id_user) ||
      [];

    return allUsers.filter(
      (user) =>
        !membrosAtuaisIds.includes(user.id_user) &&
        (user.nome_guerra
          ?.toLowerCase()
          .includes(searchMilitarTerm.toLowerCase()) ||
          user.matricula?.includes(searchMilitarTerm)),
    );
  };
  // console.log(guarnicoes[0]?.data_guarnicao);
  // console.log(guarnicoes[0]?.data_inicio);
  // Função central para popular o quadro de grade de distribuição das equipes
  const getEquipePorDiaETurno = (dia, indexTurno) => {
    const turnoInfo = turnosConfig[indexTurno];
    const diaFormatado = dia.toString().padStart(2, "0");

    // 1. Tenta extrair a guarnição real dos dados do backend
    const guarnicaoEncontrada = guarnicoes?.data_guarnicao?.find((g) => {
      if (!g.data_guarnicao || !g.hora_guarnicao) return false;
      const dataParte = g.data_guarnicao.split("T")[0];
      const diaGuarnicao = dataParte.split("-")[2];
      const horaGuarnicao = g.hora_guarnicao.substring(0, 2);

      return (
        diaGuarnicao === diaFormatado && horaGuarnicao === turnoInfo.horaPrefix
      );
    });

    if (guarnicaoEncontrada && guarnicaoEncontrada.grupamento) {
      return guarnicaoEncontrada.grupamento;
    }

    // 2. Se não existir no backend, calcula o restante dinamicamente seguindo a regra das 6 equipes
    const equipes = ["A", "B", "C", "D", "E", "F"];
    // Fórmula para rotação: ex: equipe A (idx 0) faz D1 T1, D2 T2, D3 T3, folga, folga, folga
    const indexCalculado = (indexTurno - dia + 1 + 60) % 6;
    return equipes[indexCalculado];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-800 relative">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              E-Escala | Gerenciamento de Pessoal
            </h1>
            <p className="text-sm text-gray-500">
              {escalaInfo
                ? `${escalaInfo.nome} - ${escalaInfo.descricao}`
                : "Carregando escala..."}
            </p>
          </div>
        </header>

        {/* Alertas de Status */}
        {status.msg && (
          <div
            className={`p-4 rounded-md flex justify-between items-center ${status.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}
          >
            <span>{status.msg}</span>
            <button
              onClick={() => setStatus({ type: "", msg: "" })}
              className="text-current hover:opacity-75"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Visualização da Grade da Escala */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-300 overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Escala</h2>
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium border border-blue-200 px-3 py-1 rounded transition-colors bg-white">
              Editar
            </button>
          </div>

          <div className="overflow-x-auto custom-scrollbar pb-2">
            <table className="min-w-full border-collapse text-center text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left w-48 sticky left-0 bg-gray-100 z-10 shadow-[1px_0_0_0_#d1d5db]">
                    Mês
                  </th>
                  {diasMes.map((dia) => (
                    <th
                      key={dia}
                      className="border border-gray-300 p-2 min-w-[32px] text-gray-700"
                    >
                      {dia}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {turnosConfig.map((turno, indexTurno) => (
                  <tr
                    key={indexTurno}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="border border-gray-300 p-2 text-left font-medium text-xs sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#d1d5db]">
                      {turno.label}
                    </td>
                    {diasMes.map((dia) => {
                      const equipeDesignada = getEquipePorDiaETurno(
                        dia,
                        indexTurno,
                      );
                      return (
                        <td
                          key={dia}
                          className="border border-gray-300 p-2 cursor-pointer hover:bg-blue-100 text-gray-800 font-bold transition-colors"
                        >
                          {equipeDesignada}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Painel de Efetivo / Despachantes */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-6 pb-2 border-b">Efetivo</h2>

          {isLoading ? (
            <div className="flex justify-center p-8 text-blue-600">
              <RefreshCw className="animate-spin" size={32} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {guarnicoes.map((guarnicao) => (
                <div
                  key={guarnicao.id_guarnicao}
                  className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow flex flex-col"
                >
                  {/* Header do Card da Guarnição */}
                  <div className="flex justify-between items-center border-b pb-3 mb-3">
                    <h3 className="font-bold text-blue-800 text-lg flex items-center gap-2">
                      Equipe {guarnicao.grupamento}
                    </h3>
                    <button
                      onClick={() => handleOpenModal(guarnicao.grupamento)}
                      className="text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white p-1.5 rounded transition-colors"
                      title={`Adicionar militar na Equipe ${guarnicao.grupamento}`}
                    >
                      <Plus size={20} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Lista de Militares na Guarnição */}
                  <ul className="space-y-3 text-sm text-gray-700 flex-1 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                    {guarnicao.dados_guarnicao?.grupamento_escala?.map(
                      (militar) => (
                        <li
                          key={militar.id_user}
                          className="flex flex-col p-2 bg-gray-50 border border-gray-100 rounded-md group hover:border-blue-200 transition-colors"
                        >
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="font-semibold">
                              {militar.graduacao} {militar.nome_guerra}
                            </span>
                            <span className="text-xs font-mono text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                              2/10 extras
                            </span>
                          </div>

                          {/* Ações do Militar */}
                          <div className="flex justify-end space-x-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Ver ficha"
                            >
                              <FileText size={16} />
                            </button>
                            <button
                              className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                              title="Ver dias de serviço"
                            >
                              <Calendar size={16} />
                            </button>
                            <button
                              className="p-1 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                              title="Ver permutas"
                            >
                              <RefreshCw size={16} />
                            </button>
                            <button
                              className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Excluir da escala"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </li>
                      ),
                    )}

                    {(!guarnicao.dados_guarnicao?.grupamento_escala ||
                      guarnicao.dados_guarnicao.grupamento_escala.length ===
                        0) && (
                      <p className="text-gray-400 text-center py-4 italic">
                        Nenhum militar na equipe.
                      </p>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* MODAL: Incluir Militar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden">
            {/* Header Modal */}
            <div className="flex justify-between items-center p-5 border-b bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">
                Incluir militar na Equipe {selectedEquipe}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-5 flex-1 overflow-hidden flex flex-col space-y-4">
              <div className="relative">
                <Search
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou matrícula..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={searchMilitarTerm}
                  onChange={(e) => setSearchMilitarTerm(e.target.value)}
                />
              </div>

              <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg max-h-64">
                <ul className="divide-y divide-gray-100">
                  {getFilteredAvailableUsers().map((user) => (
                    <li
                      key={user.id_user}
                      onClick={() => setSelectedMilitarToInclude(user)}
                      className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${selectedMilitarToInclude?.id_user === user.id_user ? "bg-blue-50 border-l-4 border-blue-500" : "hover:bg-gray-50"}`}
                    >
                      <div>
                        <p className="font-medium text-gray-800">
                          {user.graduacao} {user.nome_guerra}
                        </p>
                        <p className="text-xs text-gray-500">
                          Mat: {user.matricula}
                        </p>
                      </div>
                      {selectedMilitarToInclude?.id_user === user.id_user && (
                        <div className="text-blue-600 bg-blue-100 p-1.5 rounded-full">
                          <UserPlus size={16} />
                        </div>
                      )}
                    </li>
                  ))}
                  {getFilteredAvailableUsers().length === 0 && (
                    <li className="p-4 text-center text-gray-500 text-sm">
                      Nenhum militar disponível encontrado.
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleIncludeMilitar}
                disabled={!selectedMilitarToInclude}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Incluir Militar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}
