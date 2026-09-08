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
form.hidden = false;
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const submit = form.querySelector('button[type="submit"]');
  if (submit.disabled) return;
  submit.disabled = true;
  status.textContent = 'Submitting your message…';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    await fetch('https://script.google.com/macros/s/AKfycbw0k2Zmajm5aWasHwzg0Sl0LCeQzoLKyWCwQM-eq3Pbw_Dp3GdLypI_h4L1tepHh5X6yw/exec', {method:'POST', mode:'no-cors', body:new FormData(form), signal:controller.signal});
    // An opaque response from the existing endpoint cannot confirm receipt.
    status.textContent = 'Your request was submitted, but delivery cannot be confirmed. For a reliable follow-up, please email me directly. Your message is kept here so you can copy it.';
  } catch {
    status.textContent = 'Delivery could not be confirmed. Please use the email link instead. Your message is still here so you can copy it.';
  } finally { clearTimeout(timeout); submit.disabled = false; }
});
