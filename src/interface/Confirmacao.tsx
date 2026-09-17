import {useEffect,useRef,useState} from 'react';
type Pedido={mensagem:string;resolve:(resposta:boolean)=>void};
function Confirmacao({mensagem,responder}:{mensagem:string;responder:(resposta:boolean)=>void}){
  const dialog=useRef<HTMLDialogElement>(null);
  const cancelar=useRef<HTMLButtonElement>(null);
  useEffect(()=>{const element=dialog.current!;element.showModal();cancelar.current?.focus();return()=>element.close();},[]);
  return <dialog ref={dialog} className="confirmacao" aria-labelledby="confirmacao-titulo" aria-describedby="confirmacao-mensagem" onCancel={e=>{e.preventDefault();responder(false);}}>
    <h2 id="confirmacao-titulo">Confirmar ação</h2>
    <p id="confirmacao-mensagem">{mensagem}</p>
    <div className="actions"><button ref={cancelar} onClick={()=>responder(false)}>Cancelar</button><button className="primary" onClick={()=>responder(true)}>Confirmar</button></div>
  </dialog>;
}
export function useConfirmacao(){
  const [pedido,setPedido]=useState<Pedido|null>(null);
  const confirmar=(mensagem:string)=>new Promise<boolean>(resolve=>setPedido({mensagem,resolve}));
  const elemento=pedido?<Confirmacao mensagem={pedido.mensagem} responder={resposta=>{setPedido(null);pedido.resolve(resposta);}}/>:null;
  return [confirmar,elemento] as const;
}
