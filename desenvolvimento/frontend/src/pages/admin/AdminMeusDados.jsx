import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import api from "../../services/api";

const CAMPOS_SENHA = ["oldPassword", "newPassword", "confirmNewPassword"];
const SENHA_MINIMA = 6;
const SENHA_MAXIMA = 72;

function formatarDataHora(iso) {
  if (!iso) return "—";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "—";
  return data.toLocaleString("pt-BR", { timeZone: "America/Maceio" });
}

function validarSenha(campo, valores) {
  switch (campo) {
    case "oldPassword":
      return valores.oldPassword ? null : "Informe a senha atual.";
    case "newPassword":
      if (!valores.newPassword) return "Informe a nova senha.";
      if (valores.newPassword.length < SENHA_MINIMA) {
        const falta = SENHA_MINIMA - valores.newPassword.length;
        return `Nova senha muito curta: faltam ${falta} caractere${falta === 1 ? "" : "s"} (mínimo ${SENHA_MINIMA}).`;
      }
      if (valores.newPassword.length > SENHA_MAXIMA) return `A nova senha pode ter no máximo ${SENHA_MAXIMA} caracteres.`;
      if (valores.oldPassword && valores.newPassword === valores.oldPassword) {
        return "A nova senha deve ser diferente da senha atual.";
      }
      return null;
    case "confirmNewPassword":
      if (!valores.confirmNewPassword) return "Confirme a nova senha.";
      if (valores.confirmNewPassword !== valores.newPassword) return "A confirmação não coincide com a nova senha.";
      return null;
    default:
      return null;
  }
}

function CampoSenha({ id, label, valor, erro, mostrar, onAlternar, onChange, onBlur, autoComplete, placeholder }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={mostrar ? "text" : "password"}
          value={valor}
          onChange={onChange}
          onBlur={onBlur}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={!!erro}
          className={`mt-1 block w-full pl-3 pr-10 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
            erro ? "border-red-500 bg-red-50" : "border-gray-300"
          }`}
        />
        <button
          type="button"
          onClick={onAlternar}
          aria-label={mostrar ? "Ocultar senha" : "Mostrar senha"}
          className="absolute right-2 top-1/2 -translate-y-1/2 mt-0.5 p-1 text-gray-400 hover:text-gray-700 transition"
        >
          {mostrar ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {erro && (
        <p role="alert" className="mt-1 text-xs text-red-600">
          {erro}
        </p>
      )}
    </div>
  );
}

