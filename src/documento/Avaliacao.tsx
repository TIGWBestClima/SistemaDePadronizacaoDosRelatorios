import type {Projeto} from '../relatorios/qualidade/modelo';
import {criterios,notas} from '../relatorios/qualidade/modelo';
import atendimento from '../identidade/avaliacao/atendimento.png?inline';
import prazo from '../identidade/avaliacao/prazo.png?inline';
import seguranca from '../identidade/avaliacao/seguranca.png?inline';
import qualidade from '../identidade/avaliacao/qualidade.png?inline';
import limpeza from '../identidade/avaliacao/limpeza.png?inline';
import desperdicio from '../identidade/avaliacao/desperdicio.png?inline';
import ruim from '../identidade/avaliacao/ruim.png?inline';
import regular from '../identidade/avaliacao/regular.png?inline';
import bom from '../identidade/avaliacao/bom.png?inline';
import otimo from '../identidade/avaliacao/otimo.png?inline';
const icones:Record<typeof criterios[number],string>={Atendimento:atendimento,Prazo:prazo,Segurança:seguranca,Qualidade:qualidade,Limpeza:limpeza,Desperdício:desperdicio};
const carinhas:Record<typeof notas[number],string|null>={'Não avaliado':null,Ruim:ruim,Regular:regular,Bom:bom,'Ótimo':otimo};
function Opiniao({nota}:{nota:typeof notas[number]}){
  const src=carinhas[nota];
  return <div className="opinion" data-rating={nota}>{src?<img className="rating-face" src={src} alt={nota}/>:<span className="rating-empty" aria-label="Sem avaliação">—</span>}<span className="rating-label">{nota}</span></div>;
}
export function Avaliacao({avaliacao}:{avaliacao:Projeto['avaliacao']}){
  return <section className="block assessment" data-break="true"><h2>AVALIAÇÃO</h2>
    <table className="assessment-table"><thead><tr><th scope="col" className="assessment-axis">QUESITOS</th>{criterios.map(criterio=><th key={criterio} scope="col"><img className="criterion-icon" src={icones[criterio]} alt={`Ícone de ${criterio}`}/><span className="criterion-label">{criterio}</span></th>)}</tr></thead>
      <tbody><tr><th scope="row" className="assessment-axis">AVALIAÇÃO</th>{criterios.map(criterio=><td key={criterio} data-criterion={criterio}><Opiniao nota={avaliacao[criterio]||'Não avaliado'}/></td>)}</tr></tbody>
    </table>
    <div className="assessment-legend"><h3>LEGENDA</h3><div className="rating-scale">{(['Ruim','Regular','Bom','Ótimo','Não avaliado'] as const).map(nota=><Opiniao key={nota} nota={nota}/>)}</div></div>
  </section>;
}
