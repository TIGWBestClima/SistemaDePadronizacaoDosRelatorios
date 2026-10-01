import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import {camposGerais,camposItem,criterios,notas,novoItem,novoProjeto as novaQualidade,type Campo} from '../relatorios/qualidade/modelo';
import {novoRegistro,novoProjetoObras} from '../relatorios/obras/modelo';
import {projetoSchema,type Projeto} from '../relatorios/modelo';
import {ehCampo,novoProjetoCampo,novoRegistroCampo,variantes,type ModeloCampo} from '../relatorios/campo/modelo';
import {catalogo} from '../relatorios/catalogo';

type Coluna=Campo & {image?:boolean};
type Aba={name:string;campos:Coluna[];required:string[]};
const qualidade: Aba={name:'Itens',campos:[...camposItem,{key:'foto',label:'Foto do registro',image:true},{key:'fotoCorrecao',label:'Foto da correção',image:true}],required:['descricao']};
const fotografico:Aba={name:'Fotográficos',campos:[{key:'servico',label:'Serviço realizado'},{key:'pavimento',label:'Pavimento'},{key:'legenda',label:'Legenda do registro fotográfico'},{key:'descricao',label:'Resumo/Descrição das atividades realizadas',type:'textarea'},{key:'foto',label:'Registro fotográfico',image:true}],required:['servico']};
const descritivo:Aba={name:'Descritivos',campos:[{key:'servico',label:'Serviço realizado'},{key:'tipoDescricao',label:'Tipo de descrição'},{key:'descricao',label:'Resumo/Descrição das atividades realizadas',type:'textarea'}],required:['servico']};
const geraisObras:Campo[]=[{key:'obra',label:'Nome da obra'},{key:'tipoRelatorio',label:'Tipo de relatório'}];
export const normalizar=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLowerCase();
const campoAba=(modelo:ModeloCampo):Aba=>{const v=variantes[modelo];return {name:v.aba,campos:[...v.item,...v.fotos.map(f=>({key:f.key,label:f.label,image:true}))],required:[v.item[0].key]};};
// Assessment e Receitas x Despesas não usam esta planilha-modelo.
export type ModeloExcel=Exclude<Projeto['modelo'],'assessment'|'financeiro'>;
const abas=(modelo:ModeloExcel)=>modelo==='qualidade'?[qualidade]:modelo==='obras'?[fotografico,descritivo]:[campoAba(modelo)];
const camposIdentificacao=(modelo:ModeloExcel)=>modelo==='qualidade'?camposGerais:modelo==='obras'?geraisObras:variantes[modelo].gerais;
const nomeModelo=(modelo:Projeto['modelo'])=>catalogo.find(m=>m.id===modelo)!.curto;