export default function AdminMeusDados() {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);
  const [erroDados, setErroDados] = useState(null);

  const [valores, setValores] = useState({ oldPassword: "", newPassword: "", confirmNewPassword: "" });
  const [tocados, setTocados] = useState({});
  const [tentouEnviar, setTentouEnviar] = useState(false);
  const [mostrar, setMostrar] = useState({});
  const [status, setStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    let cancelado = false;
    api
      .get("/admin/getadmin")
      .then(({ data }) => {
        if (!cancelado) setAdmin(data);
      })
      .catch((err) => {
        if (!cancelado) setErroDados(err.response?.data?.msg || "Não foi possível carregar seus dados.");
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const erros = useMemo(
    () => Object.fromEntries(CAMPOS_SENHA.map((c) => [c, validarSenha(c, valores)])),
    [valores],
  );
  const erroVisivel = (campo) => (tocados[campo] || tentouEnviar ? erros[campo] : null);

  const aoAlterar = (e) => {
    const { name, value } = e.target;
    setValores((v) => ({ ...v, [name]: value }));
    if (status.type === "success" || status.type === "error") setStatus({ type: "", message: "" });
  };

  const aoEnviar = async (e) => {
    e.preventDefault();
    setTentouEnviar(true);

    const primeiroInvalido = CAMPOS_SENHA.find((c) => erros[c]);
    if (primeiroInvalido) {
      setStatus({ type: "error", message: "Corrija os campos destacados em vermelho." });
      document.querySelector(`[name="${primeiroInvalido}"]`)?.focus();
      return;
    }

    setStatus({ type: "loading", message: "Atualizando senha..." });
    try {
      await api.put("/admin/updatePassword", valores);
      setStatus({ type: "success", message: "Senha atualizada com sucesso!" });
      setValores({ oldPassword: "", newPassword: "", confirmNewPassword: "" });
      setTocados({});
      setTentouEnviar(false);
      setMostrar({});
    } catch (err) {
      setStatus({
        type: "error",
        message: err.response?.data?.msg || "Erro interno do servidor. Tente novamente mais tarde.",
      });
    }
  };

  return (
    <div className="relative">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm">
        <div className="px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">Meus dados</h1>
            <p className="text-xs text-slate-500 font-mono">Seus dados de acesso e alteração de senha</p>
          </div>
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 px-4 py-2 bg-green-800 text-white text-sm font-medium rounded-lg hover:bg-green-900 transition shadow-sm"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>
        </div>
      </header>

      <div className="p-4 sm:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* ---------- DADOS DO ADMINISTRADOR ---------- */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-gray-800 mb-4">
              <ShieldCheck size={18} className="text-blue-700" />
              Dados do administrador
            </h2>

            {erroDados && (
              <p className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{erroDados}</p>
            )}
            {!admin && !erroDados && <p className="text-sm text-gray-400">Carregando...</p>}

            {admin && (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div>
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome</dt>
                  <dd className="mt-0.5 text-gray-900 font-medium">{admin.nome}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">CPF</dt>
                  <dd className="mt-0.5 text-gray-900 font-mono">{admin.cpf}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Perfil</dt>
                  <dd className="mt-0.5 text-gray-900 capitalize">{admin.role}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Identificador</dt>
                  <dd className="mt-0.5 text-gray-900 font-mono">{admin.id}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cadastrado em</dt>
                  <dd className="mt-0.5 text-gray-900">{formatarDataHora(admin.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Última atualização</dt>
                  <dd className="mt-0.5 text-gray-900">{formatarDataHora(admin.updated_at)}</dd>
                </div>
              </dl>
            )}
          </section>

          {/* ---------- ALTERAR SENHA ---------- */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 border-t-4 border-t-yellow-500 p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-gray-800 mb-1">
              <KeyRound size={18} className="text-yellow-600" />
              Alterar senha
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              A nova senha deve ter de {SENHA_MINIMA} a {SENHA_MAXIMA} caracteres e ser diferente da atual.
            </p>

            {status.message && (
              <div
                role={status.type === "error" ? "alert" : "status"}
                className={`mb-4 p-3 rounded text-sm text-center font-medium ${
                  status.type === "success"
                    ? "bg-green-100 text-green-700"
                    : status.type === "error"
                      ? "bg-red-100 text-red-700"
                      : "bg-blue-100 text-blue-700"
                }`}
              >
                {status.message}
              </div>
            )}

            <form onSubmit={aoEnviar} noValidate className="space-y-4">
              <CampoSenha
                id="oldPassword"
                label="Senha atual"
                valor={valores.oldPassword}
                erro={erroVisivel("oldPassword")}
                mostrar={!!mostrar.oldPassword}
                onAlternar={() => setMostrar((m) => ({ ...m, oldPassword: !m.oldPassword }))}
                onChange={aoAlterar}
                onBlur={() => setTocados((t) => ({ ...t, oldPassword: true }))}
                autoComplete="current-password"
                placeholder="Digite a senha atual"
              />
              <CampoSenha
                id="newPassword"
                label="Nova senha"
                valor={valores.newPassword}
                erro={erroVisivel("newPassword")}
                mostrar={!!mostrar.newPassword}
                onAlternar={() => setMostrar((m) => ({ ...m, newPassword: !m.newPassword }))}
                onChange={aoAlterar}
                onBlur={() => setTocados((t) => ({ ...t, newPassword: true }))}
                autoComplete="new-password"
                placeholder="Digite a nova senha"
              />
              <CampoSenha
                id="confirmNewPassword"
                label="Confirmar nova senha"
                valor={valores.confirmNewPassword}
                erro={erroVisivel("confirmNewPassword")}
                mostrar={!!mostrar.confirmNewPassword}
                onAlternar={() => setMostrar((m) => ({ ...m, confirmNewPassword: !m.confirmNewPassword }))}
                onChange={aoAlterar}
                onBlur={() => setTocados((t) => ({ ...t, confirmNewPassword: true }))}
                autoComplete="new-password"
                placeholder="Repita a nova senha"
              />

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate("/admin")}
                  className="w-full sm:w-1/3 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={status.type === "loading"}
                  className="w-full sm:w-2/3 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 transition disabled:opacity-50"
                >
                  {status.type === "loading" ? "Atualizando..." : "Salvar nova senha"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
