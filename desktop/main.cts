import {app, BrowserWindow, ipcMain, dialog} from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
let main:BrowserWindow;
let dirty=false;
function trusted(event:Electron.IpcMainEvent | Electron.IpcMainInvokeEvent) {
  if(event.sender !== main.webContents || event.senderFrame !== main.webContents.mainFrame) throw new Error('Origem inválida');
}
app.whenReady().then(()=>{
  const create=()=>{
    main=new BrowserWindow({show:!app.commandLine.hasSwitch('headless'),width:1440,height:960,minWidth:1050,minHeight:720,backgroundColor:'#f5f8f8',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
    main.setMenuBarVisibility(false);
    main.webContents.setWindowOpenHandler(()=>({action:'deny'}));
    main.webContents.on('will-navigate',event=>event.preventDefault());
    main.on('close',event=>{
      if(dirty && dialog.showMessageBoxSync(main,{type:'question',buttons:['Continuar editando','Descartar e sair'],defaultId:0,cancelId:0,message:'Há alterações não salvas. Deseja sair?'})===0) event.preventDefault();
    });
    main.loadFile(path.join(__dirname,'../dist/index.html'));
  };
  ipcMain.on('dirty',(event,value)=>{trusted(event);dirty=value===true;});
  ipcMain.handle('open-file',async(event,kind)=>{
    trusted(event);
    if(kind!=='project'&&kind!=='image'&&kind!=='spreadsheet')throw new Error('Tipo de arquivo inválido.');
    try{
      const result=await dialog.showOpenDialog(main,{properties:['openFile'],filters:kind==='spreadsheet'?[{name:'Planilha Excel',extensions:['xlsx']}]:kind==='project'?[{name:'Projeto Best Clima',extensions:['bcrel']}]:[{name:'Imagem',extensions:['png','jpg','jpeg','webp']}]});
      if(result.canceled||!result.filePaths[0])return null;
      const filePath=result.filePaths[0];
      const ext=path.extname(filePath).toLowerCase();
      const mimes:Record<string,string>={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'};
      if(kind==='spreadsheet'?ext!=='.xlsx':kind==='project'?ext!=='.bcrel':!mimes[ext])throw new Error('Formato de arquivo não permitido.');
      const limit=(kind==='project'?200:kind==='spreadsheet'?50:10)*1024*1024;
      const handle=await fs.open(filePath,'r');
      try{
        const stat=await handle.stat();
        if(!stat.isFile()||stat.size>limit)throw new Error('Arquivo inválido ou acima do limite de tamanho.');
        const bytes=await handle.readFile();
        if(bytes.byteLength>limit)throw new Error('Arquivo acima do limite de tamanho.');
        return {name:path.basename(filePath),mime:kind==='spreadsheet'?'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':kind==='project'?'application/octet-stream':mimes[ext],bytes};
      }finally{await handle.close();}
    }finally{
      if(!main.isDestroyed()){main.focus();main.webContents.focus();}
    }
  });
  const imagens:Record<string,string>={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'};
  ipcMain.handle('open-images',async event=>{
    trusted(event);
    try{
      const result=await dialog.showOpenDialog(main,{properties:['openFile','multiSelections'],filters:[{name:'Imagem',extensions:['png','jpg','jpeg','webp']}]});
      if(result.canceled)return [];
      if(result.filePaths.length>200)throw new Error('Selecione até 200 imagens por vez.');
      const files=[];
      for(const filePath of result.filePaths){
        const mime=imagens[path.extname(filePath).toLowerCase()];
        if(!mime)throw new Error('Formato de arquivo não permitido.');
        const handle=await fs.open(filePath,'r');
        try{
          const stat=await handle.stat();
          if(!stat.isFile()||stat.size>10*1024*1024)throw new Error(`${path.basename(filePath)}: arquivo inválido ou acima de 10 MB.`);
          files.push({name:path.basename(filePath),mime,bytes:await handle.readFile()});
        }finally{await handle.close();}
      }
      return files;
    }finally{
      if(!main.isDestroyed()){main.focus();main.webContents.focus();}
    }
  });
  ipcMain.handle('save-spreadsheet',async(event,bytes,modelo)=>{
    trusted(event);
    if(!(bytes instanceof Uint8Array)||bytes.byteLength>50*1024*1024||!['qualidade','obras','visita','fotografico','dutos','apontamento'].includes(modelo))throw new Error('Planilha inválida.');
    try{
      const result=await dialog.showSaveDialog(main,{defaultPath:'modelo-'+modelo+'.xlsx',filters:[{name:'Planilha Excel',extensions:['xlsx']}]});
      if(result.canceled||!result.filePath)return false;
      await fs.writeFile(result.filePath,bytes);return true;
    }finally{if(!main.isDestroyed()){main.focus();main.webContents.focus();}}
  });
  ipcMain.handle('save-project',async(event,bytes)=>{
    trusted(event);
    if(!(bytes instanceof Uint8Array) || bytes.byteLength>200*1024*1024) throw new Error('Arquivo excede 200 MB.');
    const result=await dialog.showSaveDialog(main,{defaultPath:'relatorio.bcrel',filters:[{name:'Projeto Best Clima',extensions:['bcrel']}]});
    if(result.canceled || !result.filePath) return false;
    const temporary=result.filePath+'.tmp';
    await fs.writeFile(temporary,bytes); await fs.rename(temporary,result.filePath); return true;
  });
  ipcMain.handle('export-pdf',async(event,html)=>{
    trusted(event);
    if(typeof html!=='string'||html.length>280*1024*1024) throw new Error('Documento muito grande.');
    const result=await dialog.showSaveDialog(main,{defaultPath:'relatorio.pdf',filters:[{name:'PDF',extensions:['pdf']}]});
    if(result.canceled || !result.filePath) return false;
    // Images can make the HTML exceed Chromium's navigation URL limit.
    // A local file keeps the navigation URL short, regardless of document size.
    const temporaryDirectory=await fs.mkdtemp(path.join(app.getPath('temp'),'best-clima-pdf-'));
    const temporaryHtml=path.join(temporaryDirectory,'relatorio.html');
    let print:BrowserWindow|undefined;
    try {
      await fs.writeFile(temporaryHtml,html,'utf8');
      print=new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,javascript:false}});
      await print.loadFile(temporaryHtml);
      const bytes=await print.webContents.printToPDF({printBackground:true,preferCSSPageSize:true,pageSize:'A4',margins:{top:0,bottom:0,left:0,right:0}});
      await fs.writeFile(result.filePath,bytes); return true;
    } finally {
      print?.destroy();
      // Remove only the known file and its own empty directory (no recursive deletion).
      await fs.unlink(temporaryHtml).catch((error:NodeJS.ErrnoException)=>{
        if(error.code!=='ENOENT')console.warn('Falha ao limpar HTML temporário:',error.code);
      });
      await fs.rmdir(temporaryDirectory).catch((error:NodeJS.ErrnoException)=>{
        if(error.code!=='ENOENT')console.warn('Falha ao limpar diretório temporário:',error.code);
      });
    }
  });
  create();
  app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0){dirty=false;create();}});
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
