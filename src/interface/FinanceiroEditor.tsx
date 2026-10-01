import {useEffect,useMemo,useRef,useState} from 'react';
import {Field} from './Campos';
import {escolherArquivo} from './arquivos';
import {calcular,camposValor,moeda,novoPeriodo,type CampoValor,type Mapeamento,type Origem,type Periodo,type ProjetoFinanceiro} from '../relatorios/financeiro/modelo';
import type {Pasta} from '../projeto/leitorPlanilha';
import {endereco,letra,posicao} from '../projeto/celulas';
import {avaliar,inserirReferencia,referencias} from '../projeto/formula';
type Props={project:ProjetoFinanceiro;tab:string;edit:(p:ProjetoFinanceiro)=>void;error:(s:string)=>void;confirmar:(s:string)=>Promise<boolean>};
const meses=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const semAcento=(s:string)=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
// Sugere o nome do período a partir do nome do arquivo (ex.: "PLANEJAMENTO JULHO_2026" → "Julho/2026").
function periodoDoArquivo(nome:string){const n=semAcento(nome);const i=meses.findIndex(m=>n.includes(semAcento(m).slice(0,3)));const ano=n.match(/20\d{2}/)?.[0];return i<0?'':meses[i][0].toUpperCase()+meses[i].slice(1)+(ano?'/'+ano:'');}
function Valor({label,value,change,opcional=false}:{label:string;value:number|null;change:(v:number|null)=>void;opcional?:boolean}){
 const [texto,setTexto]=useState(value===null?'':String(value));
 useEffect(()=>{setTexto(t=>(t===''?null:Number(t))===value?t:value===null?'':String(value));},[value]);
 return <label className="field"><span>{label}</span><input aria-label={label} type="number" step="0.01" inputMode="decimal" value={texto} placeholder={opcional?'Não informado':'0,00'} onChange={e=>{setTexto(e.target.value);const n=e.target.value===''?null:Number(e.target.value);if(n===null)change(opcional?null:0);else if(Number.isFinite(n)&&Math.abs(n)<=1e13)change(n);}}/></label>;
}
type Modal={pasta:Pasta;nome:string;periodo?:string};
export function FinanceiroEditor({project,tab,edit,error,confirmar}:Props){
 const [selected,setSelected]=useState(''),[modal,setModal]=useState<Modal|null>(null),[lendo,setLendo]=useState(false);
 // Planilhas já lidas nesta sessão, para reabrir a seleção sem escolher o arquivo de novo.
 const pastas=useRef(new Map<string,Pasta>()),reabrir=useRef<string|undefined>(undefined);
 const input=useRef<HTMLInputElement>(null);
 const item=project.itens.find(i=>i.id===selected)||project.itens[0];
 const update=(patch:Partial<Periodo>)=>edit({...project,itens:project.itens.map(i=>i.id===item?.id?{...i,...patch}:i)});
 const g=project.gerais,geral=(key:keyof ProjetoFinanceiro['gerais'])=>(value:string)=>edit({...project,gerais:{...g,[key]:value}});
 if(tab==='gerais')return <><div className="hint">A capa utiliza o símbolo da Best Clima. A empresa aparece como título da contracapa.</div><div className="fields">
  <Field field={{key:'empresa',label:'Empresa'}} value={g.empresa} change={geral('empresa')}/><Field field={{key:'unidade',label:'Unidade / área (opcional)'}} value={g.unidade} change={geral('unidade')}/>
  <Field field={{key:'tipoRelatorio',label:'Tipo de relatório'}} value={g.tipoRelatorio} change={geral('tipoRelatorio')}/><Field field={{key:'responsavel',label:'Responsável'}} value={g.responsavel} change={geral('responsavel')}/>
  <Field field={{key:'data',label:'Data de emissão',type:'date'}} value={g.data} change={geral('data')}/></div></>;
 if(tab==='final')return <><Field field={{key:'observacoes',label:'Análise e observações',type:'textarea'}} value={project.observacoes} change={observacoes=>edit({...project,observacoes})}/><div className="hint">A análise aparece na última página. Deixe vazio para omiti-la.</div></>;
 async function abrir(file:File|null,periodo?:string){
  if(!file)return;
  if(!/\.xlsx$/i.test(file.name)){error('Selecione um arquivo Excel .xlsx.');return;}
  setLendo(true);
  try{const {abrirPasta}=await import('../projeto/leitorPlanilha');const pasta=await abrirPasta(await file.arrayBuffer());pastas.current.set(file.name,pasta);setModal({pasta,nome:file.name,periodo});}
  catch(e){error(e instanceof Error?e.message:'Não foi possível ler a planilha.');}finally{setLendo(false);}
 }
 async function escolher(periodo?:string){reabrir.current=periodo;if(window.desktop){try{await abrir(await escolherArquivo('spreadsheet'),periodo);}catch(e){error(e instanceof Error?e.message:'Não foi possível abrir o arquivo.');}}else input.current?.click();}
 function editarCelulas(p:Periodo){const pasta=pastas.current.get(p.origem);if(pasta)setModal({pasta,nome:p.origem,periodo:p.id});else{error(`Selecione novamente a planilha${p.origem?` “${p.origem}”`:''} para editar as células deste período.`);void escolher(p.id);}}
 const c=item&&calcular(item),editando=modal?.periodo?project.itens.find(i=>i.id===modal.periodo):undefined;
 return <><div className="item-tools"><strong>{project.itens.length} período(s)</strong><button className="primary" disabled={lendo} onClick={()=>escolher()}>{lendo?'Lendo planilha…':'⇪ Importar de planilha'}</button></div>
  <input ref={input} hidden type="file" accept=".xlsx" onChange={async e=>{const file=e.target.files?.[0]??null;e.target.value='';await abrir(file,reabrir.current);}}/>
  <div className="hint fin-hint">Selecione a planilha e clique na célula de cada valor, ou escreva uma fórmula como =C3+C5. As escolhas ficam salvas no projeto para a próxima importação. Também é possível <button type="button" className="text-button inline" onClick={()=>{if(project.itens.length>=60)return error('O relatório pode ter até 60 períodos.');const p=novoPeriodo();edit({...project,itens:[...project.itens,p]});setSelected(p.id);}}>adicionar um período manualmente</button>.</div>
  {item&&c?<><label className="field"><span>Período em edição</span><select value={item.id} onChange={e=>setSelected(e.target.value)}>{project.itens.map((i,n)=><option key={i.id} value={i.id}>{n+1} · {i.nome||'Período sem nome'}</option>)}</select></label>
   <Field field={{key:'nome',label:'Nome do período'}} value={item.nome} change={nome=>update({nome})}/>
   <button type="button" className="edit-cells" disabled={lendo} onClick={()=>editarCelulas(item)}>✎ Editar células da planilha</button>
   <div className="fields">{camposValor.map(f=><Valor key={f.key+item.id} label={f.label} opcional={!f.obrigatorio} value={item[f.key]} change={v=>update({[f.key]:v} as Partial<Periodo>)}/>)}</div>
   <dl className="fin-calculo"><div><dt>Receita de manutenção</dt><dd>{moeda(c.receitaManutencao)}</dd></div><div><dt>Despesa total</dt><dd>{moeda(c.despesaTotal)}</dd></div><div><dt>Resultado da manutenção</dt><dd>{moeda(c.resultadoManutencao)}</dd></div><div className="destaque"><dt>Receita de obras para zerar</dt><dd>{moeda(c.obrasNecessaria)}</dd></div></dl>
   {item.origem&&<p className="table-help">Origem: {item.origem}{Object.keys(item.celulas).length>0&&' · '+camposValor.filter(f=>item.celulas[f.key]).map(f=>`${f.label.replace(' (opcional)','')}: =${item.celulas[f.key].formula}`).join(' · ')}</p>}
   <div className="record-actions"><button onClick={()=>move(-1)} disabled={project.itens[0].id===item.id}>↑ Mover para cima</button><button onClick={()=>move(1)} disabled={project.itens.at(-1)!.id===item.id}>↓ Mover para baixo</button></div>
   <button className="danger" onClick={async()=>{if(await confirmar('Remover este período?'))edit({...project,itens:project.itens.filter(i=>i.id!==item.id)});}}>Remover período</button></>
  :<div className="empty">Importe uma planilha para criar o primeiro período.</div>}
  {modal&&<SeletorCelulas key={modal.nome+(modal.periodo??'')} pasta={modal.pasta} arquivo={modal.nome} mapeamento={editando?.celulas??project.mapeamento} periodo={editando} fechar={()=>setModal(null)} confirmar={(periodo,mapeamento)=>{
   if(editando){edit({...project,itens:project.itens.map(i=>i.id===editando.id?periodo:i),mapeamento:mapeamento??project.mapeamento});setModal(null);error(`Período “${periodo.nome}” atualizado.`);return;}
   if(project.itens.length>=60){error('O relatório pode ter até 60 períodos.');return;}
   edit({...project,itens:[...project.itens,periodo],mapeamento:mapeamento??project.mapeamento});setSelected(periodo.id);setModal(null);error(`Período “${periodo.nome}” importado de ${modal.nome}.`);}}/>}</>;
 function move(delta:number){const itens=[...project.itens],from=itens.findIndex(i=>i.id===item.id),to=from+delta;if(to<0||to>=itens.length)return;[itens[from],itens[to]]=[itens[to],itens[from]];edit({...project,itens});}
}
const LINHAS=30,COLUNAS=12;
const siglas:Record<CampoValor,string>={receitaPreventiva:'Preventiva',receitaCorretivaVm:'Rec. corretiva',despesaSemCorretiva:'Desp. s/ corretiva',despesaCorretivaVm:'Desp. corretiva',receitaObrasRealizada:'Obras'};
// Modal com a planilha em grade: o usuário escolhe o campo à esquerda e clica na célula (ou escreve uma fórmula).
// Com `periodo`, edita as escolhas de um período já importado.
function SeletorCelulas({pasta,arquivo,mapeamento,periodo,fechar,confirmar}:{pasta:Pasta;arquivo:string;mapeamento:Mapeamento;periodo?:Periodo;fechar:()=>void;confirmar:(p:Periodo,m:Mapeamento|null)=>void}){
 const dialog=useRef<HTMLDialogElement>(null),entradas=useRef<Partial<Record<CampoValor,HTMLInputElement|null>>>({});
 const visiveis=pasta.abas.filter(a=>!a.oculta),nomesAbas=useMemo(()=>pasta.abas.map(a=>a.nome),[pasta]);
 const [origens,setOrigens]=useState<Partial<Record<CampoValor,Origem>>>(()=>Object.fromEntries(camposValor.filter(f=>mapeamento[f.key]).map(f=>[f.key,mapeamento[f.key]])));
 const avaliado=(o?:Origem)=>o&&o.formula.trim()?avaliar(o.formula,o.aba,pasta.ler,nomesAbas):undefined;
 const [ativo,setAtivo]=useState<CampoValor>(camposValor.find(f=>!mapeamento[f.key])?.key??camposValor[0].key);
 const [aba,setAba]=useState(Object.values(origens).find(o=>o&&nomesAbas.includes(o.aba))?.aba??(visiveis[0]??pasta.abas[0]).nome),[topo,setTopo]=useState(1),[esq,setEsq]=useState(1);
 const [nome,setNome]=useState(periodo?.nome??periodoDoArquivo(arquivo)),[lembrar,setLembrar]=useState(true),[mensagem,setMensagem]=useState(''),[foco,setFoco]=useState(''),[termo,setTermo]=useState(''),[achados,setAchados]=useState<{linha:number;coluna:number}[]>([]),[achado,setAchado]=useState(0),[buscado,setBuscado]=useState(''),[ir,setIr]=useState('');
 useEffect(()=>{const d=dialog.current!;d.showModal();return()=>d.close();},[]);
 const info=pasta.abas.find(a=>a.nome===aba)!;
 const mostrar=(linha:number,coluna:number)=>{setTopo(Math.max(1,linha-5));setEsq(Math.max(1,coluna-2));setFoco(endereco(linha,coluna));};
 const definir=(campo:CampoValor,o:Origem|undefined)=>setOrigens(x=>({...x,[campo]:o}));
 function escolher(linha:number,coluna:number){
  const ref=endereco(linha,coluna);setFoco(ref);setMensagem('');
  const atual=origens[ativo],r=inserirReferencia(atual?.formula??'',atual?.aba??aba,aba,linha,coluna);
  const novo:Origem=r.acrescentou?{aba:atual!.aba,formula:r.formula}:{aba,formula:r.formula};
  definir(ativo,novo);
  const v=avaliado(novo);
  if(v&&'erro' in v){setMensagem(`${ref}: ${v.erro}`);return;}
  // Acrescentando a uma fórmula, o usuário continua no mesmo campo; escolhendo uma célula, segue para o próximo vazio.
  if(r.acrescentou){entradas.current[ativo]?.focus();return;}
  const proximo=camposValor.find(f=>f.key!==ativo&&!origens[f.key]);if(proximo)setAtivo(proximo.key);
 }
 const marcadas=new Map<string,CampoValor>();
 for(const f of camposValor){const o=origens[f.key];if(o)for(const ref of referencias(o.formula,o.aba).slice(0,400))if(ref.aba===aba&&!marcadas.has(endereco(ref.linha,ref.coluna)))marcadas.set(endereco(ref.linha,ref.coluna),f.key);}
 const resultados=Object.fromEntries(camposValor.map(f=>[f.key,avaliado(origens[f.key])])) as Partial<Record<CampoValor,ReturnType<typeof avaliar>>>;
 // Na edição, um campo sem fórmula mantém o valor atual do período; numa importação nova, os obrigatórios precisam de fórmula válida.
 const valido=(f:typeof camposValor[number])=>{const r=resultados[f.key];return r?'valor' in r:!f.obrigatorio||!!periodo;};
 const prontos=camposValor.every(valido);
 function concluir(){
  const base=periodo??novoPeriodo();const p:Periodo={...base,nome:nome.trim(),origem:arquivo.slice(0,400),celulas:{}};
  for(const f of camposValor){const r=resultados[f.key],o=origens[f.key];if(r&&'valor' in r&&o){p[f.key]=r.valor;p.celulas[f.key]={aba:o.aba,formula:o.formula.trim().replace(/^=/,'')};}else if(!periodo){if(f.key==='receitaObrasRealizada')p.receitaObrasRealizada=null;else p[f.key]=0;}}
  confirmar(p,lembrar?p.celulas:null);
 }
 return <dialog ref={dialog} className="map-dialog sheet-dialog" aria-labelledby="sheet-title" onCancel={e=>{e.preventDefault();fechar();}}>
  <div className="map-dialog-head"><div><small>{periodo?'EDITAR CÉLULAS DO PERÍODO':'IMPORTAR DE PLANILHA'}</small><h2 id="sheet-title">{arquivo}</h2></div><div className="actions"><button type="button" onClick={fechar}>Cancelar</button><button type="button" className="primary" disabled={!prontos||!nome.trim()} onClick={concluir}>{periodo?'Salvar alterações':'Adicionar período'}</button></div></div>
  <div className="sheet-layout">
   <aside className="sheet-fields">
    <label className="field"><span>Nome do período</span><input aria-label="Nome do período" maxLength={140} value={nome} placeholder="Ex.: Julho/2026" onChange={e=>setNome(e.target.value)}/></label>
    <p className="table-help">Escolha um campo e clique na célula. Para somar ou subtrair, escreva um operador (+ − * /) no fim da fórmula e clique na próxima célula.</p>
    <ul>{camposValor.map(f=>{const o=origens[f.key],r=resultados[f.key];return <li key={f.key} className={'sheet-field'+(ativo===f.key?' active':'')+(r&&'valor' in r?' done':'')+(r&&'erro' in r?' invalid':'')} onClick={()=>setAtivo(f.key)}>
     <button type="button" className="sheet-field-name" aria-pressed={ativo===f.key} onClick={()=>{setAtivo(f.key);const p=o&&referencias(o.formula,o.aba)[0];if(p){if(p.aba!==aba)setAba(p.aba);mostrar(p.linha,p.coluna);}}}>{f.label}{f.obrigatorio&&<i aria-hidden="true"> *</i>}</button>
     <div className="formula"><span aria-hidden="true">=</span><input ref={el=>{entradas.current[f.key]=el;}} aria-label={'Fórmula de '+f.label} value={o?.formula??''} maxLength={1000} placeholder={periodo?'Mantém o valor atual':'Clique numa célula'} spellCheck={false} onFocus={()=>setAtivo(f.key)} onChange={e=>{const formula=e.target.value.replace(/^=/,'');definir(f.key,formula?{aba:o?.aba??aba,formula}:undefined);}}/>{o&&<button type="button" className="text-button" aria-label={'Limpar '+f.label} onClick={()=>definir(f.key,undefined)}>×</button>}</div>
     <small className="formula-result">{r?'valor' in r?<>{moeda(r.valor)}{o&&o.aba!==aba&&` · aba ${o.aba}`}</>:r.erro:periodo?`Valor atual: ${f.key==='receitaObrasRealizada'&&periodo.receitaObrasRealizada===null?'não informado':moeda(periodo[f.key]??0)}`:''}</small>
    </li>;})}</ul>
    <label className="check"><input type="checkbox" checked={lembrar} onChange={e=>setLembrar(e.target.checked)}/> Lembrar estas células para a próxima importação</label>
   </aside>
   <section className="sheet-view">
    <div className="sheet-tools">
     <label className="field"><span>Aba</span><select aria-label="Aba da planilha" value={aba} onChange={e=>{setAba(e.target.value);setTopo(1);setEsq(1);setAchados([]);setBuscado('');setFoco('');}}>{pasta.abas.map(a=><option key={a.nome} value={a.nome}>{a.nome}{a.oculta?' (oculta)':''}</option>)}</select></label>
     <form className="sheet-search" onSubmit={e=>{e.preventDefault();const p=posicao(ir);if(!p){setMensagem('Informe uma célula como F12.');return;}mostrar(p.linha,p.coluna);}}><label className="field"><span>Ir para célula</span><input aria-label="Ir para célula" value={ir} placeholder="F12" onChange={e=>setIr(e.target.value)}/></label><button type="submit">Ir</button></form>
     <form className="sheet-search" onSubmit={e=>{e.preventDefault();const r=achados.length&&termo===buscado?achados:pasta.buscar(aba,termo);setBuscado(termo);if(!r.length){setAchados([]);setMensagem(`“${termo}” não encontrado na aba ${aba}.`);return;}const n=r===achados?(achado+1)%r.length:0;setAchados(r);setAchado(n);setMensagem(`${n+1} de ${r.length} resultado(s) para “${termo}”.`);mostrar(r[n].linha,r[n].coluna);}}><label className="field"><span>Buscar texto</span><input aria-label="Buscar texto" value={termo} placeholder="Ex.: preventiva" onChange={e=>setTermo(e.target.value)}/></label><button type="submit">{achados.length&&termo===buscado?'Próximo':'Buscar'}</button></form>
     <div className="sheet-nav" role="group" aria-label="Navegar na planilha"><button type="button" aria-label="Colunas anteriores" disabled={esq===1} onClick={()=>setEsq(Math.max(1,esq-COLUNAS))}>◀</button><button type="button" aria-label="Linhas anteriores" disabled={topo===1} onClick={()=>setTopo(Math.max(1,topo-LINHAS))}>▲</button><button type="button" aria-label="Próximas linhas" onClick={()=>setTopo(topo+LINHAS)}>▼</button><button type="button" aria-label="Próximas colunas" onClick={()=>setEsq(esq+COLUNAS)}>▶</button></div>
    </div>
    {mensagem&&<p className="sheet-message" role="status">{mensagem}</p>}
    <div className="sheet-scroll"><table className="sheet-grid" aria-label={`Aba ${aba}`}><thead><tr><th/>{Array.from({length:COLUNAS},(_,i)=><th key={i} scope="col">{letra(esq+i)}</th>)}</tr></thead><tbody>{Array.from({length:LINHAS},(_,r)=>{const linha=topo+r;return <tr key={linha}><th scope="row">{linha}</th>{Array.from({length:COLUNAS},(_,k)=>{const coluna=esq+k,ref=endereco(linha,coluna),v=linha<=info.linhas&&coluna<=info.colunas?pasta.ler(aba,linha,coluna):{texto:'',numero:null,mesclada:false},campo=marcadas.get(ref);
     return <td key={coluna} className={[v.numero!==null?'num':'',v.mesclada?'merged':'',campo?'picked':'',foco===ref?'focus':''].join(' ')} title={`${ref}${v.texto?': '+v.texto:''}`} onMouseDown={e=>e.preventDefault()} onClick={()=>escolher(linha,coluna)}>{campo&&<b>{siglas[campo]}</b>}<span>{v.mesclada?'':v.texto}</span></td>;})}</tr>;})}</tbody></table></div>
    <p className="table-help">Linhas {topo}–{topo+LINHAS-1}, colunas {letra(esq)}–{letra(esq+COLUNAS-1)} · aba com {info.linhas} linha(s) e {info.colunas} coluna(s).</p>
   </section>
  </div>
 </dialog>;
}
