import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X, AlertTriangle, Search } from "lucide-react";
import api from "../../services/api";

// Gestão de administradores pelo perfil master — mesmo layout de
// /admin/admins (cards no mobile, tabela no desktop), mesmas cores de ação
// (Ver cinza, Editar amarelo, Excluir vermelho). O que muda é só a cor de
// marca do master (vermelho no lugar do azul do admin), aplicada aqui no
// botão "Novo administrador" e nos destaques de foco — os botões de ação
// continuam com as mesmas cores da versão do admin, de propósito.
//
// "Ver" e "Editar" navegam para telas PRÓPRIAS do master (/master/view-admin
// e /master/edit-admin), não para as rotas de usuário que a lista do admin
// usa por engano (/admin/edit-user espera dados de user comum — matrícula,
// patente etc. — campos que não existem num admin).
//
// Usa as rotas que já existem em /admin (createadmin, alladmins, updateadmin,
// deleteadmin) — o token de master passa no isAdmin delas. Não há rota
// duplicada sob /master justamente para não manter duas versões da mesma regra.
// Os administradores continuam podendo gerenciar administradores; o master
// ganhou a capacidade, ninguém perdeu nada.

const FORM_VAZIO = { nome: "", cpf: "", password: "" };

function mascararCpf(valor) {
  let v = String(valor || "").replace(/\D/g, "").slice(0, 11);
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  return v;
}

