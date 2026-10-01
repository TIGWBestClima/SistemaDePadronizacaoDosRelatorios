// Endereços de célula no formato do Excel (A1, F12, AB300).
export const letra=(coluna:number)=>{let s='';for(let n=coluna;n>0;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;};
export const endereco=(linha:number,coluna:number)=>letra(coluna)+linha;
export function posicao(ref:string){const m=ref.trim().toUpperCase().match(/^([A-Z]{1,3})([1-9]\d{0,6})$/);if(!m)return null;let coluna=0;for(const ch of m[1])coluna=coluna*26+ch.charCodeAt(0)-64;return {linha:Number(m[2]),coluna};}
