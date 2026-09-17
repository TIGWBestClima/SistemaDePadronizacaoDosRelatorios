import {useEffect,type RefObject} from 'react';
// Scale only the preview frame: report dimensions and PDF layout stay unchanged.
export function usePreviewFit(frame:RefObject<HTMLIFrameElement|null>,ready:boolean,html:string){
 useEffect(()=>{
  const iframe=frame.current,container=iframe?.parentElement,doc=iframe?.contentDocument;
  if(!ready||!iframe||!container||!doc)return;
  const page=doc.querySelector<HTMLElement>('.page'),pages=doc.getElementById('pages');
  if(!page||!pages)return;
  const style=doc.defaultView!.getComputedStyle(pages);
  const width=Math.ceil(page.getBoundingClientRect().width+parseFloat(style.paddingLeft)+parseFloat(style.paddingRight));
  iframe.style.width=width+'px';
  // Begin at zero to measure document content rather than the previous viewport height.
  iframe.style.height='0px';
  iframe.style.height=Math.ceil(Math.max(doc.body.scrollHeight,doc.documentElement.scrollHeight))+'px';
  const fit=()=>{iframe.style.zoom=String(Math.max(1,container.clientWidth)/width);};
  fit();const observer=new ResizeObserver(fit);observer.observe(container);
  return()=>observer.disconnect();
 },[frame,ready,html]);
}