export default function MasterAdmins() {
  const navigate = useNavigate();

  const [admins, setAdmins] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState("");

  const [modalNovo, setModalNovo] = useState(false);
  const [formNovo, setFormNovo] = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState(null);

  const [confirmarExclusao, setConfirmarExclusao] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  // Nenhum setState antes do primeiro await: o estado já nasce "carregando",
  // e numa recarga a tabela atual continua na tela até os dados novos
  // chegarem (sem piscar).
  const carregar = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/alladmins");
      setAdmins(Array.isArray(data) ? data : []);
      setErro(null);
    } catch (err) {
      // 404 aqui significa "nenhum administrador", não falha de verdade.
      if (err.response?.status === 404) {
        setAdmins([]);
      } else {
        setErro(err.response?.data?.msg || "Não foi possível carregar os administradores.");
      }
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // admin.id é numérico — comparar com String() evita o erro que a mesma
  // busca dá em /admin/admins quando tenta chamar .includes() num número.
  const filtrados = admins.filter((a) => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return true;
    const digitos = termo.replace(/\D/g, "");
    return (
      a.nome?.toLowerCase().includes(termo) ||
      String(a.id).includes(termo) ||
      (digitos && String(a.cpf || "").replace(/\D/g, "").includes(digitos))
    );
  });

  async function criar(e) {
    e.preventDefault();
    setErroForm(null);

    if (!formNovo.nome.trim()) return setErroForm("Informe o nome.");
    if (formNovo.cpf.replace(/\D/g, "").length !== 11) return setErroForm("CPF deve ter 11 dígitos.");
    if (formNovo.password.length < 6) return setErroForm("A senha deve ter pelo menos 6 caracteres.");

    setSalvando(true);
    try {
      await api.post("/admin/createadmin", {
        nome: formNovo.nome,
        cpf: formNovo.cpf,
        password: formNovo.password,
      });
      setModalNovo(false);
      setFormNovo(FORM_VAZIO);
      await carregar();
    } catch (err) {
      setErroForm(err.response?.data?.msg || "Não foi possível criar o administrador.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    setExcluindo(true);
    try {
      await api.delete(`/admin/deleteadmin/${confirmarExclusao.id}`);
      setConfirmarExclusao(null);
      await carregar();
    } catch (err) {
      setErro(err.response?.data?.msg || "Não foi possível excluir.");
      setConfirmarExclusao(null);
    } finally {
      setExcluindo(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-xl text-gray-600">A carregar administradores...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 relative">
      <div className="max-w-7xl mx-auto">
        {/* CABEÇALHO E BARRA DE PESQUISA */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão de Administradores</h1>
            <p className="text-gray-500 text-sm mt-1">Total de administradores: {admins.length}</p>
          </div>

          <div className="w-full md:w-1/2 relative">
            <Search size={18} className="text-gray-400 absolute right-3 top-3.5" />
            <input
              type="text"
              placeholder="Pesquisar por nome, identificador ou CPF..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition shadow-sm"
            />
          </div>

          <button
            onClick={() => {
              setErroForm(null);
              setFormNovo(FORM_VAZIO);
              setModalNovo(true);
            }}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-red-700 text-white font-medium rounded-lg hover:bg-red-800 transition shadow-sm whitespace-nowrap"
          >
            <Plus size={18} />
            Novo Administrador
          </button>
        </div>

        {erro && (
          <div className="mb-6 p-4 rounded-lg shadow-sm text-center font-medium bg-red-100 text-red-800 border border-red-200">
            {erro}
          </div>
        )}

        {/* VISÃO MOBILE (CARDS) */}
        <div className="grid grid-cols-1 gap-4 lg:hidden">
          {filtrados.length > 0 ? (
            filtrados.map((admin) => (
              <div
                key={admin.id}
                className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 relative"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{admin.nome.toUpperCase()}</h3>
                    <p className="text-sm text-gray-500">Identificador: {admin.id}</p>
                  </div>
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full uppercase">
                    {admin.role}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-semibold">CPF:</span> {admin.cpf}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-semibold">Atualizado:</span>{" "}
                  {admin.updated_at
                    ? `às ${new Date(admin.updated_at).toLocaleTimeString("pt-BR")} de ${new Date(admin.updated_at).toLocaleDateString("pt-BR")}`
                    : "Data não disponível"}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-semibold">Criado:</span>{" "}
                  {admin.created_at
                    ? `às ${new Date(admin.created_at).toLocaleTimeString("pt-BR")} de ${new Date(admin.created_at).toLocaleDateString("pt-BR")}`
                    : "Data não disponível"}
                </p>

                <div className="grid grid-cols-3 gap-2 mt-4">
                  <button
                    onClick={() => navigate("/master/view-admin", { state: { admin } })}
                    className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition text-center"
                  >
                    Ver
                  </button>
                  <button
                    onClick={() => navigate("/master/edit-admin", { state: { admin } })}
                    className="w-full py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 text-sm font-medium transition text-center"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setConfirmarExclusao(admin)}
                    className="w-full py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium transition text-center"
                  >
                    Deletar
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8 bg-white rounded-lg border border-gray-200">
              Nenhum administrador encontrado{busca ? ` com "${busca}"` : ""}.
            </p>
          )}
        </div>

        {/* VISÃO DESKTOP/TABLET (TABELA) */}
        <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="bg-gray-100 text-gray-600 text-sm uppercase tracking-wider">
                  <th className="p-4 border-b font-semibold">Nome</th>
                  <th className="p-4 border-b font-semibold">Identificador</th>
                  <th className="p-4 border-b font-semibold">CPF</th>
                  <th className="p-4 border-b font-semibold">Perfil</th>
                  <th className="p-4 border-b font-semibold text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtrados.length > 0 ? (
                  filtrados.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 text-gray-900 font-medium">{admin.nome}</td>
                      <td className="p-4 text-gray-700">{admin.id}</td>
                      <td className="p-4 text-gray-700 font-mono">{admin.cpf}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full uppercase">
                          {admin.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2 flex-nowrap">
                          <button
                            onClick={() => navigate("/master/view-admin", { state: { admin } })}
                            className="min-w-[70px] px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium transition text-center"
                          >
                            Ver
                          </button>
                          <button
                            onClick={() => navigate("/master/edit-admin", { state: { admin } })}
                            className="min-w-[70px] px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 text-sm font-medium transition text-center"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => setConfirmarExclusao(admin)}
                            className="min-w-[70px] px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm font-medium transition text-center"
                          >
                            Deletar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">
                      Nenhum administrador encontrado{busca ? ` com a pesquisa "${busca}"` : ""}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ---------- MODAL NOVO ADMINISTRADOR ---------- */}
      {modalNovo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalNovo(false)} />
          <form
            onSubmit={criar}
            className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-5 shadow-xl"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800">Novo administrador</h3>
              <button
                type="button"
                onClick={() => setModalNovo(false)}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X size={20} />
              </button>
            </div>

            {erroForm && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                {erroForm}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nome</label>
                <input
                  value={formNovo.nome}
                  onChange={(e) => setFormNovo((f) => ({ ...f, nome: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">CPF</label>
                <input
                  value={formNovo.cpf}
                  onChange={(e) => setFormNovo((f) => ({ ...f, cpf: mascararCpf(e.target.value) }))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Senha inicial</label>
                <input
                  type="password"
                  value={formNovo.password}
                  onChange={(e) => setFormNovo((f) => ({ ...f, password: e.target.value }))}
                  placeholder="mínimo 6 caracteres"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-5">
              <button
                type="button"
                onClick={() => setModalNovo(false)}
                disabled={salvando}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition"
              >
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ---------- MODAL CONFIRMAÇÃO DE EXCLUSÃO ---------- */}
      {confirmarExclusao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 text-center">
              <AlertTriangle className="mx-auto mb-4 text-red-600" size={48} strokeWidth={1.5} />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Excluir Administrador?</h3>
              <p className="text-gray-500 mb-6">
                Tem certeza que deseja excluir permanentemente o administrador{" "}
                <span className="font-bold text-gray-800">{confirmarExclusao.nome}</span>? Esta
                ação não pode ser desfeita.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setConfirmarExclusao(null)}
                  disabled={excluindo}
                  className="w-full px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={excluir}
                  disabled={excluindo}
                  className="w-full px-5 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  {excluindo ? "Excluindo..." : "Sim, Excluir"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
