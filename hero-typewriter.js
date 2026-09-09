(() => {
  const heading=document.querySelector('#hero-title');
  if(!heading)return;
  const lines=[heading.querySelector('.type-line-first'),heading.querySelector('.type-line-second')];
  const phrases=[
    ['A curious mind.','A builder at heart.'],
    ['Ideas into code.','Code into impact.'],
    ['Built with logic.','Driven by curiosity.'],
    ['Full-stack craft.','A human touch.'],
    ['Think. Build. Test.','Make it matter.']
  ];
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let index=0,timer,paused=false,position=0,deleting=false;
  try {index=(Number(sessionStorage.getItem('hero-phrase') ?? -1)+1)%phrases.length;sessionStorage.setItem('hero-phrase',String(index));}catch{index=Math.floor(Math.random()*phrases.length);}
  const toggle=document.createElement('button');toggle.type='button';toggle.className='hero-motion-toggle';toggle.textContent='Pause headline';toggle.setAttribute('aria-pressed','false');heading.after(toggle);
  heading.classList.add('cycling-headline');
  function render(count) {
    const [first,second]=phrases[index];
    lines[0].textContent=first.slice(0,count);
    lines[1].textContent=second.slice(0,Math.max(0,count-first.length));
    lines[0].classList.toggle('typing-active',count<first.length);
    lines[1].classList.toggle('typing-active',count>=first.length);
  }
  function tick() {
    if(paused||motion.matches||document.hidden)return;
    const length=phrases[index].join('').length;
    position+=deleting?-1:1;render(position);
    let delay=deleting?32:75;
    if(position===length){deleting=true;delay=2600;}
    else if(position===0){deleting=false;index=(index+1)%phrases.length;delay=300;}
    timer=setTimeout(tick,delay);
  }
  function resume() {clearTimeout(timer);if(!paused&&!motion.matches&&!document.hidden)timer=setTimeout(tick,500);}
  function preference() {
    clearTimeout(timer);toggle.hidden=motion.matches;
    if(motion.matches){position=phrases[index].join('').length;render(position);deleting=true;}
    else resume();
  }
  toggle.addEventListener('click',()=>{paused=!paused;toggle.textContent=paused?'Resume headline':'Pause headline';toggle.setAttribute('aria-pressed',String(paused));heading.classList.toggle('headline-paused',paused);resume();});
  document.addEventListener('visibilitychange',resume);
  motion.addEventListener('change',preference);
  render(0);preference();
})();
