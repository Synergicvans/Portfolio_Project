(() => {
  const launcher=document.createElement('button');
  launcher.type='button';launcher.className='assistant-launcher';
  launcher.setAttribute('aria-label','Ask about Avnish');launcher.setAttribute('aria-haspopup','dialog');
  launcher.innerHTML='<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="#101410" d="M12 28 10 7 27 18Q32 16 37 18L54 7 52 28Q61 54 32 57 3 54 12 28Z"/><path d="M21 34h4m14 0h4" stroke="#d5f675" stroke-width="4" stroke-linecap="round"/><path d="m29 42 3 3 3-3" fill="none" stroke="#d5f675" stroke-width="2"/></svg><span>Ask me</span>';
  const dialog=document.createElement('dialog');dialog.className='assistant-panel';dialog.setAttribute('aria-labelledby','assistant-title');
  dialog.innerHTML='<header><div><p class="assistant-eyebrow">A LITTLE HELP FROM AI</p><h2 id="assistant-title">Curious about Avnish?</h2></div><button type="button" class="assistant-close" aria-label="Close assistant">×</button></header><p class="assistant-intro">Ask about my work, skills, or projects. Answers use my public portfolio.</p><div class="assistant-answer" role="status" aria-live="polite">What would you like to know?</div><p class="assistant-source"></p><form class="assistant-form"><label for="assistant-question">Your question</label><div><input id="assistant-question" maxlength="500" required placeholder="What does Avnish build?" autocomplete="off"><button type="submit">Ask ↗</button></div></form><p class="assistant-privacy">Questions are processed by Groq when connected. Please avoid personal or sensitive information. AI can make mistakes; check the linked project source.</p>';
  document.body.append(launcher,dialog);
  const answer=dialog.querySelector('.assistant-answer'),source=dialog.querySelector('.assistant-source'),form=dialog.querySelector('form'),input=form.querySelector('input'),submit=form.querySelector('button');
  let controller,returnFocus;
  const config=fetch('data/assistant-config.json').then(r=>{if(!r.ok)throw Error();return r.json();}).catch(()=>({apiBase:''}));
  const knowledge=fetch('data/knowledge.json').then(r=>{if(!r.ok)throw Error();return r.json();}).catch(()=>null);
  function open(trigger) {returnFocus=trigger;if(!dialog.open)dialog.showModal();input.focus();}
  function close() {controller?.abort();dialog.close();submit.disabled=false;returnFocus?.focus();}
  dialog.querySelector('.assistant-close').addEventListener('click',close);
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  launcher.addEventListener('click',()=>open(launcher));
  const messages={not_configured:'AI is being connected. You can explore the project source or contact Avnish directly.',rate_limited:'You’ve reached the hourly question limit. Please try again later.',daily_limit:'Today’s AI allowance has been used. Please try again tomorrow.',generating:'This summary is being prepared. Please try again in a few seconds.'};
  async function ask(payload) {
    controller?.abort();const current=new AbortController();controller=current;
    const timeout=setTimeout(()=>current.abort(),35000);submit.disabled=true;answer.textContent='Thinking…';source.textContent='';
    try {
      const {apiBase}=await config;
      if(!apiBase)throw new Error('not_configured');
      const response=await fetch(`${apiBase.replace(/\/$/,'')}/api/${payload.repo?'summary':'chat'}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:current.signal});
      const result=await response.json();if(!response.ok)throw new Error(result.error || 'unavailable');
      if(current!==controller)return;
      answer.textContent=result.answer;source.textContent=`${result.cached?'Saved answer':'Generated answer'} · Groq`;
    } catch(error) {
      if(current!==controller || !dialog.open)return;
      const data=await knowledge;
      if(current!==controller || !dialog.open)return;
      const project=payload.repo&&data?.projects.find(p=>p.repo===payload.repo);
      answer.textContent=project?.summary || messages[error.message] || 'The assistant is temporarily unavailable. Please try again shortly.';
      source.textContent=project?'Portfolio overview · AI summary currently unavailable':'';
    } finally {clearTimeout(timeout);if(current===controller)submit.disabled=false;}
  }
  form.addEventListener('submit',event=>{event.preventDefault();if(input.value.trim())ask({question:input.value.trim()});});
  document.addEventListener('click',event=>{const button=event.target.closest('[data-ai-summary]');if(!button)return;open(button);input.value='';ask({repo:button.dataset.aiSummary});});
})();
