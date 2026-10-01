import {z} from 'zod';
import type {Campo} from '../qualidade/modelo';
// Relatórios de campo: mesma base visual do Avanço de Obras (16:9), com variações de conteúdo.
export const modelosCampo=['visita','fotografico','dutos','apontamento'] as const;
export type ModeloCampo=typeof modelosCampo[number];
export const fotosPorPagina=['1','2','4','6'] as const;
const short=z.string().max(140);
const long=z.string().max(100000);
const date=z.string().refine(v=>v===''||(/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v),'Data inválida');
const image=z.string().max(15_000_000).refine(v=>v===''||/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v),'Imagem inválida');
export const registroCampoSchema=z.object({id:z.string().min(1),titulo:short,local:short,foto:image,fotoDepois:image,legenda:short,descricao:long,recomendacao:long});
// Tons da paleta Best Clima para destacar marcações.
export const coresMarcador=['clara','media','escura'] as const;
const coordenada=z.number().min(0).max(100);
// Marcador: ponto (x,y) ou contorno de um duto; no contorno, (x,y) é a posição do número.
export const marcadorSchema=z.object({id:z.string().min(1),item:z.string().min(1),x:coordenada,y:coordenada,contorno:z.array(z.tuple([coordenada,coordenada])).min(3).max(500).optional(),cor:z.enum(coresMarcador).optional()});
export const mapaSchema=z.object({id:z.string().min(1),nome:short,imagem:image.refine(v=>v!=='','Planta sem imagem'),proporcao:z.number().min(0.05).max(20),marcadores:z.array(marcadorSchema).max(2000)});
export const projetoCampoSchema=z.object({formato:z.literal(1),modelo:z.enum(modelosCampo),versaoModelo:z.literal(1),gerais:z.object({obra:short,cliente:short,tipoRelatorio:short,local:short,data:date,responsavel:short,acompanhante:short,objetivo:long,fotosPorPagina:z.enum(fotosPorPagina)}),itens:z.array(registroCampoSchema).max(10000),conclusao:long,mapas:z.array(mapaSchema).max(50)}).refine(p=>new Set([...p.itens.map(i=>i.id),...p.mapas.map(m=>m.id)]).size===p.itens.length+p.mapas.length,'Identificadores repetidos');
export type ProjetoCampo=z.infer<typeof projetoCampoSchema>;
export type RegistroCampo=ProjetoCampo['itens'][number];
export type Mapa=ProjetoCampo['mapas'][number];
export type Marcador=Mapa['marcadores'][number];
export type CampoFoto={key:'foto'|'fotoDepois';label:string};
export type VarianteCampo={id:ModeloCampo;nome:string;curto:string;descricao:string;tipoRelatorio:string;registro:string;novo:string;aba:string;secoes:{gerais:string;itens:string;mapas?:string;final?:string};gerais:Campo[];item:Campo[];fotos:CampoFoto[]};
// Cliente é a identificação principal (atende obras e manutenção); a obra é opcional.
const identificacao=(data:string):Campo[]=>[{key:'cliente',label:'Cliente'},{key:'obra',label:'Obra (opcional)'},{key:'tipoRelatorio',label:'Tipo de relatório'},{key:'data',label:data,type:'date'},{key:'local',label:'Endereço / local'},{key:'responsavel',label:'Responsável técnico'}];
export const variantes:Record<ModeloCampo,VarianteCampo>={
 visita:{id:'visita',nome:'Relatório de Visita Técnica',curto:'Visita Técnica',descricao:'Constatações, recomendações e conclusão da visita.',tipoRelatorio:'VISITA TÉCNICA',registro:'CONSTATAÇÃO',novo:'Adicionar constatação',aba:'Constatações',
  secoes:{gerais:'Dados da visita',itens:'Constatações',final:'Conclusão'},
  gerais:[...identificacao('Data da visita'),{key:'acompanhante',label:'Acompanhado por'},{key:'objetivo',label:'Objetivo da visita',type:'textarea'}],
  item:[{key:'titulo',label:'Constatação'},{key:'local',label:'Local / sistema'},{key:'legenda',label:'Legenda da foto'},{key:'descricao',label:'Descrição da constatação',type:'textarea'},{key:'recomendacao',label:'Recomendação',type:'textarea'}],
  fotos:[{key:'foto',label:'Foto da constatação (opcional)'}]},
 fotografico:{id:'fotografico',nome:'Relatório Fotográfico',curto:'Fotográfico',descricao:'Fotos em destaque, com legenda e local, em até 6 por página, e conclusão.',tipoRelatorio:'RELATÓRIO FOTOGRÁFICO',registro:'FOTO',novo:'Adicionar foto',aba:'Fotos',
  secoes:{gerais:'Capa e dados',itens:'Fotos',final:'Conclusão'},
  gerais:[...identificacao('Data'),{key:'fotosPorPagina',label:'Fotos por página',options:fotosPorPagina}],
  item:[{key:'legenda',label:'Legenda da foto'},{key:'local',label:'Local / pavimento'}],
  fotos:[{key:'foto',label:'Foto'}]},
 dutos:{id:'dutos',nome:'Relatório de Limpeza de Dutos',curto:'Limpeza de Dutos',descricao:'Pontos limpos com antes e depois, marcados nas plantas.',tipoRelatorio:'LIMPEZA DE DUTOS',registro:'PONTO',novo:'Adicionar ponto de limpeza',aba:'Pontos de limpeza',
  secoes:{gerais:'Capa e dados',itens:'Pontos de limpeza',mapas:'Mapas de limpeza'},
  gerais:identificacao('Data da limpeza'),
  item:[{key:'titulo',label:'Identificação do ponto'},{key:'local',label:'Local / pavimento'},{key:'descricao',label:'Descrição do serviço',type:'textarea'}],
  fotos:[{key:'foto',label:'Foto antes da limpeza'},{key:'fotoDepois',label:'Foto depois da limpeza'}]},
 apontamento:{id:'apontamento',nome:'Relatório de Apontamentos',curto:'Apontamentos',descricao:'Uma página por apontamento, com foto e descrição.',tipoRelatorio:'APONTAMENTOS',registro:'APONTAMENTO',novo:'Adicionar apontamento',aba:'Apontamentos',
  secoes:{gerais:'Capa e dados',itens:'Apontamentos'},
  gerais:identificacao('Data da vistoria'),
  item:[{key:'titulo',label:'Apontamento'},{key:'local',label:'Local'},{key:'legenda',label:'Legenda da foto'},{key:'descricao',label:'Descrição do apontamento',type:'textarea'}],
  fotos:[{key:'foto',label:'Foto do apontamento'}]},
};
export const ehCampo=(p:{modelo:string}):p is ProjetoCampo=>(modelosCampo as readonly string[]).includes(p.modelo);
export const novoRegistroCampo=():RegistroCampo=>({id:crypto.randomUUID(),titulo:'',local:'',foto:'',fotoDepois:'',legenda:'',descricao:'',recomendacao:''});
export const novoProjetoCampo=(modelo:ModeloCampo):ProjetoCampo=>({formato:1,modelo,versaoModelo:1,gerais:{obra:'',cliente:'',tipoRelatorio:variantes[modelo].tipoRelatorio,local:'',data:'',responsavel:'',acompanhante:'',objetivo:'',fotosPorPagina:'4'},itens:[],conclusao:'',mapas:[]});
