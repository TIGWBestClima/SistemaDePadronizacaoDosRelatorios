import type {Marcador} from '../relatorios/campo/modelo';
// Contornos em coordenadas percentuais (0–100) sobre a planta; o traço não escala com a imagem.
export const classeCor=(m:Pick<Marcador,'cor'>)=>'cor-'+(m.cor||'escura');
export const caminho=(contorno:[number,number][])=>'M'+contorno.map(([x,y])=>x.toFixed(2)+' '+y.toFixed(2)).join('L')+'Z';
export function Contornos({marcadores,rascunho}:{marcadores:Marcador[];rascunho?:[number,number][]}){
 const contornos=marcadores.filter(m=>m.contorno);
 if(!contornos.length&&!rascunho)return null;
 return <svg className="contornos" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{contornos.map(m=><path key={m.id} className={classeCor(m)} d={caminho(m.contorno!)}/>)}{rascunho&&rascunho.length>1&&<path className="rascunho" d={caminho(rascunho)}/>}</svg>;
}
// O número do contorno fica no ponto mais alto do traço, para não cobrir o duto.
export function posicaoNumero(contorno:[number,number][]):[number,number]{return contorno.reduce((a,b)=>b[1]<a[1]?b:a);}
