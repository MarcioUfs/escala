import React from "react";
import { Calendar as CalendarIcon, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const EscalaEdit = () => {
  const navigate = useNavigate();
  const dataInicio = new Date(2026, 1, 25); // 25/02/2026 (Mês é 0-indexed)
  const dataFim = new Date(2026, 2, 27); // 27/03/2026

  // Gerar array de dias entre o início e o fim
  const dias = [];
  let dataAux = new Date(dataInicio);
  while (dataAux <= dataFim) {
    dias.push(new Date(dataAux));
    dataAux.setDate(dataAux.getDate() + 1);
  }
  const calcularGruposDoDia = (dataInicio, dataAtual) => {
    const grupos = ["A", "B", "C", "D", "E", "F"];

    // Calcula a diferença de dias entre o início e o dia atual
    const diffTempo = Math.abs(dataAtual - dataInicio);
    const diffDias = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));

    // A cada dia, o ponto de partida avança 3 posições no array (usando módulo 6)
    const p1 = (diffDias * 3) % 6;
    const p2 = (p1 + 1) % 6;
    const p3 = (p1 + 2) % 6;

    return [grupos[p1], grupos[p2], grupos[p3]];
  };
  return (
    <div>
      <div className="mb-6 mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Título e Datas */}
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
          <CalendarIcon className="text-blue-600 flex-shrink-0" />
          <span className="flex flex-wrap items-baseline gap-2">
            E-Escala
            <span className="text-slate-400 font-light text-sm md:text-lg">
              {dataInicio.toLocaleDateString("pt-BR")} a{" "}
              {dataFim.toLocaleDateString("pt-BR")}
            </span>
          </span>
        </h1>

        {/* Botão de Voltar */}
        <button
          onClick={() => navigate("/admin")}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-800 text-white text-sm font-medium rounded-md hover:bg-green-900 transition shadow-sm whitespace-nowrap self-start md:self-auto"
        >
          <ArrowLeft size={18} />
          Voltar a gestão
        </button>
      </div>
      <div className="overflow-x-auto ">
        <table className="min-w-full border-collapse border border-slate-400 bg-white shadow-sm">
          <thead>
            <tr className="bg-slate-100">
              {dias.map((dia, idx) => (
                <th
                  key={idx}
                  className="border border-slate-300 text-sm font-bold"
                >
                  <div className="flex flex-col items-center">
                    {dia.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            
            {[0, 1, 2].map((linhaIdx) => (
              <tr key={linhaIdx}>
                {dias.map((dia, colIdx) => {
                  const grupos = calcularGruposDoDia(dataInicio, dia);
                  return (
                    <td
                      key={colIdx}
                      className="border border-slate-300 text-center font-medium"
                    >
                      <span className="inline-block">{grupos[linhaIdx]}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EscalaEdit;

// import React from 'react';
// import { Calendar as CalendarIcon } from 'lucide-react';

// const EscalaCalendario = () => {
//   const dataInicio = new Date(2026, 1, 25); // 25/02/2026 (Mês é 0-indexed)
//   const dataFim = new Date(2026, 2, 27);    // 27/03/2026

//   // Gerar array de dias entre o início e o fim
//   const dias = [];
//   let dataAux = new Date(dataInicio);
//   while (dataAux <= dataFim) {
//     dias.push(new Date(dataAux));
//     dataAux.setDate(dataAux.getDate() + 1);
//   }

//   return (
//     <div className="overflow-x-auto p-4">
//       <table className="min-w-full border-collapse border border-slate-400 bg-white shadow-sm">
//         <thead>
//           <tr className="bg-slate-100">
//             {dias.map((dia, idx) => (
//               <th key={idx} className="border border-slate-300 p-2 text-sm font-bold min-w-[100px]">
//                 <div className="flex flex-col items-center">
//                   <CalendarIcon size={14} className="mb-1 text-blue-600" />
//                   {dia.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
//                 </div>
//               </th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           {[0, 1, 2].map((linhaIdx) => (
//             <tr key={linhaIdx}>
//               {dias.map((dia, colIdx) => {
//                 const grupos = calcularGruposDoDia(dataInicio, dia);
//                 return (
//                   <td key={colIdx} className="border border-slate-300 p-3 text-center font-medium">
//                     <span className="inline-block px-3 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
//                       Grupo {grupos[linhaIdx]}
//                     </span>
//                   </td>
//                 );
//               })}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default EscalaCalendario;
