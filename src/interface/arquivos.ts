type Selecionado={name:string;mime:string;bytes:Uint8Array};
const arquivo=(selected:Selecionado)=>new File([new Uint8Array(selected.bytes)],selected.name,{type:selected.mime});
export async function escolherArquivo(tipo:'project'|'image'|'spreadsheet'):Promise<File|null>{
  if(!window.desktop)return null;
  const selected=await window.desktop.openFile(tipo);
  return selected?arquivo(selected):null;
}
export async function escolherImagens():Promise<File[]>{
  if(!window.desktop)return [];
  return (await window.desktop.openImages()).map(arquivo);
}