export async function criarModeloExcel(modelo:ModeloExcel):Promise<Uint8Array>{
 const wb=new ExcelJS.Workbook();wb.creator='Best Clima';
 const info=wb.addWorksheet('Instruções');info.columns=[{width:115}];
 const lines=[`MODELO — ${nomeModelo(modelo).toUpperCase()}`,
  'Preencha uma linha por registro nas abas de dados. Não altere os nomes das abas ou os títulos das colunas.',
  'Os novos registros serão acrescentados ao relatório aberto. Importar novamente a mesma planilha cria novos registros.',
  'Informações gerais são opcionais. Somente valores preenchidos serão aplicados, após sua confirmação.',
  'Datas: use células de data do Excel ou texto DD/MM/AAAA. Campos vazios continuam vazios.',
  'Use os menus de seleção quando a coluna oferecer opções. Evite fórmulas: copie e cole somente os valores.',
  'Fotos: insira imagens PNG ou JPG SOBRE as células, com o canto superior esquerdo na coluna de foto e na linha do registro.',
  'Uma foto por célula. Até 10 MB por imagem. Fotos dentro da célula (IMAGE/IMAGEM) e links não são importados.',
  'Você também pode deixar as fotos vazias e adicioná-las depois no aplicativo. A imagem de capa é preenchida no aplicativo.',
  'Tabelas dos registros descritivos podem ser coladas e editadas no aplicativo após a importação.',
  'Limites: arquivo de até 50 MB, até 10.000 registros no relatório. Arquivos aceitos: .xlsx.',
  'Exemplo de data: 17/09/2026. Não há registros de exemplo nas abas de dados para evitar importá-los por engano.'];
 lines.forEach(s=>{const r=info.addRow([s]);r.height=32;r.alignment={wrapText:true,vertical:'middle'};});
 const sheet=(name:string,fields:Coluna[])=>{
  const ws=wb.addWorksheet(name);ws.columns=fields.map(f=>({header:f.label,key:f.key,width:f.type==='textarea'?65:f.image?28:26}));
  ws.views=[{state:'frozen',ySplit:1}];ws.autoFilter={from:{row:1,column:1},to:{row:1,column:fields.length}};
  ws.getRow(1).height=38;ws.getRow(1).eachCell(c=>{c.font={bold:true,color:{argb:'FFFFFFFF'}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF0A696C'}};c.alignment={wrapText:true,vertical:'middle'};});
  fields.forEach((f,i)=>{ws.getColumn(i+1).numFmt=f.type==='date'?'dd/mm/yyyy':'@';for(let r=2;r<=101;r++){const cell=ws.getCell(r,i+1);cell.alignment={wrapText:true,vertical:'top'};if(f.options)cell.dataValidation={type:'list',allowBlank:true,formulae:['"'+f.options.join(',')+'"'],showErrorMessage:true,errorTitle:'Valor inválido',error:'Selecione um valor da lista.'};}if(f.image)ws.getCell(1,i+1).note='Inserir imagem sobre a célula. Posicione o canto superior esquerdo na linha correspondente.';});
  return ws;
 };
 sheet('Informações gerais',camposIdentificacao(modelo));
 for(const aba of abas(modelo))sheet(aba.name,aba.campos);
 if(modelo==='qualidade')sheet('Avaliação',[...criterios.map(c=>({key:c,label:c,options:notas})),{key:'observacoes',label:'Observações gerais',type:'textarea'}]);
 return new Uint8Array(await wb.xlsx.writeBuffer());
}

export type RevisaoExcel={projeto:Projeto;erros:string[];avisos:string[];quantidade:number;fotos:number;campos:string[];previa:{aba:string;linha:number;resumo:string}[]};
export async function lerPlanilha(bytes:ArrayBuffer,atual:Projeto):Promise<RevisaoExcel>{
 if(bytes.byteLength>50*1024*1024)throw new Error('Use uma planilha de até 50 MB.');
 const zip=await JSZip.loadAsync(bytes).catch(()=>{throw new Error('Não foi possível abrir a planilha. Salve o arquivo no formato Excel .xlsx, sem senha.');});
 let expanded=0;
 for(const f of Object.values(zip.files)){expanded+=(f as unknown as {_data?:{uncompressedSize:number}})._data?.uncompressedSize??0;if(expanded>200*1024*1024)throw new Error('O conteúdo da planilha excede 200 MB.');}
 if(!zip.file('xl/workbook.xml'))throw new Error('O arquivo não é uma planilha Excel .xlsx.');
 if(Object.keys(zip.files).some(n=>/richData|cellimages/i.test(n)))throw new Error('A planilha contém imagens dentro de células. Insira as fotos sobre as células nas colunas indicadas no modelo.');
 const wb=new ExcelJS.Workbook();
 try{await wb.xlsx.load(bytes as unknown as ExcelJS.Buffer);}catch{throw new Error('Não foi possível ler a planilha. Salve uma cópia em .xlsx, sem senha, e tente novamente.');}
 if(atual.modelo==='assessment'||atual.modelo==='financeiro')throw new Error('Este relatório não usa a importação por Excel.');
 const projeto=atual.modelo==='qualidade'?novaQualidade():atual.modelo==='obras'?novoProjetoObras():novoProjetoCampo(atual.modelo);
 const result:RevisaoExcel={projeto,erros:[],avisos:[],quantidade:0,fotos:0,campos:[],previa:[]};
 let totalErrors=0;
 const error=(where:string,message:string)=>{totalErrors++;if(result.erros.length<100)result.erros.push(`${where}: ${message}`);};
 const find=(name:string)=>wb.worksheets.find(s=>normalizar(s.name)===normalizar(name));
 const expected=abas(atual.modelo);
 if(!expected.some(a=>find(a.name)))throw new Error(`Use o modelo de ${atual.modelo==='qualidade'?'Qualidade (aba Itens)':atual.modelo==='obras'?'Avanço de Obras (abas Fotográficos e Descritivos)':`${nomeModelo(atual.modelo)} (aba ${variantes[atual.modelo].aba})`}.`);
 const allowed=new Set([...expected.map(a=>normalizar(a.name)),normalizar('Instruções'),normalizar('Informações gerais'),...(atual.modelo==='qualidade'?[normalizar('Avaliação')]:[])]);
 for(const ws of wb.worksheets)if(!allowed.has(normalizar(ws.name)))result.avisos.push(`A aba “${ws.name}” não faz parte deste modelo e será ignorada.`);
 function text(cell:ExcelJS.Cell,where:string):string{
  if(cell.isMerged){error(where,'desfaça a mesclagem das células.');return '';}
  const v=cell.value;
  if(v==null)return '';
  if(v instanceof Date)return v.toISOString().slice(0,10);
  if(typeof v==='object'){
   if('formula' in v||'sharedFormula' in v){error(where,'substitua a fórmula pelo valor (Colar especial → Valores).');return '';}
   if('error' in v){error(where,'a célula contém um erro do Excel.');return '';}
   if('richText' in v)return v.richText.map(p=>p.text).join('').trim();
   if('text' in v)return String(v.text).trim();
  }
  if(typeof v==='number'&&/^0+$/.test(cell.numFmt||''))return String(v).padStart(cell.numFmt.length,'0');
  return String(v).trim();
 }
 function readCell(cell:ExcelJS.Cell,field:Coluna,where:string):string{
  let value=text(cell,where);if(!value)return '';
  if(field.image){error(where,'insira uma foto sobre a célula, ou deixe-a vazia para adicionar a foto no aplicativo. Não use nomes de arquivo ou links.');return '';}
  if(field.type==='date'){
   if(typeof cell.value==='number'){
    const n=cell.value;
    if(n<1||n>2958465||(!wb.properties.date1904&&Math.floor(n)===60)){error(where,'data inválida. Use DD/MM/AAAA.');return '';}
    const days=wb.properties.date1904?Math.floor(n):Math.floor(n)-(n<60?0:1);
    value=new Date(Date.UTC(wb.properties.date1904?1904:1899,wb.properties.date1904?0:11,wb.properties.date1904?1:31)+days*86400000).toISOString().slice(0,10);
   }
   const br=value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
   if(br)value=`${br[3]}-${br[2].padStart(2,'0')}-${br[1].padStart(2,'0')}`;
   if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value){error(where,'data inválida. Use DD/MM/AAAA.');return '';}
  }
  if(field.options){const option=field.options.find(o=>normalizar(o)===normalizar(value));if(!option){error(where,`use uma destas opções: ${field.options.join(', ')}.`);return '';}value=option;}
  const limit=field.type==='textarea'?100000:140;
  if(value.length>limit)error(where,`o texto excede ${limit} caracteres.`);
  return value;
 }
 function columns(ws:ExcelJS.Worksheet,fields:Coluna[],required:string[]=[]){
  const map=new Map<string,number>();
  if(ws.columnCount>100||ws.rowCount>10001){error(ws.name,'use até 100 colunas e 10.000 linhas de dados.');return map;}
  ws.getRow(1).eachCell((cell,col)=>{const label=text(cell,`${ws.name}, cabeçalho ${col}`);if(!label)return;const field=fields.find(f=>normalizar(f.label)===normalizar(label));if(!field){result.avisos.push(`${ws.name}: coluna “${label}” ignorada.`);return;}if(map.has(field.key))error(ws.name,`coluna “${field.label}” repetida.`);else map.set(field.key,col);});
  for(const key of required)if(!map.has(key))error(ws.name,`coluna obrigatória ausente: ${fields.find(f=>f.key===key)?.label}.`);
  if(!map.size)error(ws.name,'nenhuma coluna reconhecida. Use a planilha-modelo.');
  return map;
 }
 function rowValues(ws:ExcelJS.Worksheet,row:number,fields:Coluna[],map:Map<string,number>){
  const values:Record<string,string>={};
  for(const f of fields){const col=map.get(f.key);if(col)values[f.key]=readCell(ws.getCell(row,col),f,`${ws.name}, linha ${row}, ${f.label}`);}
  return values;
 }
 const general=find('Informações gerais');
 if(general){const fields=camposIdentificacao(atual.modelo),map=columns(general,fields);if(general.rowCount<=10001){let filled=0;for(let row=2;row<=general.rowCount;row++){const values=rowValues(general,row,fields,map);if(Object.values(values).some(Boolean)){if(filled++)error(general.name,'preencha somente uma linha de informações gerais.');for(const f of fields)if(values[f.key]){(projeto.gerais as Record<string,string>)[f.key]=values[f.key];result.campos.push(f.label);}}}}}
 const updatedGeneral:Record<string,string>={};
 for(const f of camposIdentificacao(atual.modelo))if(result.campos.includes(f.label))updatedGeneral[f.key]=(projeto.gerais as Record<string,string>)[f.key];
 projeto.gerais={...atual.gerais,...updatedGeneral} as typeof projeto.gerais;
 if(projeto.modelo==='qualidade'&&atual.modelo==='qualidade'){
  projeto.capa=atual.capa;projeto.observacoes=atual.observacoes;projeto.avaliacao={...atual.avaliacao};
  const assessment=find('Avaliação');
  if(assessment){const fields:Coluna[]=[...criterios.map(c=>({key:c,label:c,options:notas})),{key:'observacoes',label:'Observações gerais',type:'textarea'}];const map=columns(assessment,fields);if(assessment.rowCount<=10001){let filled=0;for(let row=2;row<=assessment.rowCount;row++){const values=rowValues(assessment,row,fields,map);if(Object.values(values).some(Boolean)){if(filled++)error(assessment.name,'preencha somente uma linha de avaliação.');for(const c of criterios)if(values[c]){projeto.avaliacao[c]=values[c] as typeof notas[number];result.campos.push(c);}if(values.observacoes){projeto.observacoes=values.observacoes;result.campos.push('Observações gerais');}}}}}
 }
 for(const aba of expected){
  const ws=find(aba.name);if(!ws)continue;
  const map=columns(ws,aba.campos,aba.required);if(ws.rowCount>10001||ws.columnCount>100)continue;
  const images=new Map<number,Record<string,string>>();
  for(const image of ws.getImages()){
   const row=Math.floor(image.range.tl.row)+1,col=Math.floor(image.range.tl.col)+1;
   const field=aba.campos.find(f=>f.image&&map.get(f.key)===col);
   const where=`${ws.name}, linha ${row}, imagem`;
   if(!field||row<2||row>10001){error(where,'posicione o canto superior esquerdo da imagem na coluna de foto e na linha do registro.');continue;}
   try{
    const media=wb.getImage(Number(image.imageId));
    if(!media||!['png','jpeg','jpg'].includes(media.extension))throw new Error('use imagens PNG ou JPG.');
    let data=media.base64?String(media.base64).split(',').pop()!:'';
    if(media.buffer){const array=new Uint8Array(media.buffer as unknown as ArrayBuffer);let binary='';for(let i=0;i<array.length;i+=8192)binary+=String.fromCharCode(...array.subarray(i,i+8192));data=btoa(binary);}
    if(!data||data.length>14_000_000)throw new Error('use uma imagem de até 10 MB.');
    const src=`data:image/${media.extension==='png'?'png':'jpeg'};base64,${data}`;
    if(typeof Image!=='undefined'){const picture=new Image();picture.src=src;await picture.decode();if(picture.width*picture.height>40_000_000)throw new Error('use uma imagem de até 40 megapixels.');}
    const record=images.get(row)||{};if(record[field.key])throw new Error('há mais de uma imagem na mesma célula.');record[field.key]=src;images.set(row,record);result.fotos++;
   }catch(e){error(where,e instanceof Error?e.message:'imagem inválida.');}
  }
  const last=Math.max(ws.rowCount,...images.keys());
  for(let row=2;row<=last;row++){
   const values=rowValues(ws,row,aba.campos,map),photos=images.get(row)||{};
   if(!Object.values(values).some(Boolean)&&!Object.keys(photos).length)continue;
   // Blank cells keep the same defaults as manual creation.
   const filled=Object.fromEntries(Object.entries(values).filter(([,v])=>v!==''));
   if(projeto.modelo==='qualidade')projeto.itens.push({...novoItem(),...filled,...photos});
   else if(projeto.modelo==='obras')projeto.itens.push({...novoRegistro(aba.name==='Fotográficos'?'fotografico':'descritivo'),...filled,...photos});
   else projeto.itens.push({...novoRegistroCampo(),...filled,...photos});
   result.quantidade++;
   if(result.previa.length<8)result.previa.push({aba:ws.name,linha:row,resumo:values.descricao||values.servico||values.titulo||values.legenda||values.local||'Registro com imagem'});
  }
 }
 if(result.quantidade+atual.itens.length>10000)error('Relatório','o total de registros ultrapassa 10.000.');
 if(!result.quantidade&&!result.campos.length&&!result.erros.length)error('Planilha','não há dados preenchidos para importar.');
 if(projeto.modelo==='qualidade'&&atual.modelo==='qualidade')projeto.itens=[...atual.itens,...projeto.itens];
 if(projeto.modelo==='obras'&&atual.modelo==='obras')projeto.itens=[...atual.itens,...projeto.itens];
 if(ehCampo(projeto)&&ehCampo(atual)){projeto.itens=[...atual.itens,...projeto.itens];projeto.conclusao=atual.conclusao;projeto.mapas=atual.mapas;}
 const checked=projetoSchema.safeParse(projeto);
 if(!checked.success&&!result.erros.length)error('Planilha','há dados incompatíveis com os limites do relatório. Confira os textos e as imagens.');
 if(totalErrors>100)result.erros.push(`Mais ${totalErrors-100} erro(s). Corrija os erros indicados e importe novamente.`);
 return result;
}
