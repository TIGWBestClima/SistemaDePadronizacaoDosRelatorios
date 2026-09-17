import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('desktop', {
  saveProject: (bytes:Uint8Array) => ipcRenderer.invoke('save-project',bytes),
  exportPdf: (html:string) => ipcRenderer.invoke('export-pdf',html),
  openFile: (kind:'project'|'image') => ipcRenderer.invoke('open-file',kind),
  setDirty: (dirty:boolean) => ipcRenderer.send('dirty',dirty),
});
