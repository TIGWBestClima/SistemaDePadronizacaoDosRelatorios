import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('desktop', {
  saveProject: (bytes:Uint8Array) => ipcRenderer.invoke('save-project',bytes),
  saveSpreadsheet:(bytes:Uint8Array,modelo:'qualidade'|'obras')=>ipcRenderer.invoke('save-spreadsheet',bytes,modelo),
  exportPdf: (html:string) => ipcRenderer.invoke('export-pdf',html),
  openFile: (kind:'project'|'image'|'spreadsheet') => ipcRenderer.invoke('open-file',kind),
  setDirty: (dirty:boolean) => ipcRenderer.send('dirty',dirty),
});
