'use strict';
const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#nav-links');
const mobile = window.matchMedia('(max-width: 760px)');
menuToggle.hidden = false;
function setMenu(open) {
  menuToggle.setAttribute('aria-expanded', String(open));
  navigation.hidden = mobile.matches && !open;
}
setMenu(false);
menuToggle.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
mobile.addEventListener('change', () => setMenu(false));
navigation.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && mobile.matches && menuToggle.getAttribute('aria-expanded') === 'true') { setMenu(false); menuToggle.focus(); }
});
const tabs = [...document.querySelectorAll('.tab')];
document.querySelector('.tabs').setAttribute('role', 'tablist');
function activateTab(selected, focus = false) {
  tabs.forEach(tab => {
    const active = tab === selected;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    document.getElementById(tab.dataset.panel).hidden = !active;
  });
  if (focus) selected.focus();
}
tabs.forEach((tab, index) => {
  const panel = document.getElementById(tab.dataset.panel);
  tab.setAttribute('role', 'tab'); tab.setAttribute('aria-controls', panel.id);
  panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', tab.id); panel.tabIndex = 0;
  tab.addEventListener('click', () => activateTab(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) { event.preventDefault(); activateTab(tabs[next], true); }
  });
});
activateTab(tabs[0]);
document.getElementById('year').textContent = new Date().getFullYear();
const form = document.getElementById('contact-form');
const status = document.getElementById('form-status');
// The native form action also works when JavaScript is disabled.
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity() || form.elements._honey.value) return;
  const submit = form.querySelector('button[type="submit"]');
  if (submit.disabled) return;
  submit.disabled = true;
  status.textContent = 'Submitting your message…';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const data = Object.fromEntries(new FormData(form));
    const response = await fetch(form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/'), {
      method: 'POST', headers: {'Content-Type':'application/json', 'Accept':'application/json'},
      body: JSON.stringify(data), signal: controller.signal
    });
    const result = await response.json();
    if (/activat|confirm.*email|verify.*email/i.test(result.message || '')) {
      status.textContent = 'Email delivery is awaiting activation. Please email me directly using the link below. Your message has been kept here.';
    } else {
      if (!response.ok || (result.success !== true && result.success !== 'true')) throw new Error('Submission was not accepted');
      status.textContent = 'Your message has been submitted. Thank you for getting in touch!';
      form.reset();
    }
  } catch {
    status.textContent = 'Your message could not be confirmed. Please email avnish1234pandeys@gmail.com directly. Your message is still here so you can copy it.';
  } finally { clearTimeout(timeout); submit.disabled = false; }
});
