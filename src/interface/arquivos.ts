export async function escolherArquivo(tipo:'project'|'image'|'spreadsheet'):Promise<File|null>{
  if(!window.desktop)return null;
  const selected=await window.desktop.openFile(tipo);
  return selected?new File([new Uint8Array(selected.bytes)],selected.name,{type:selected.mime}):null;
}
