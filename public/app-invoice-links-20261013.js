const themeRoot=document.documentElement;
try{themeRoot.dataset.theme=localStorage.getItem('invoicey-theme')==='dark'?'dark':'light'}catch{themeRoot.dataset.theme='light'}
function refreshThemeButtons(){const dark=themeRoot.dataset.theme==='dark';$$('.theme-toggle').forEach(button=>{button.querySelector('.theme-icon').textContent=dark?'☀':'☾';button.querySelector('.theme-label').textContent=dark?'Light mode':'Dark mode';button.setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');button.setAttribute('aria-pressed',String(dark));});}
function toggleTheme(){const dark=themeRoot.dataset.theme!=='dark';themeRoot.dataset.theme=dark?'dark':'light';try{localStorage.setItem('invoicey-theme',dark?'dark':'light')}catch{}refreshThemeButtons();}
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
refreshThemeButtons();
const localISODate = value => { const d=value instanceof Date?value:new Date(value); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const todayISO = () => localISODate(new Date());
const state = { data: null, view: location.hash.slice(1) || 'dashboard', query: '', reportType: 'month', reportStart: '', reportEnd: '', paymentTab: 'customer', quoteFilter: 'all', modal: null, backupStatus: null, access:null };

const iconPaths = {
  grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  invoice:'<path d="M7 3h8l4 4v14H5V3h2Z"/><path d="M14 3v5h5M8 12h8M8 16h8"/>',
  quote:'<path d="M4 5h16M4 10h10M4 15h8"/><path d="m17 15 2 2 3-4"/>',
  box:'<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 8 9 5 9-5M3 8v9l9 5 9-5V8M12 13v9"/>',
  purchase:'<path d="M3 6h2l2.2 10.3a2 2 0 0 0 2 1.7h8.5a2 2 0 0 0 1.9-1.5L21 10H6"/><circle cx="10" cy="21" r="1"/><circle cx="18" cy="21" r="1"/>',
  expense:'<path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 8v6M23 11h-6"/>',
  truck:'<path d="M3 6h12v12H3zM15 10h4l3 4v4h-7"/><circle cx="7.5" cy="19" r="1.5"/><circle cx="18.5" cy="19" r="1.5"/>',
  wallet:'<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18M16 15h2"/>',
  chart:'<path d="M3 3v18h18M7 14l4-4 4 3 6-7"/>',
  report:'<path d="M5 3h10l4 4v14H5V3Z"/><path d="M14 3v5h5M8 12h8M8 16h8"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1a1.8 1.8 0 1 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3 .9v.2a1.8 1.8 0 1 1-3.6 0v-.2a1.8 1.8 0 0 0-3-.9l-.1.1a1.8 1.8 0 1 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-.9-3h-.2a1.8 1.8 0 1 1 0-3.6h.2a1.8 1.8 0 0 0 .9-3l-.1-.1a1.8 1.8 0 1 1 2.5-2.5l.1.1a1.8 1.8 0 0 0 3-.9v-.2a1.8 1.8 0 1 1 3.6 0v.2a1.8 1.8 0 0 0 3 .9l.1-.1a1.8 1.8 0 1 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 .9 3h.2a1.8 1.8 0 1 1 0 3.6h-.2a1.8 1.8 0 0 0-.9 3Z"/>',
  search:'<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/>',
  bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  download:'<path d="M12 3v12M7 10l5 5 5-5M4 19h16"/>',
  print:'<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6z"/>',
  share:'<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.3 10.8 7.4-4.3M8.3 13.2l7.4 4.3"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  arrow:'<path d="M7 17 17 7M7 7h10v10"/>',
  coins:'<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v5c0 1.7 3.6 3 8 3M20 6v5M4 11v5c0 1.7 3.6 3 8 3M20 11v5c0 1.6-3.6 3-8 3"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  receipt:'<path d="M4 3h16v18l-3-2-3 2-2-2-3 2-2-2-3 2V3Z"/><path d="M8 8h8M8 12h8M8 16h4"/>',
  bank:'<path d="m3 9 9-6 9 6M5 10v8M10 10v8M15 10v8M20 10v8M3 21h18M3 18h18"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name] || iconPaths.grid}</svg>`;
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const data = () => state.data || {};
const arr = name => data()[name] || [];
const settings = () => arr('settings')[0] || {company_name:'Your business',currency:'LKR',locale:'en-LK'};
const byId = (list,id) => list.find(item=>item.id===id);
const company = id => byId(arr('companies'),id);
const defaultCompany = () => arr('companies').find(c=>Number(c.is_default)) || arr('companies')[0] || {id:'',name:'Your business'};
const money = value => {
  try { return new Intl.NumberFormat(settings().locale || 'en-LK',{style:'currency',currency:settings().currency||'LKR',maximumFractionDigits:0}).format(Number(value)||0); }
  catch { return `${settings().currency||'LKR'} ${(Number(value)||0).toLocaleString()}`; }
};
const dateFmt = value => {
  if (!value) return '—';
  const d=new Date(`${String(value).slice(0,10)}T00:00:00`);
  return Number.isNaN(+d)?'—':new Intl.DateTimeFormat(settings().locale||'en-LK',{day:'numeric',month:'short',year:'numeric'}).format(d);
};
const dateShort = value => value?new Intl.DateTimeFormat(settings().locale||'en-LK',{day:'numeric',month:'short'}).format(new Date(`${String(value).slice(0,10)}T00:00:00`)):'—';
const dateInput = value => String(value||todayISO()).slice(0,10);
const customer = id => byId(arr('customers'),id);
const supplier = id => byId(arr('suppliers'),id);
const product = id => byId(arr('products'),id);
const invoiceItems = id => arr('invoice_items').filter(x=>x.invoice_id===id);
const quoteItems = id => arr('quotation_items').filter(x=>x.quotation_id===id);
const purchaseItems = id => arr('purchase_items').filter(x=>x.purchase_id===id);
const invoicePaid = id => arr('payments').filter(x=>x.invoice_id===id).reduce((s,x)=>s+Number(x.amount),0);
const purchasePaid = id => arr('supplier_payments').filter(x=>x.purchase_id===id).reduce((s,x)=>s+Number(x.amount),0);
const invoiceBalance = inv => Math.max(0,Number(inv.total)-invoicePaid(inv.id));
const invoiceCredit = inv => Math.max(0,invoicePaid(inv.id)-Number(inv.total));
const invoiceProfit = inv => invoiceItems(inv.id).reduce((s,x)=>s+Number(x.line_total)-Number(x.discount_amount||0)-Number(x.quantity)*Number(x.unit_cost),0)-Math.max(0,Number(inv.discount_amount||0)-invoiceItems(inv.id).reduce((s,x)=>s+Number(x.discount_amount||0),0));
const grossProfit = (start='',end='') => arr('invoices').filter(i=>(!start||i.invoice_date>=start)&&(!end||i.invoice_date<=end)).reduce((s,i)=>s+invoiceProfit(i),0);
const expenseTotal = (start='',end='') => arr('expenses').filter(e=>(!start||e.expense_date>=start)&&(!end||e.expense_date<=end)).reduce((s,e)=>s+Number(e.amount),0);
const netProfit = (start='',end='') => grossProfit(start,end)-expenseTotal(start,end);
const expenseAllocations = expense => {const saved=arr('expense_allocations').filter(item=>item.expense_id===expense?.id);return saved.length?saved:(expense?.project_key?[{expense_id:expense.id,project_key:expense.project_key,amount:Number(expense.amount)||0}]:[]);};
const expenseProjectKeys = expense => expenseAllocations(expense).map(item=>item.project_key);
const expenseProjectAmount = (expense,key) => Number(expenseAllocations(expense).find(item=>item.project_key===key)?.amount||0);
const expenseProjectLabel = expense => {const allocations=expenseAllocations(expense);return allocations.length?allocations.map(item=>`${item.project_key} · ${money(item.amount)}`).join(' / '):'—';};
const expenseInvoiceIds = expense => {const saved=arr('expense_invoices').filter(item=>item.expense_id===expense?.id).map(item=>item.invoice_id).filter(Boolean);return saved.length?saved:(expense?.invoice_id?[expense.invoice_id]:[]);};
const expenseInvoiceLabels = expense => expenseInvoiceIds(expense).map(invoiceId=>{const invoice=byId(arr('invoices'),invoiceId);return invoice?.number||invoiceId;});
const projectCompanySharePercent = key => Number(arr('project_profit_settings').find(item=>item.project_key===key)?.company_share_percent||0);
function distributionSummary(start='',end=''){
  const projectProfit=new Map();
  for(const invoice of arr('invoices').filter(item=>inRange(item.invoice_date,start,end)))projectProfit.set(invoice.project_key,(projectProfit.get(invoice.project_key)||0)+invoiceProfit(invoice));
  for(const expense of arr('expenses').filter(item=>inRange(item.expense_date,start,end)))for(const allocation of expenseAllocations(expense))projectProfit.set(allocation.project_key,(projectProfit.get(allocation.project_key)||0)-Number(allocation.amount));
  const companyRetained=[...projectProfit].reduce((sum,[key,profit])=>sum+Math.max(0,profit)*projectCompanySharePercent(key)/100,0),total=netProfit(start,end);
  return {total,companyRetained,distributable:Math.max(0,total-companyRetained)};
}
const supplierBalance = id => Math.max(0,arr('purchases').filter(p=>p.supplier_id===id).reduce((s,p)=>s+Number(p.total),0)-arr('supplier_payments').filter(p=>p.supplier_id===id).reduce((s,p)=>s+Number(p.amount),0));
const supplierCredit = id => Math.max(0,arr('supplier_payments').filter(p=>p.supplier_id===id).reduce((s,p)=>s+Number(p.amount),0)-arr('purchases').filter(p=>p.supplier_id===id).reduce((s,p)=>s+Number(p.total),0));
const monthStart = () => `${todayISO().slice(0,7)}-01`;
const yearStart = () => `${todayISO().slice(0,4)}-01-01`;
const inRange = (value,start,end) => (!start||value>=start)&&(!end||value<=end);
const statusText = value => ({open:'Pending',paid:'Paid',partial:'Partially paid',overpaid:'Credit balance','low-stock':'Low stock','in-stock':'In stock','stock-in':'Stock in','stock-out':'Stock out',accepted:'Accepted',sent:'Sent',draft:'Draft',expired:'Expired'})[String(value||'').toLowerCase()] || value || '—';
const statusClass = value => `status-${String(value||'available').toLowerCase().replaceAll(' ','-')}`;
const badge = value => `<span class="status-pill ${statusClass(value)}">${esc(statusText(value))}</span>`;
const initials = value => String(value||'?').split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase();
const avatarClass = value => `avatar-${(String(value||'').charCodeAt(0)||65)%4}`;
const apiBase = String(globalThis.INVOICEY_API_BASE_URL||'').trim().replace(/\/+$/,'');
const apiUrl = url => apiBase && String(url).startsWith('/api/') ? apiBase+url : url;
let hostedApiUnavailable = false;
const requestFetch = async (url, options = {}) => {
  if(!apiBase || hostedApiUnavailable)return fetch(url,{...options,credentials:'same-origin'});
  try{return await fetch(apiUrl(url),{...options,credentials:'include'});}
  catch(error){
    hostedApiUnavailable=true;
    console.warn('Hosted API unavailable; using the private local workspace.',error?.message||error);
    return fetch(url,{...options,credentials:'same-origin'});
  }
};
const api = async (url,method='GET',body) => {
  const response=await requestFetch(url,{method,headers:body?{'content-type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
  const result=await response.json().catch(()=>({error:'The server returned an unreadable response.'}));
  if(!response.ok)throw new Error(result.error||'The request could not be completed.');
  return result;
};
function renderAccessGate(status){
  document.body.classList.add('access-locked');$('#accessRoot').hidden=false;
  const legacy=status.legacyCompany||{};
  const companyFields='<div class="auth-fields"><label>Company name<input name="companyName" required maxlength="160" value="'+esc(legacy.name||'')+'" autofocus></label><label>Business address <span class="field-hint">Optional — you can complete the profile later</span><input name="address" maxlength="500" value="'+esc(legacy.address||'')+'"></label><label>Company email <span class="field-hint">Optional</span><input name="email" type="email" maxlength="180" value="'+esc(legacy.email||'')+'"></label></div>';
  const adminFields='<section class="auth-admin-block"><h3>Main administrator</h3><p class="setup-help">This is the only account needed to start. Create additional users and permissions later from Administrator Control Panel.</p><label>Full name<input name="adminDisplayName" required maxlength="120" autocomplete="name"></label><label>Username or email<input name="adminUsername" required minlength="3" maxlength="120" autocomplete="username"></label><label>Account email for verification and password recovery<input name="accountEmail" type="email" required maxlength="254" autocomplete="email"></label><button class="button" type="button" data-action="request-registration-otp">Email me a verification code</button><p class="setup-help" id="registrationOtpStatus" aria-live="polite">Verify your email before creating the workspace.</p><label>Six-digit email code<input name="emailOtp" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" minlength="6" maxlength="6" required></label><label>Password (12 characters minimum)<input name="adminPassword" type="password" required minlength="12" maxlength="128" autocomplete="new-password"></label><label>Confirm password<input name="adminPasswordConfirm" type="password" required minlength="12" maxlength="128" autocomplete="new-password"></label></section>';
  const login=status.authenticated?false:status.setupRequired?false:true;
  let page;
  if(status.setupRequired){page='<section class="access-card setup-card"><div class="access-brand"><span class="brand-mark"><span></span><span></span><span></span></span><strong>itsme invoicey</strong></div><p class="eyebrow">FIRST-TIME SETUP</p><h1>Set up your business</h1><p class="access-intro">Enter the essentials to create your company workspace. You can add bank details, logo, tax settings and other users after signing in.</p><form id="setupForm"><h2>Company profile</h2>'+companyFields+adminFields+'<div class="auth-error" id="accessError" role="alert"></div><button class="button primary auth-submit" type="submit">Create company and secure workspace</button><p class="auth-footnote">Your password is stored securely. Email verification is required before setup can continue.</p></form></section>';}
  else if(login){page='<section class="access-card login-card"><div class="access-brand"><span class="brand-mark"><span></span><span></span><span></span></span><strong>itsme invoicey</strong></div><p class="eyebrow">SECURE BUSINESS WORKSPACE</p><h1>Sign in</h1><p class="access-intro">Sign in with your company account or super administrator account.</p><form id="loginForm"><label>Username<input name="username" required autocomplete="username" autofocus></label><label>Password<input name="password" required type="password" autocomplete="current-password"></label><div class="auth-error" id="accessError" role="alert"></div><button class="button primary auth-submit" type="submit">Sign in</button></form><button class="auth-link" data-action="show-signup" type="button">New here? Sign up</button><button class="auth-link" data-action="show-recovery" type="button">Forgot password? Get a code by email</button></section>';}
  else{page='<section class="access-card login-card"><div class="access-brand"><span class="brand-mark"><span></span><span></span><span></span></span><strong>itsme invoicey</strong></div><p class="eyebrow">SECURE BUSINESS WORKSPACE</p><h1>Sign in</h1><p class="access-intro">Sign in with your company account or super administrator account.</p><form id="loginForm"><label>Username<input name="username" required autocomplete="username" autofocus></label><label>Password<input name="password" required type="password" autocomplete="current-password"></label><div class="auth-error" id="accessError" role="alert"></div><button class="button primary auth-submit" type="submit">Sign in</button></form><button class="auth-link" data-action="show-signup" type="button">New here? Sign up</button><button class="auth-link" data-action="show-recovery" type="button">Forgot password? Get a code by email</button></section>';}
  $('#accessRoot').innerHTML=page;
}
async function refresh(render=true){
  const auth=await api('/api/auth/status');state.access=auth;
  if(auth.setupRequired||!auth.authenticated){state.data=null;renderAccessGate(auth);return;}
  document.body.classList.remove('access-locked');$('#accessRoot').hidden=true;
  state.data=await api('/api/bootstrap');state.backupStatus=await api('/api/backup/status').catch(()=>null);
  $('#companyLabel').textContent=defaultCompany().name;
  $('#profileName').textContent=auth.user.displayName;$('#profileRole').textContent=(auth.user.role||'Company account').replaceAll('_',' ');$('#profileInitial').textContent=initials(auth.user.displayName);
  const low=arr('products').filter(p=>Number(p.quantity)<=Number(p.reorder_level)).length;
  $('#stockCount').textContent=low||'';$('#invoiceCount').textContent=arr('invoices').filter(i=>invoiceBalance(i)>0).length||'';
  $('#notificationButton').classList.toggle('has-alert',low>0);
  if(render) renderPage();
}
const setView = view => { state.view=view; state.query=''; $('#globalSearch').value=''; renderGlobalSearch(''); if(location.hash!=='#'+view)location.hash=view; renderPage(); $('#sidebar').classList.remove('open'); };
const headerNames={dashboard:'Overview',invoices:'Invoices',quotations:'Quotations',projects:'Projects',inventory:'Inventory',services:'Services',purchases:'Purchases',expenses:'Expenses',customers:'Customers',suppliers:'Suppliers',payments:'Payments',profits:'Profit sharing',reports:'Reports',settings:'Company Settings',backup:'Backup & Restore',admin:'Administrator Control Panel',about:'About software'};
function renderPage(){
  if(!state.data)return;
  const scopeForView={dashboard:'dashboard',invoices:'invoices',quotations:'quotations',projects:'quotations',inventory:'inventory',services:'services',purchases:'purchases',expenses:'expenses',customers:'customers',suppliers:'suppliers',payments:'payments',profits:'profit',reports:'reports',settings:'companies',backup:'backup',admin:'users',about:null};
  const isSuper=!!state.access?.user?.isSuper,mayOpen=view=>isSuper||view==='about'||(view==='admin'?!!state.access?.permissions?.users?.manage:!!state.access?.permissions?.[scopeForView[view]]?.view);
  if(!mayOpen(state.view)){state.view=Object.keys(scopeForView).find(mayOpen)||'dashboard';if(location.hash!=='#'+state.view)location.hash=state.view;}
  $$('.nav-item[data-view]').forEach(a=>a.classList.toggle('active',a.dataset.view===state.view));
  $$('.primary-nav [data-view],.settings-link[data-view],.about-link[data-view]').forEach(a=>{const scope=scopeForView[a.dataset.view],ok=state.access?.user?.isSuper||a.dataset.view==='about'||(a.dataset.view==='admin'?!!state.access?.permissions?.users?.manage:!!state.access?.permissions?.[scope]?.view);a.hidden=!ok;});
  const navLabels=$$('.primary-nav .nav-label');for(const label of navLabels){let next=label.nextElementSibling,shown=false;while(next&&!next.classList.contains('nav-label')){if(next.matches('a.nav-item')&&!next.hidden)shown=true;next=next.nextElementSibling;}label.hidden=!shown;}
  const switcher=$('.workspace-switcher');if(switcher)switcher.hidden=(state.access?.companies||[]).length<2&&!state.access?.user?.isSuper;
  const adminLink=$('[data-view="admin"]');if(adminLink)adminLink.hidden=!(state.access?.user?.isSuper||state.access?.permissions?.users?.manage);
  $('#pageBreadcrumb').textContent=headerNames[state.view]||'Overview';
  const views={dashboard:renderDashboard,invoices:renderInvoices,quotations:renderQuotations,projects:renderProjects,inventory:renderInventory,services:renderServices,purchases:renderPurchases,expenses:renderExpenses,customers:renderCustomers,suppliers:renderSuppliers,payments:renderPayments,profits:renderProfits,reports:renderReports,settings:renderSettings,backup:renderBackup,admin:renderAdmin,about:renderAbout};
  $('#pageContent').innerHTML=(views[state.view]||renderDashboard)();
  if(state.view==='admin')loadAdminLists();if(state.view==='backup')loadBackupHistory();
  applySearch(state.query);
  if(state.modal?.restore){const sel=state.modal.restore;const el=$(sel);if(el){el.focus();if(el.setSelectionRange&&el.value)el.setSelectionRange(el.value.length,el.value.length);}}
  $$('.nav-icon').forEach(node=>node.innerHTML=icon(node.dataset.icon));
  $$('.search-symbol').forEach(node=>node.innerHTML=icon('search'));
}
function pageHeading(title,description,actions='') { return `<div class="page-heading"><div><div class="eyebrow">${esc(defaultCompany().name)}</div><h1>${title}</h1><p>${description}</p></div><div class="heading-actions">${actions}</div></div>`; }
function metric(title,value,iconName,kind='',foot='',footClass='') { return `<div class="metric-card"><div class="metric-top"><span>${title}</span><span class="metric-icon ${kind}">${icon(iconName)}</span></div><div class="metric-value">${value}</div><div class="metric-foot">${foot?`<span class="${footClass}">${foot}</span>`:''}</div></div>`; }
function table(headers,rows,empty='Nothing here yet.'){return `<div class="table-scroll"><table class="data-table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.join(''):`<tr><td colspan="${headers.length}"><div class="empty-row">${empty}</div></td></tr>`}</tbody></table></div>`;}
function makeSearch(value='Search records…'){return `<div class="mini-search"><span>${icon('search')}</span><input class="table-search" placeholder="${value}" value="${esc(state.query)}" aria-label="Search records"></div>`;}
function tableToolbar(searchLabel='',select=''){return `<div class="toolbar">${makeSearch(searchLabel||'Search records…')}<div class="toolbar-spacer"></div>${select}<span class="record-count">${state.data? '':''}</span></div>`;}
function normalizeSearch(value){return String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();}
function searchMatches(fields,query){
  const needle=normalizeSearch(query).trim();if(!needle)return true;
  const digits=needle.replace(/\D/g,'');
  return fields.some(value=>{const text=normalizeSearch(value);return text.includes(needle)||(digits.length>=3&&/^[+\d\s().-]+$/.test(needle)&&text.replace(/\D/g,'').includes(digits));});
}
function searchFields(view,record){
  const values=Object.entries(record).filter(([key,value])=>!key.endsWith('_data')&&typeof value!=='object').map(([,value])=>value);
  const add=party=>{if(party)values.push(party.name,party.phone,party.email,party.address);};
  add(customer(record.customer_id));add(supplier(record.supplier_id));
  if(record.company_id)values.push(company(record.company_id)?.name);
  const lines=view==='invoices'?invoiceItems(record.id):view==='quotations'?quoteItems(record.id):view==='purchases'?purchaseItems(record.id):[];
  for(const line of lines){const item=product(line.product_id);values.push(line.description,line.item_code,line.service_title,line.service_description,item?.name,item?.sku,item?.description);}
  if(view==='payments'){values.push(byId(arr('invoices'),record.invoice_id)?.number,byId(arr('purchases'),record.purchase_id)?.number);}
  if(view==='expenses')values.push(...arr('expense_attachments').filter(a=>a.expense_id===record.id).map(a=>a.file_name));
  return values.filter(value=>value!==null&&value!==undefined);
}
function searchRow(view,record){return ' data-search="'+esc(JSON.stringify(searchFields(view,record)))+'"';}
function globalSearchMatches(query){
  const needle=normalizeSearch(query.trim()),matches=[];if(!needle)return matches;let order=0;
  const add=(view,title,type,detail,fields,tab='')=>{const normalized=fields.map(normalizeSearch),match=normalized.find(value=>searchMatches([value],needle));if(match!==undefined){const titleMatch=normalizeSearch(title);matches.push({view,title,type,detail,tab,score:titleMatch.startsWith(needle)?0:match.startsWith(needle)?1:2,order:order++});}};
  for(const c of arr('customers'))add('customers',c.name,'Customer',[c.phone,c.email,c.address].filter(Boolean).join(' · '),[c.name,c.phone,c.email,c.address]);
  for(const i of arr('invoices')){const c=customer(i.customer_id),lines=invoiceItems(i.id).flatMap(x=>[x.description,x.item_code,x.service_title,x.service_description,product(x.product_id)?.name,product(x.product_id)?.sku]);add('invoices',i.number,'Invoice',[c?.name,i.project_key,money(i.total),dateFmt(i.invoice_date)].filter(Boolean).join(' · '),[i.number,i.project_key,i.status,c?.name,c?.phone,c?.email,c?.address,company(i.company_id)?.name,i.invoice_date,i.due_date,i.notes,i.terms,...lines]);}
  for(const q of arr('quotations')){const c=customer(q.customer_id),lines=quoteItems(q.id).flatMap(x=>[x.description,x.item_code,x.service_title,x.service_description,product(x.product_id)?.name,product(x.product_id)?.sku]);add('quotations',q.number,q.document_type==='estimate'?'Estimate':'Quotation',[c?.name,q.project_key,money(q.total),dateFmt(q.quote_date)].filter(Boolean).join(' · '),[q.number,q.project_key,q.status,q.document_type,c?.name,c?.phone,c?.email,c?.address,company(q.company_id)?.name,q.quote_date,q.valid_until,q.notes,q.terms,...lines]);}
  for(const p of arr('products'))add('inventory',p.name,'Product',[p.sku,p.category,Number(p.quantity)+' in stock'].join(' · '),[p.name,p.sku,p.category,p.description,p.unit,p.quantity,p.purchase_price,p.selling_price]);
  for(const s of arr('services'))add('services',s.title,'Service',[s.code,s.description,money(s.unit_price)].filter(Boolean).join(' · '),[s.title,s.code,s.description,s.unit_price,s.unit_cost]);
  for(const s of arr('suppliers'))add('suppliers',s.name,'Supplier',[s.phone,s.email,s.address].filter(Boolean).join(' · '),[s.name,s.phone,s.email,s.address]);
  for(const e of arr('expenses')){const invoices=expenseInvoiceLabels(e);add('expenses',e.description,'Expense',[invoices.join(', '),e.category,money(e.amount),dateFmt(e.expense_date)].filter(Boolean).join(' · '),[e.description,e.category,...invoices,...expenseInvoiceIds(e),e.notes,e.payment_method,e.expense_date,supplier(e.supplier_id)?.name,customer(e.customer_id)?.name]);}
  for(const p of arr('purchases')){const vendor=supplier(p.supplier_id),lines=purchaseItems(p.id).map(line=>product(line.product_id)?.name||'');add('purchases',p.number,'Purchase',[vendor?.name,money(p.total),dateFmt(p.purchase_date)].filter(Boolean).join(' · '),[p.number,vendor?.name,vendor?.phone,vendor?.email,vendor?.address,p.purchase_date,p.status,p.notes,...lines]);}
  for(const p of arr('payments')){const c=customer(p.customer_id),i=byId(arr('invoices'),p.invoice_id);add('payments',i?.number||c?.name||'Customer receipt','Receipt',[c?.name,money(p.amount),p.method,dateFmt(p.payment_date)].filter(Boolean).join(' · '),[i?.number,c?.name,c?.phone,c?.email,p.method,p.reference,p.notes,p.payment_date,p.amount],'customer');}
  for(const p of arr('supplier_payments')){const s=supplier(p.supplier_id),purchase=byId(arr('purchases'),p.purchase_id);add('payments',purchase?.number||s?.name||'Supplier payment','Supplier payment',[s?.name,money(p.amount),p.method,dateFmt(p.payment_date)].filter(Boolean).join(' · '),[purchase?.number,s?.name,s?.phone,s?.email,p.method,p.reference,p.notes,p.payment_date,p.amount],'supplier');}
  for(const p of arr('projects')){const s=projectSummary(p.project_key);add('projects',p.project_key,'Project',[p.title,customer(p.customer_id)?.name,money(s.revenue)+' revenue',money(s.profit)+' profit'].filter(Boolean).join(' · '),[p.project_key,p.title,customer(p.customer_id)?.name,customer(p.customer_id)?.phone,customer(p.customer_id)?.address]);}
  matches.sort((a,b)=>a.score-b.score||a.order-b.order);return matches.slice(0,12);
}
function renderGlobalSearch(query){
  const panel=$('#globalSearchResults');if(!panel)return;const value=String(query||'').trim();if(!value){panel.hidden=true;panel.innerHTML='';$('#globalSearch')?.setAttribute('aria-expanded','false');return;}
  const matches=globalSearchMatches(value);panel.innerHTML=matches.length?matches.map(item=>'<button type="button" class="global-result" role="option" data-global-result data-view="'+esc(item.view)+'" data-value="'+esc(item.title)+'" data-tab="'+esc(item.tab)+'"><span class="global-result-type">'+esc(item.type)+'</span><span class="global-result-copy"><strong>'+esc(item.title)+'</strong><small>'+esc(item.detail)+'</small></span></button>').join(''):'<div class="global-search-empty">No matching business records.</div>';panel.hidden=false;$('#globalSearch')?.setAttribute('aria-expanded','true');
}
function chartMarkup(){
  const days=[];for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);days.push(localISODate(d));}
  const sales=days.map(d=>arr('invoices').filter(i=>i.invoice_date===d).reduce((s,i)=>s+Number(i.total),0));
  const buys=days.map(d=>arr('purchases').filter(i=>i.purchase_date===d).reduce((s,i)=>s+Number(i.total),0));
  const max=Math.max(...sales,...buys,1),hasData=sales.some(Boolean)||buys.some(Boolean);
  return `<div class="panel chart-panel"><div class="panel-header"><div><div class="panel-title">Sales & purchases</div><div class="panel-subtitle">A simple view of money moving through your business</div></div><div class="chart-legend"><span class="legend-dot"></span>Sales <span class="legend-dot" style="background:#d6eae2;margin-left:7px"></span>Purchases</div></div><div class="chart-wrap"><div class="chart-grid"><div class="chart-ylabels"><span>${money(max).replace(/\s/g,'')}</span><span>${money(max*.66).replace(/\s/g,'')}</span><span>${money(max*.33).replace(/\s/g,'')}</span><span>0</span></div>${days.map((d,i)=>`<div class="bar-group"><div class="bar-stack"><div class="bar-secondary" style="height:${Math.max(0,buys[i]/max*94)}%"></div><div class="bar-primary" style="height:${Math.max(0,sales[i]/max*94)}%"></div></div><span class="bar-label">${new Intl.DateTimeFormat('en',{weekday:'short'}).format(new Date(`${d}T00:00:00`))}</span></div>`).join('')}${!hasData?'<span class="chart-zero">Your first sales and purchases will appear here.</span>':''}</div></div></div>`;
}
function renderDashboard(){
  const start=monthStart(),end=todayISO(),salesToday=arr('invoices').filter(i=>i.invoice_date===end).reduce((s,i)=>s+Number(i.total),0),receivables=arr('invoices').reduce((s,i)=>s+invoiceBalance(i),0),inventoryValue=arr('products').reduce((s,p)=>s+Number(p.quantity)*Number(p.purchase_price),0),salesMonth=arr('invoices').filter(i=>inRange(i.invoice_date,start,end)).reduce((s,i)=>s+Number(i.total),0),profit=netProfit(start,end),expenses=expenseTotal(start,end);
  const low=arr('products').filter(p=>Number(p.quantity)<=Number(p.reorder_level)).sort((a,b)=>a.quantity-b.quantity);
  const recent=[...arr('invoices')].sort((a,b)=>b.invoice_date.localeCompare(a.invoice_date)||b.created_at.localeCompare(a.created_at)).slice(0,5);
  const topCustomers=arr('customers').map(c=>({customer:c,total:arr('invoices').filter(i=>i.customer_id===c.id).reduce((s,i)=>s+Number(i.total),0)})).filter(c=>c.total>0).sort((a,b)=>b.total-a.total).slice(0,4);
  const greeting=new Date().getHours()<12?'Good morning':new Date().getHours()<18?'Good afternoon':'Good evening';
  const actions=`<div class="dashboard-filter"><span class="date-label">${dateFmt(todayISO())}</span></div><button class="button" data-action="new-quote"><span class="plus">+</span> New quote</button><button class="button primary" data-action="new-invoice"><span class="plus">+</span> Create invoice</button>`;
  const chart=chartMarkup();
  return `${pageHeading(`${greeting}.`,'Here’s what’s happening across your business today.',actions)}
    <section class="kpi-grid">${metric('Sales today',money(salesToday),'receipt','','This month · '+money(salesMonth))}${metric('Net profit this month',money(profit),'chart','blue',profit<0?'Below break-even':'After '+money(expenses)+' in expenses',profit<0?'down':'up')}${metric('To collect',money(receivables),'wallet','gold',arr('invoices').filter(i=>invoiceBalance(i)>0).length+' invoices need attention','')}${metric('Inventory at cost',money(inventoryValue),'box','red',arr('products').length+' products · '+low.length+' below reorder level','') }</section>
    <section class="content-grid">${chart}<div class="panel summary-panel"><div class="panel-header"><div><div class="panel-title">A closer look</div><div class="panel-subtitle">Your month at a glance</div></div><span class="panel-head-meta">${new Intl.DateTimeFormat('en',{month:'short',year:'numeric'}).format(new Date())}</span></div>
      <div class="summary-item"><span class="summary-icon">${icon('receipt')}</span><div class="summary-copy"><span>Sales revenue</span><strong>${money(salesMonth)}</strong></div><span class="summary-arrow">↗</span></div><div class="summary-divider"></div>
      <div class="summary-item"><span class="summary-icon orange">${icon('purchase')}</span><div class="summary-copy"><span>Purchases received</span><strong>${money(arr('purchases').filter(x=>inRange(x.purchase_date,start,end)).reduce((s,x)=>s+Number(x.total),0))}</strong></div><span class="summary-arrow">↗</span></div><div class="summary-divider"></div>
      <div class="summary-item"><span class="summary-icon red">${icon('expense')}</span><div class="summary-copy"><span>Operating expenses</span><strong>${money(expenses)}</strong></div><span class="summary-arrow">↗</span></div><div class="summary-divider"></div>
      <div class="summary-item"><span class="summary-icon blue">${icon('bank')}</span><div class="summary-copy"><span>Supplier balances</span><strong>${money(arr('suppliers').reduce((s,x)=>s+supplierBalance(x.id),0))}</strong></div><span class="summary-arrow">↗</span></div>
    </div></section>
    <section class="lower-grid"><div class="panel table-panel"><div class="panel-header"><div><div class="panel-title">Recent invoices</div><div class="panel-subtitle">The latest activity from your customers</div></div><div class="panel-controls"><a class="text-link" href="#invoices" data-view="invoices">View all <span>→</span></a></div></div>
      ${table(['INVOICE','CUSTOMER','DATE','AMOUNT','STATUS',''],recent.map(inv=>`<tr><td class="table-primary">${esc(inv.number)}</td><td>${esc(customer(inv.customer_id)?.name||'Deleted customer')}</td><td>${dateFmt(inv.invoice_date)}</td><td class="amount-cell">${money(inv.total)}</td><td>${badge(invoiceBalance(inv)>0?'open':invoicePaid(inv)>inv.total?'overpaid':'paid')}</td><td><button class="row-action" data-action="print-invoice" data-id="${inv.id}" title="Print invoice">↗</button></td></tr>`),'No invoices yet. Create an invoice to see your sales here.')}
    </div><div class="panel"><div class="panel-header"><div><div class="panel-title">Stock to watch</div><div class="panel-subtitle">Products at or below their reorder level</div></div><a class="text-link" href="#inventory" data-view="inventory">All stock →</a></div><div class="low-stock-list">${low.length?low.slice(0,5).map(p=>`<div class="low-stock-row"><span class="low-stock-symbol">${icon('box')}</span><div class="low-stock-copy"><strong>${esc(p.name)}</strong><small>${esc(p.sku)} · reorder at ${p.reorder_level}</small></div><span class="low-stock-qty">${p.quantity}<small>${esc(p.unit||'in stock')}</small></span></div>`).join(''):'<div class="empty-row">Everything is comfortably in stock.</div>'}</div></div></section>
    <section class="panel" style="margin-top:14px"><div class="panel-header"><div><div class="panel-title">Customers to know</div><div class="panel-subtitle">Your highest lifetime sales</div></div><a class="text-link" href="#customers" data-view="customers">All customers →</a></div><div class="bar-list" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px">${topCustomers.length?topCustomers.map((x,i)=>`<div class="bar-list-item"><span class="mini-avatar ${avatarClass(x.customer.name)}">${initials(x.customer.name)}</span><div class="bar-list-copy"><strong>${esc(x.customer.name)}</strong><small>${arr('invoices').filter(inv=>inv.customer_id===x.customer.id).length} invoices</small></div><span class="rank-value">${money(x.total)}</span></div>`).join(''):'<div class="empty-row" style="grid-column:1/-1">Your customer sales will appear here.</div>'}</div></section>`;
}

function invoiceEditLockReason(invoice){
  if(!invoice)return 'Invoice not found.';
  if(invoice.quotation_id)return 'This invoice was converted from a quotation and is locked. Edit the original quotation before conversion.';
  if(invoicePaid(invoice.id)>0)return 'This invoice already has a payment and is locked. Delete or reverse the payment before editing.';
  if(arr('expenses').some(e=>expenseInvoiceIds(e).includes(invoice.id)))return 'This invoice has a linked expense and is locked to protect accounting history.';
  return '';
}
function invoiceCanEdit(invoice){return !invoiceEditLockReason(invoice);}

function renderInvoices(){
  const items=[...arr('invoices')].sort((a,b)=>b.invoice_date.localeCompare(a.invoice_date));
  const toolbar=`<div class="toolbar">${makeSearch('Invoice number or customer')}<select class="filter-select" id="invoiceStatusFilter"><option value="all">All statuses</option><option value="open">Awaiting payment</option><option value="partial">Partially paid</option><option value="paid">Paid</option><option value="overpaid">Credit balance</option></select><span class="toolbar-spacer"></span><span class="panel-head-meta">${items.length} invoices</span></div>`;
  return `${pageHeading('Invoices','Create, follow up and print customer invoices.',`<button class="button" data-action="new-quote"><span class="plus">+</span> New quote</button><button class="button primary" data-action="new-invoice"><span class="plus">+</span> Create invoice</button>`)}${toolbar}<div class="table-card" id="invoiceTable">${table(['INVOICE','PROJECT KEY','COMPANY','CUSTOMER','ISSUED','DUE DATE','TOTAL','RECEIVED','STATUS','ACTIONS'],items.map(inv=>{const c=customer(inv.customer_id),editable=invoiceCanEdit(inv);return `<tr${searchRow('invoices',inv)} data-status="${inv.status}"><td><span class="table-primary">${esc(inv.number)}</span><span class="table-secondary">${invoiceItems(inv.id).length} lines</span></td><td><button class="text-link" data-action="project-detail" data-key="${esc(inv.project_key)}">${esc(inv.project_key||'—')}</button></td><td>${esc(company(inv.company_id)?.name||'—')}</td><td>${esc(c?.name||'—')}</td><td>${dateFmt(inv.invoice_date)}</td><td>${dateFmt(inv.due_date)}</td><td class="amount-cell">${money(inv.total)}</td><td class="amount-cell">${money(invoicePaid(inv.id))}</td><td>${badge(inv.status)}</td><td><button class="row-action" data-action="print-invoice" data-id="${inv.id}" title="Open invoice">↗</button> ${editable?`<button class="row-action" data-action="edit-invoice" data-id="${inv.id}" title="Edit invoice">✎</button>`:''} ${invoiceBalance(inv.id)>0?`<button class="row-action" data-action="record-payment" data-id="${inv.id}" title="Record payment">＋</button>`:''} <button class="row-action danger-action" data-action="delete-invoice" data-id="${inv.id}" title="Delete invoice">×</button></td></tr>`}), 'Your invoices will appear here. Products reduce stock; service lines do not.')}</div><div class="table-meta"><span>Unpaid invoices can be edited safely. Paid, converted or expense-linked invoices remain locked to protect accounting history.</span><span>Outstanding: ${money(arr('invoices').reduce((s,i)=>s+invoiceBalance(i),0))}</span></div>`;
}

function renderQuotations(){
  const list=[...arr('quotations')].sort((a,b)=>b.quote_date.localeCompare(a.quote_date));
  return `${pageHeading('Quotations & estimates','Prepare customer offers and track project costs from the first estimate.',`<button class="button primary" data-action="new-quote"><span class="plus">+</span> New document</button>`)}<div class="toolbar">${makeSearch('Document number, project key or customer')}<select class="filter-select" id="quoteStatusFilter"><option value="all">All statuses</option><option value="draft">Draft</option><option value="sent">Sent</option><option value="accepted">Accepted</option></select><span class="toolbar-spacer"></span><span class="panel-head-meta">${list.length} documents</span></div><div class="table-card" id="quoteTable">${table(['DOCUMENT','PROJECT KEY','COMPANY','CUSTOMER','CREATED','VALID UNTIL','TOTAL','STATUS','ACTIONS'],list.map(q=>`<tr${searchRow('quotations',q)} data-status="${esc(q.status)}"><td><span class="table-primary">${esc(q.document_type==='estimate'?'Estimate':'Quotation')} · ${esc(q.number)}</span></td><td><button class="text-link" data-action="project-detail" data-key="${esc(q.project_key)}">${esc(q.project_key||'—')}</button></td><td>${esc(company(q.company_id)?.name||'—')}</td><td>${esc(customer(q.customer_id)?.name||'—')}</td><td>${dateFmt(q.quote_date)}</td><td>${dateFmt(q.valid_until)}</td><td class="amount-cell">${money(q.total)}</td><td>${badge(q.status)}</td><td>${q.invoice_id?`<button class="row-action" data-action="print-invoice" data-id="${q.invoice_id}" title="Open invoice">↗</button>`:`<button class="row-action" data-action="print-quote" data-id="${q.id}" title="Print">↗</button> <button class="row-action" data-action="edit-quote" data-id="${q.id}" title="Edit">✎</button> <button class="row-action" data-action="convert-quote" data-id="${q.id}" title="Convert to invoice">⇢</button> <button class="row-action danger-action" data-action="delete-quote" data-id="${q.id}" title="Delete quotation">×</button>`}</td></tr>`),'No quotations or estimates yet. Create one to generate a Project Key and start tracking connected costs.')}</div><div class="table-meta"><span>Product stock is checked and reduced on conversion. Service lines never affect stock.</span><span>Accepted value: ${money(arr('quotations').filter(x=>x.status==='accepted').reduce((s,x)=>s+Number(x.total),0))}</span></div>`;
}

function renderInventory(){
  const list=[...arr('products')].sort((a,b)=>a.name.localeCompare(b.name));
  const categories=[...new Set(arr('products').map(p=>p.category))].sort();
  return `${pageHeading('Inventory','Track available stock, product costs and selling prices.',`<button class="button" data-action="stock-adjust"><span class="plus">±</span> Stock in / out</button><button class="button primary" data-action="new-product"><span class="plus">+</span> Add product</button>`)}<div class="report-grid">${metric('Products',arr('products').length,'box','','Catalog items','')}${metric('Units on hand',arr('products').reduce((s,p)=>s+Number(p.quantity),0).toLocaleString(),'purchase','blue',arr('products').filter(p=>Number(p.quantity)<=Number(p.reorder_level)).length+' need a restock','')}${metric('Inventory at cost',money(arr('products').reduce((s,p)=>s+Number(p.quantity)*Number(p.purchase_price),0)),'coins','gold','Current weighted average cost','') }</div><div class="toolbar">${makeSearch('Product name, SKU or category')}<select class="filter-select" id="inventoryFilter"><option value="all">All stock levels</option><option value="low">Low stock</option><option value="available">In stock</option></select><select class="filter-select" id="categoryFilter"><option value="all">All categories</option>${categories.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`)}</select><span class="toolbar-spacer"></span><span class="panel-head-meta">${list.length} products</span></div><div class="table-card" id="inventoryTable">${table(['PRODUCT','SKU','CATEGORY','ON HAND','PURCHASE PRICE','SELLING PRICE','MARGIN / UNIT','ACTIONS'],list.map(p=>{const low=Number(p.quantity)<=Number(p.reorder_level);const margin=Number(p.selling_price)-Number(p.purchase_price),pct=p.selling_price?margin/Number(p.selling_price)*100:0;return `<tr${searchRow('inventory',p)} data-stock="${low?'low':'available'}" data-category="${esc(p.category)}"><td><div class="stock-product"><span class="product-art ${['','blue','gold','rose','green'][Math.abs(p.name.charCodeAt(0))%5]}">${icon('box')}</span><span><span class="table-primary">${esc(p.name)}</span><span class="table-secondary">${esc(p.unit||'each')} · reorder at ${p.reorder_level}</span></span></div></td><td>${esc(p.sku)}</td><td>${esc(p.category)}</td><td><span class="table-primary">${Number(p.quantity).toLocaleString()}</span><div class="stock-track"><i class="${low?'low':''}" style="width:${Math.min(100,Number(p.quantity)/Math.max(Number(p.reorder_level)*3,1)*100)}%"></i></div></td><td>${money(p.purchase_price)}</td><td class="amount-cell">${money(p.selling_price)}</td><td><span class="${margin<0?'profit-negative':'profit-positive'}">${money(margin)}</span><span class="table-secondary">${pct.toFixed(0)}% margin</span></td><td><button class="row-action" data-action="edit-product" data-id="${p.id}" title="Edit product">✎</button> <button class="row-action" data-action="stock-adjust" data-id="${p.id}" title="Adjust stock">±</button> <button class="row-action" data-action="stock-history" data-id="${p.id}" title="Stock movement history">◷</button> <button class="row-action danger-action" data-action="delete-product" data-id="${p.id}" title="Delete product">×</button></td></tr>`}), 'Add a product to start building your inventory.')}</div><div class="table-meta"><span>Purchase costs use a weighted average after each recorded purchase.</span><span>Potential gross margin: ${money(arr('products').reduce((s,p)=>s+Math.max(0,Number(p.selling_price)-Number(p.purchase_price))*Number(p.quantity),0))}</span></div>`;
}

function renderPurchases(){
  const list=[...arr('purchases')].sort((a,b)=>b.purchase_date.localeCompare(a.purchase_date));
  return `${pageHeading('Purchases','Receive supplier orders, update on-hand stock and follow supplier balances.',`<button class="button primary" data-action="new-purchase"><span class="plus">+</span> Record purchase</button>`)}<div class="report-grid">${metric('Purchases this month',money(arr('purchases').filter(p=>inRange(p.purchase_date,monthStart(),todayISO())).reduce((s,p)=>s+Number(p.total),0)),'purchase','','Stock received','')}${metric('Supplier balances',money(arr('suppliers').reduce((s,x)=>s+supplierBalance(x.id),0)),'wallet','gold','Across '+arr('suppliers').length+' suppliers','')}${metric('Unpaid purchases',arr('purchases').filter(p=>Math.max(0,p.total-purchasePaid(p.id))>0).length,'clock','blue','Payments still due','')}</div><div class="toolbar">${makeSearch('Purchase number or supplier')}<select class="filter-select" id="purchaseStatusFilter"><option value="all">All statuses</option><option value="open">Awaiting payment</option><option value="partial">Partially paid</option><option value="paid">Paid</option></select><span class="toolbar-spacer"></span><span class="panel-head-meta">${list.length} purchases</span></div><div class="table-card" id="purchaseTable">${table(['ORDER','COMPANY','SUPPLIER','DATE','ITEMS','TOTAL','PAID','STATUS',''],list.map(p=>`<tr${searchRow('purchases',p)} data-status="${p.status}"><td class="table-primary">${esc(p.number)}</td><td>${esc(company(p.company_id)?.name||'—')}</td><td>${esc(supplier(p.supplier_id)?.name||'—')}</td><td>${dateFmt(p.purchase_date)}</td><td>${purchaseItems(p.id).length} items</td><td class="amount-cell">${money(p.total)}</td><td>${money(purchasePaid(p.id))}</td><td>${badge(p.status)}</td><td><button class="row-action" data-action="print-purchase" data-id="${p.id}" title="Print purchase order">↗</button> <button class="row-action danger-action" data-action="delete-purchase" data-id="${p.id}" title="Delete purchase if stock can be safely reversed">×</button></td></tr>`),'No purchases have been recorded yet.')}</div><div class="table-meta"><span>Each purchase order records the company placing it and the supplier that receives it. Deletion is blocked if it has payment history or later stock movements.</span><span>Paid to suppliers: ${money(arr('supplier_payments').reduce((s,p)=>s+Number(p.amount),0))}</span></div>`;
}

function renderExpenses(){
  const list=[...arr('expenses')].sort((a,b)=>b.expense_date.localeCompare(a.expense_date));
  return `${pageHeading('Expenses','Track operating costs and link one expense to one or more paid invoices.',`<button class="button" data-action="expense-categories">Manage categories</button><button class="button primary" data-action="new-expense"><span class="plus">+</span> Add expense</button>`)}<div class="report-grid">${metric('This month',money(expenseTotal(monthStart(),todayISO())),'expense','red','Operating expenses','')}${metric('Year to date',money(expenseTotal(yearStart(),todayISO())),'chart','blue','All expense categories','')}${metric('Invoice links',arr('expense_invoices').length,'receipt','gold','Reference links only; each expense is counted once','')}</div><div class="toolbar">${makeSearch('Description, category or invoice number')}<select class="filter-select" id="expenseCategoryFilter"><option value="all">All categories</option>${arr('expense_categories').map(c=>`<option value="${esc(c.name)}">${esc(c.name)}</option>`)}</select><span class="toolbar-spacer"></span><span class="panel-head-meta">${list.length} expenses</span></div><div class="table-card" id="expenseTable">${table(['DESCRIPTION','LINKED INVOICES','CATEGORY','DATE','PAID VIA','TOTAL','BILLS',''],list.map(e=>`<tr${searchRow('expenses',{...e,invoice_numbers:expenseInvoiceLabels(e).join(' ')})} data-category="${esc(e.category)}"><td><span class="table-primary">${esc(e.description)}</span>${e.expense_type==='labour'?`<span class="table-secondary">${Number(e.worker_count)} workers · ${Number(e.working_days)} days</span>`:''}</td><td>${expenseInvoiceIds(e).map(invoiceId=>{const invoice=byId(arr('invoices'),invoiceId);return invoice?`<button class="text-link" data-action="print-invoice" data-id="${esc(invoice.id)}">${esc(invoice.number)}</button>`:esc(invoiceId);}).join('<br>')||'—'}</td><td><span class="status-pill status-available">${esc(e.category)}</span></td><td>${dateFmt(e.expense_date)}</td><td>${esc(e.payment_method)}</td><td class="amount-cell">${money(e.amount)}</td><td>${arr('expense_attachments').filter(a=>a.expense_id===e.id).map(a=>`<a class="text-link" href="${apiUrl('/api/expense-attachments/'+a.id)}" target="_blank">${esc(a.file_name)}</a>`).join('<br>')||'—'}</td><td><button class="row-action" data-action="edit-expense" data-id="${e.id}" title="Edit expense">✎</button> <button class="row-action danger-action" data-action="delete-expense" data-id="${e.id}" title="Delete expense and its attached files">×</button></td></tr>`),'Your costs appear here. Add rent, materials, labor, delivery or other expenses.')}</div><div class="table-meta"><span>Quotations are not linked here because they are not paid documents. Link one or more invoices; the expense total is counted once.</span><span>All time: ${money(expenseTotal())}</span></div>`;
}

function renderServices(){const list=[...arr('services')].sort((a,b)=>a.title.localeCompare(b.title));return `${pageHeading('Services','Create a reusable service catalog. Service lines never change inventory.',`<button class="button primary" data-action="new-service"><span class="plus">+</span> Add service</button>`)}<div class="toolbar">${makeSearch('Service title, code or description')}<span class="toolbar-spacer"></span><span class="panel-head-meta">${list.length} services</span></div><div class="table-card">${table(['SERVICE','CODE','DESCRIPTION','CHARGE','COST',''],list.map(s=>`<tr${searchRow('services',s)}><td class="table-primary">${esc(s.title)}</td><td>${esc(s.code||'—')}</td><td>${esc(s.description||'—')}</td><td class="amount-cell">${money(s.unit_price)}</td><td>${money(s.unit_cost)}</td><td><button class="row-action" data-action="edit-service" data-id="${s.id}" title="Edit service">✎</button> <button class="row-action danger-action" data-action="delete-service" data-id="${s.id}" title="Delete service">×</button></td></tr>`),'Add a service to use it on invoices, quotations and estimates.')}</div>`;}

function projectSummary(key){const docs=arr('invoices').filter(i=>i.project_key===key),quotes=arr('quotations').filter(q=>q.project_key===key),expenses=arr('expenses').filter(e=>expenseProjectAmount(e,key)>0).map(e=>({...e,allocated_amount:expenseProjectAmount(e,key)})),revenue=docs.reduce((s,i)=>s+Number(i.subtotal||i.total)-Number(i.discount_amount||0),0),cogs=docs.reduce((s,i)=>s+invoiceItems(i.id).reduce((t,x)=>t+Number(x.quantity)*Number(x.unit_cost),0),0),cost=expenses.reduce((s,e)=>s+Number(e.allocated_amount),0),totalCost=cogs+cost,profit=revenue-totalCost,companySharePercent=projectCompanySharePercent(key),companyRetained=Math.max(0,profit)*companySharePercent/100,distributable=Math.max(0,profit-companyRetained);return {docs,quotes,expenses,revenue,cogs,cost,totalCost,profit,margin:revenue?profit/revenue*100:0,companySharePercent,companyRetained,distributable};}
function renderProjects(){const projects=[...arr('projects')].sort((a,b)=>b.updated_at.localeCompare(a.updated_at));return `${pageHeading('Projects','Follow each quotation through invoices and partner distribution.',`<button class="button primary" data-action="new-quote"><span class="plus">+</span> Start with a quotation</button>`)}<div class="toolbar">${makeSearch('Project key, customer or project name')}<span class="toolbar-spacer"></span><span class="panel-head-meta">${projects.length} projects</span></div><div class="table-card">${table(['PROJECT KEY','PROJECT / CUSTOMER','REVENUE','HISTORIC EXPENSES','NET PROFIT','COMPANY KEEPS','FOR PARTNERS',''],projects.map(p=>{const s=projectSummary(p.project_key);return `<tr${searchRow('projects',p)}><td><span class="table-primary">${esc(p.project_key)}</span></td><td><span class="table-primary">${esc(p.title||customer(p.customer_id)?.name||'Project')}</span><span class="table-secondary">${esc(customer(p.customer_id)?.name||'')} · ${s.companySharePercent}% company share</span></td><td>${money(s.revenue)}</td><td>${money(s.cost)}</td><td class="amount-cell ${s.profit<0?'profit-negative':'profit-positive'}">${money(s.profit)}</td><td>${money(s.companyRetained)}</td><td>${money(s.distributable)}</td><td><button class="row-action" data-action="project-detail" data-key="${esc(p.project_key)}">↗</button></td></tr>`}),'Create a quotation to generate the project key.')}</div>`;}

function renderCustomers(){
  const list=[...arr('customers')].sort((a,b)=>a.name.localeCompare(b.name));
  return `${pageHeading('Customers','Keep customer details close to their invoices, quotes and payment history.',`<button class="button primary" data-action="new-customer"><span class="plus">+</span> Add customer</button>`)}<div class="report-grid">${metric('Customers',arr('customers').length,'users','','In your address book','')}${metric('Outstanding',money(arr('invoices').reduce((s,i)=>s+invoiceBalance(i),0)),'wallet','gold','Across all open invoices','')}${metric('Customer credits',money(arr('invoices').reduce((s,i)=>s+invoiceCredit(i),0)),'coins','blue','Overpayments on account','')}</div><div class="toolbar">${makeSearch('Name, email or phone')}<span class="toolbar-spacer"></span><span class="panel-head-meta">${list.length} customers</span></div><div class="table-card">${table(['CUSTOMER','CONTACT','INVOICES','LIFETIME SALES','OUTSTANDING',''],list.map(c=>{const invoices=arr('invoices').filter(i=>i.customer_id===c.id),sales=invoices.reduce((s,i)=>s+Number(i.total),0),balance=invoices.reduce((s,i)=>s+invoiceBalance(i),0);return `<tr${searchRow('customers',c)}><td><div class="stock-product"><span class="mini-avatar ${avatarClass(c.name)}">${initials(c.name)}</span><span><span class="table-primary">${esc(c.name)}</span><span class="table-secondary">${esc(c.address||'Customer')}</span></span></div></td><td>${esc(c.email||c.phone||'—')}<span class="table-secondary">${esc(c.phone||'')}</span></td><td>${invoices.length}</td><td class="amount-cell">${money(sales)}</td><td><span class="${balance?'':'profit-positive'}">${money(balance)}</span><span class="table-secondary">${balance?'due':'up to date'}</span></td><td><button class="row-action" data-action="customer-detail" data-id="${c.id}" title="View account">↗</button> <button class="row-action" data-action="edit-customer" data-id="${c.id}" title="Edit customer">✎</button> <button class="row-action danger-action" data-action="delete-customer" data-id="${c.id}" title="Delete customer">×</button></td></tr>`}), 'Add your first customer. Their invoices, quotes and balances will stay linked to their profile.')}</div>`;
}

function renderSuppliers(){
  const list=[...arr('suppliers')].sort((a,b)=>a.name.localeCompare(b.name));
  return `${pageHeading('Suppliers','Manage vendors, incoming stock, purchase history and amounts you owe.',`<button class="button primary" data-action="new-supplier"><span class="plus">+</span> Add supplier</button>`)}<div class="report-grid">${metric('Suppliers',arr('suppliers').length,'truck','','Your vendor list','')}${metric('To pay',money(arr('suppliers').reduce((s,x)=>s+supplierBalance(x.id),0)),'wallet','gold','Supplier balances due','')}${metric('Supplier credits',money(arr('suppliers').reduce((s,x)=>s+supplierCredit(x.id),0)),'coins','blue','Payments above each supplier balance','')}</div><div class="toolbar">${makeSearch('Supplier name, email or phone')}<span class="toolbar-spacer"></span><span class="panel-head-meta">${list.length} suppliers</span></div><div class="table-card">${table(['SUPPLIER','CONTACT','PURCHASES','LIFETIME PURCHASES','BALANCE DUE',''],list.map(s=>{const purchases=arr('purchases').filter(p=>p.supplier_id===s.id),total=purchases.reduce((sum,p)=>sum+Number(p.total),0);return `<tr${searchRow('suppliers',s)}><td><div class="stock-product"><span class="mini-avatar ${avatarClass(s.name)}">${initials(s.name)}</span><span><span class="table-primary">${esc(s.name)}</span><span class="table-secondary">${esc(s.address||'Supplier')}</span></span></div></td><td>${esc(s.email||s.phone||'—')}<span class="table-secondary">${esc(s.phone||'')}</span></td><td>${purchases.length}</td><td class="amount-cell">${money(total)}</td><td><span class="${supplierBalance(s.id)?'':'profit-positive'}">${money(supplierBalance(s.id))}</span></td><td><button class="row-action" data-action="supplier-detail" data-id="${s.id}" title="View account">↗</button> <button class="row-action" data-action="edit-supplier" data-id="${s.id}" title="Edit supplier">✎</button> <button class="row-action danger-action" data-action="delete-supplier" data-id="${s.id}" title="Delete supplier">×</button></td></tr>`}), 'Add a supplier to connect purchase orders and payments to the right account.')}</div>`;
}

function renderPayments(){
  const active=state.paymentTab,records=active==='customer'?arr('payments').map(p=>({...p,party:customer(p.customer_id)?.name||'—',record:byId(arr('invoices'),p.invoice_id)?.number||'—',kind:'Customer receipt'})):arr('supplier_payments').map(p=>({...p,party:supplier(p.supplier_id)?.name||'—',record:p.purchase_id?(byId(arr('purchases'),p.purchase_id)?.number||'—'):'On account',kind:'Supplier payment'}));
  const list=[...records].sort((a,b)=>b.payment_date.localeCompare(a.payment_date));
  const total=records.reduce((s,p)=>s+Number(p.amount),0);
  const actions=`<button class="button" data-action="new-supplier-payment"><span class="plus">+</span> Pay supplier</button><button class="button primary" data-action="new-payment"><span class="plus">+</span> Record receipt</button>`;
  return `${pageHeading('Payments','Keep incoming customer money and outgoing supplier payments on one timeline.',actions)}<div class="report-grid">${metric('Customer receipts',money(arr('payments').reduce((s,p)=>s+Number(p.amount),0)),'wallet','','Payments received','')}${metric('Supplier payments',money(arr('supplier_payments').reduce((s,p)=>s+Number(p.amount),0)),'bank','blue','Payments made','')}${metric('Customer credits',money(arr('invoices').reduce((s,i)=>s+invoiceCredit(i),0)),'coins','gold','Available overpayments','')}</div><div class="table-card"><div class="tab-row"><button class="tab-button ${active==='customer'?'active':''}" data-action="payments-tab" data-tab="customer">Customer receipts <span class="table-secondary">${arr('payments').length}</span></button><button class="tab-button ${active==='supplier'?'active':''}" data-action="payments-tab" data-tab="supplier">Supplier payments <span class="table-secondary">${arr('supplier_payments').length}</span></button></div><div style="padding:12px 14px 0;display:flex;align-items:center">${makeSearch('Search party, reference or method')}<span class="toolbar-spacer"></span><span class="panel-head-meta">${list.length} payments</span></div>${table(['DATE','CONTACT','REFERENCE','METHOD','PAYMENT REF.','AMOUNT',''],list.map(p=>`<tr${searchRow('payments',p)} data-payment-amount="${p.amount}"><td>${dateFmt(p.payment_date)}</td><td><span class="table-primary">${esc(p.party)}</span><span class="table-secondary">${p.kind}</span></td><td>${esc(p.record)}</td><td>${esc(p.method)}</td><td>${esc(p.reference||'—')}</td><td class="amount-cell">${money(p.amount)}</td><td>${active==='customer'?`<button class="row-action" data-action="print-receipt" data-id="${p.id}" title="Print payment receipt">↗</button>`:''} <button class="row-action danger-action" data-action="${active==='customer'?'delete-payment':'delete-supplier-payment'}" data-id="${p.id}" title="Delete payment and recalculate balance">×</button></td></tr>`),'Payments will appear here when you record an invoice receipt or supplier payment.')}<div class="table-meta"><span>${active==='customer'?'Money applied to customer invoices. Overpayments are tracked as customer credit.':'Money paid against supplier balances.'}</span><span id="filteredPaymentTotal">Filtered total: ${money(total)}</span></div></div>`;
}

function renderProfits(){
  const partners=arr('partners'),shares=[...arr('profit_shares')].sort((a,b)=>b.period_end.localeCompare(a.period_end));
  const sharePercent=partners.reduce((s,p)=>s+Number(p.share_percent),0),month=distributionSummary(monthStart(),todayISO());
  return `${pageHeading('Profit sharing','Deduct all costs, keep each project’s company percentage, then divide the remainder among partners.',`<button class="button" data-action="new-partner"><span class="plus">+</span> Add partner</button><button class="button primary" data-action="generate-shares"><span class="plus">↗</span> Calculate shares</button>`)}<div class="report-grid">${metric('Net profit this month',money(month.total),'chart','','After product costs and all expenses','')}${metric('Company retained',money(month.companyRetained),'bank','blue','Uses each project’s own percentage','')}${metric('Available for partners',money(month.distributable),'coins','gold',`${sharePercent}% of this basis is allocated to partners`,'')}</div><div class="panel table-panel" style="margin-bottom:14px"><div class="panel-header"><div><div class="panel-title">Partner percentages</div><div class="panel-subtitle">Partner shares apply only after project company retention and all expenses.</div></div><span class="panel-head-meta">${sharePercent}% allocated</span></div>${table(['PARTNER','EMAIL','SHARE','ACTIONS'],partners.map(p=>`<tr><td><div class="stock-product"><span class="mini-avatar ${avatarClass(p.name)}">${initials(p.name)}</span><span class="table-primary">${esc(p.name)}</span></div></td><td>${esc(p.email||'—')}</td><td class="amount-cell">${Number(p.share_percent)}%</td><td><button class="row-action" data-action="edit-partner" data-id="${p.id}" title="Edit share">✎</button> <button class="row-action danger-action" data-action="delete-partner" data-id="${p.id}" title="Delete partner">×</button></td></tr>`),'Add partners to set up profit sharing.')}</div><div class="panel table-panel"><div class="panel-header"><div><div class="panel-title">Calculated distributions</div><div class="panel-subtitle">Saved partner shares based on distributable profit after the company portion.</div></div></div>${table(['PERIOD','PARTNER','DISTRIBUTABLE BASIS','SHARE','DISTRIBUTION'],shares.map(s=>`<tr><td>${dateFmt(s.period_start)} – ${dateFmt(s.period_end)}</td><td>${esc(byId(partners,s.partner_id)?.name||'—')}</td><td>${money(s.profit_basis)}</td><td>${Number(s.share_percent)}%</td><td class="amount-cell">${money(s.amount)}</td></tr>`),'No shares calculated yet. Calculate a date range to create a partner distribution.')}</div><div class="help-note">Set the company percentage separately inside each project. A project can keep 30%, 0%, or another value. General unallocated expenses still reduce total profit before partner distribution.</div>`;
}

function reportDefaults(){
  if(state.reportStart&&state.reportEnd)return;
  const now=todayISO();
  if(state.reportType==='day'){state.reportStart=now;state.reportEnd=now;}
  else if(state.reportType==='year'){state.reportStart=`${now.slice(0,4)}-01-01`;state.reportEnd=now;}
  else{state.reportStart=`${now.slice(0,7)}-01`;state.reportEnd=now;}
}
function groupedReport(){
  const {reportStart:start,reportEnd:end,reportType:type}=state;
  const keyFor=day=>type==='year'?day.slice(0,7):type==='month'?day:day;
  const buckets=new Map();
  const add=(date,key,value)=>{if(!inRange(date,start,end))return;const bucket=keyFor(date);if(!buckets.has(bucket))buckets.set(bucket,{period:bucket,sales:0,purchases:0,expenses:0,profit:0,invoices:0});buckets.get(bucket)[key]+=value;};
  arr('invoices').forEach(i=>{add(i.invoice_date,'sales',Number(i.total));if(inRange(i.invoice_date,start,end)){const x=buckets.get(keyFor(i.invoice_date));x.profit+=invoiceProfit(i);x.invoices++;}});
  arr('purchases').forEach(p=>add(p.purchase_date,'purchases',Number(p.total)));
  arr('expenses').forEach(e=>{add(e.expense_date,'expenses',Number(e.amount));});
  for(const x of buckets.values())x.profit-=x.expenses;
  return [...buckets.values()].sort((a,b)=>b.period.localeCompare(a.period));
}
function renderReports(){
  reportDefaults();
  const {reportStart:start,reportEnd:end}=state,records=groupedReport(),category=state.reportSection||'all';
  const sales=arr('invoices').filter(i=>inRange(i.invoice_date,start,end)).reduce((s,i)=>s+Number(i.total),0);
  const purchases=arr('purchases').filter(p=>inRange(p.purchase_date,start,end)).reduce((s,p)=>s+Number(p.total),0);
  const expenses=expenseTotal(start,end),profit=netProfit(start,end);
  const categories=`<select class="filter-select" id="reportSection"><option value="all" ${category==='all'?'selected':''}>All activity</option><option value="sales" ${category==='sales'?'selected':''}>Sales</option><option value="purchases" ${category==='purchases'?'selected':''}>Purchases</option><option value="expenses" ${category==='expenses'?'selected':''}>Expenses</option><option value="inventory" ${category==='inventory'?'selected':''}>Inventory</option><option value="profits" ${category==='profits'?'selected':''}>Profit</option></select>`;
  const periodButtons=['day','month','year'].map(t=>`<button class="period-button ${state.reportType===t?'active':''}" data-action="report-period" data-period="${t}">${({day:'Daily',month:'Monthly',year:'Yearly'})[t]}</button>`).join('');
  let body='';
  if(category==='inventory'){
    body=table(['PRODUCT','SKU','ON HAND','UNIT COST','SELLING PRICE','STOCK VALUE'],arr('products').map(p=>`<tr><td class="table-primary">${esc(p.name)}</td><td>${esc(p.sku)}</td><td>${Number(p.quantity).toLocaleString()}</td><td>${money(p.purchase_price)}</td><td>${money(p.selling_price)}</td><td class="amount-cell">${money(p.quantity*p.purchase_price)}</td></tr>`),'No products have been recorded.');
  } else if(category==='sales'){
    body=table(['INVOICE','CUSTOMER','DATE','PROJECT KEY','PRODUCT SALES','SERVICE SALES','GROSS PROFIT','COLLECTED'],arr('invoices').filter(i=>inRange(i.invoice_date,start,end)).sort((a,b)=>b.invoice_date.localeCompare(a.invoice_date)).map(i=>{const lines=invoiceItems(i.id),productSales=lines.filter(x=>x.item_type!=='service').reduce((n,x)=>n+Number(x.line_total)-Number(x.discount_amount||0),0),serviceSales=lines.filter(x=>x.item_type==='service').reduce((n,x)=>n+Number(x.line_total)-Number(x.discount_amount||0),0);return `<tr><td class="table-primary">${esc(i.number)}</td><td>${esc(customer(i.customer_id)?.name||'—')}</td><td>${dateFmt(i.invoice_date)}</td><td>${esc(i.project_key||'—')}</td><td>${money(productSales)}</td><td>${money(serviceSales)}</td><td class="${invoiceProfit(i)<0?'profit-negative':'profit-positive'}">${money(invoiceProfit(i))}</td><td>${money(invoicePaid(i.id))}</td></tr>`;}),'No invoices in this reporting period.');
  } else if(category==='purchases'){
    body=table(['PURCHASE','SUPPLIER','DATE','ITEMS','TOTAL','PAID'],arr('purchases').filter(p=>inRange(p.purchase_date,start,end)).sort((a,b)=>b.purchase_date.localeCompare(a.purchase_date)).map(p=>`<tr><td class="table-primary">${esc(p.number)}</td><td>${esc(supplier(p.supplier_id)?.name||'—')}</td><td>${dateFmt(p.purchase_date)}</td><td>${purchaseItems(p.id).length}</td><td>${money(p.total)}</td><td>${money(purchasePaid(p.id))}</td></tr>`),'No purchases in this reporting period.');
   } else if(category==='expenses'){
     body=table(['EXPENSE','LINKED INVOICES','CATEGORY','DATE','SUPPLIER','METHOD','TOTAL'],arr('expenses').filter(e=>inRange(e.expense_date,start,end)).sort((a,b)=>b.expense_date.localeCompare(a.expense_date)).map(e=>`<tr><td class="table-primary">${esc(e.description)}</td><td>${esc(expenseInvoiceLabels(e).join(', ')||'—')}</td><td>${esc(e.category)}</td><td>${dateFmt(e.expense_date)}</td><td>${esc(supplier(e.supplier_id)?.name||'—')}</td><td>${esc(e.payment_method)}</td><td>${money(e.amount)}</td></tr>`),'No expenses in this reporting period.');
  } else if(category==='profits'){
    body=table(['PERIOD','INVOICED SALES','PURCHASES RECEIVED','EXPENSES','NET PROFIT'],records.map(x=>`<tr><td class="table-primary">${esc(x.period)}</td><td>${money(x.sales)}</td><td>${money(x.purchases)}</td><td>${money(x.expenses)}</td><td class="amount-cell ${x.profit<0?'profit-negative':'profit-positive'}">${money(x.profit)}</td></tr>`),'No activity in this reporting period.');
  } else {
    body=table(['PERIOD','INVOICED SALES','PURCHASES RECEIVED','EXPENSES','NET PROFIT','INVOICES'],records.map(x=>`<tr><td class="table-primary">${esc(x.period)}</td><td>${money(x.sales)}</td><td>${money(x.purchases)}</td><td>${money(x.expenses)}</td><td class="amount-cell ${x.profit<0?'profit-negative':'profit-positive'}">${money(x.profit)}</td><td>${x.invoices}</td></tr>`),'No activity in this reporting period.');
  }
  return `${pageHeading('Reports','Explore daily, monthly or yearly performance and export the records you need.',`<button class="button" data-action="export-report">${icon('download')} Export CSV</button>`)}<div class="report-toolbar"><div class="period-switch">${periodButtons}</div><div class="report-date-range"><label>From <input type="date" id="reportStart" value="${esc(start)}"></label><span>to</span><label><input type="date" id="reportEnd" value="${esc(end)}"></label>${categories}</div></div><div class="report-grid">${metric('Sales',money(sales),'receipt','','Invoiced revenue','')}${metric('Purchases',money(purchases),'purchase','blue','Stock received','')}${metric('Expenses',money(expenses),'expense','gold','Recorded business costs','')}${metric('Net profit',money(profit),'chart',profit<0?'red':'','Gross profit less expenses',profit<0?'down':'up')}</div><div class="panel table-panel"><div class="panel-header"><div><div class="panel-title">${category==='inventory'?'Inventory snapshot':category==='sales'?'Sales report':category==='purchases'?'Purchase report':category==='expenses'?'Expense report':category==='profits'?'Profit report':'Activity summary'}</div><div class="panel-subtitle">${dateFmt(start)} to ${dateFmt(end)}</div></div><span class="panel-head-meta">${category==='inventory'?arr('products').length:records.length} ${category==='inventory'?'products':'periods'}</span></div>${body}<div class="table-meta"><span>Profit uses the purchase cost stored on each invoice item and expenses dated in this period.</span><span>Net profit: ${money(profit)}</span></div></div>`;
}

function companyCard(c){
  const logo=c.logo_data?`<img src="${esc(c.logo_data)}" alt="${esc(c.name)} logo">`:`<span>${esc(initials(c.name).slice(0,1))}</span>`;
  const meta=[c.address,c.contact_numbers,c.email,c.website].filter(Boolean).map(esc).join(' · ')||'Add address and contact details';
  const bank=[c.bank_name,c.bank_branch,c.account_holder&&`Account: ${c.account_holder}`].filter(Boolean).join(' · ')||'Bank details not added';
  const accent=/^#[0-9a-fA-F]{6}$/.test(c.document_color||'')?c.document_color:'#1f5fae';
  return `<article class="company-setting-card"><div class="company-card-main"><div class="company-logo-preview">${logo}</div><div class="company-card-copy"><div class="company-title-line"><strong>${esc(c.name)}</strong>${Number(c.is_default)?'<span class="status-pill status-paid">Default</span>':''}</div><span>${meta}</span><small>${bank}</small><small class="company-color-summary"><i style="background:${esc(accent)}"></i> Document color ${esc(accent.toUpperCase())}</small></div></div><div class="company-card-actions"><button class="button small" data-action="edit-company" data-id="${c.id}">Edit profile &amp; theme</button>${!Number(c.is_default)?`<button class="button small" data-action="set-default-company" data-id="${c.id}">Make default</button><button class="row-action danger-action" data-action="delete-company" data-id="${c.id}" title="Delete profile">×</button>`:''}</div></article>`;
}
function renderSettings(){
  const s=settings(),business=defaultCompany(),profile=company(business.id),backup=state.backupStatus;
  const backupReady=!!backup?.available,backupDate=new Date(backup?.updatedAt||'');
  const updated=backupReady&&!Number.isNaN(+backupDate)?new Intl.DateTimeFormat(s.locale||'en-LK',{dateStyle:'medium',timeStyle:'short'}).format(backupDate):'Automatic backup is being created.';
  const card=companyCard(profile||business);
  const heading=pageHeading('Company Settings','Manage this business profile, bank instructions, logo and standard document terms.');
  const receiverStatus=profile?.receiver_key?`<div class="receiver-key-status receiver-key-ready"><strong>Receiver Key saved</strong><span>This company will use the exact manually entered key.</span></div>`:`<div class="receiver-key-status receiver-key-missing"><strong>Receiver Key not entered</strong><span>Open Edit profile and enter the key manually when your workflow requires one. Nothing is generated automatically.</span></div>`;
  const profiles='<section class="panel company-settings-panel"><div class="panel-header"><div><div class="panel-title">Company profile</div><div class="panel-subtitle">This business has its own database, users and private account backup.</div></div><span class="panel-head-meta">'+esc(business.name)+'</span></div><div class="company-settings-list">'+card+'</div></section>';
  const account=state.access?.user||{},emailStatus=account.emailVerified?'Verified recovery email: '+esc(account.email):account.email?'Email not verified: '+esc(account.email):'No recovery email has been verified for this account.';
  const accountSecurity='<section class="settings-panel regional-settings"><div class="settings-section-heading"><div><h2>Account recovery email</h2><p>'+emailStatus+'</p></div></div><form id="accountEmailForm" class="form-grid two-column"><label>Recovery email<input name="email" type="email" maxlength="254" required autocomplete="email" value="'+esc(account.email||'')+'"></label><label>Current password<input name="currentPassword" type="password" required autocomplete="current-password"></label><button class="button" type="button" data-action="request-account-email-otp">Send verification code</button><p id="accountEmailOtpStatus" class="setup-help" aria-live="polite">'+(state.access?.emailOtpAvailable?'We will send a one-time code to the email address above.':'Email code sending is not configured on this server.')+'</p><div id="accountEmailCodeFields" class="form-field full" hidden><label>Six-digit email code<input name="emailOtp" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" minlength="6" maxlength="6" disabled></label><button class="button primary" type="submit">Verify and save email</button></div></form></section>';
  const preferences='<section class="settings-panel regional-settings"><div class="settings-section-heading"><div><h2>Regional display</h2><p>Currency and date formatting for this company.</p></div><button class="button primary" form="settingsForm" type="submit">Save preferences</button></div><form id="settingsForm" class="setting-form"><div class="form-grid two-column"><div class="form-field"><label for="currency">Display currency</label><select name="currency" id="currency"><option value="LKR" '+(s.currency==='LKR'?'selected':'')+'>Sri Lankan Rupee · LKR</option><option value="USD" '+(s.currency==='USD'?'selected':'')+'>US Dollar · USD</option><option value="GBP" '+(s.currency==='GBP'?'selected':'')+'>British Pound · GBP</option><option value="EUR" '+(s.currency==='EUR'?'selected':'')+'>Euro · EUR</option><option value="AUD" '+(s.currency==='AUD'?'selected':'')+'>Australian Dollar · AUD</option><option value="INR" '+(s.currency==='INR'?'selected':'')+'>Indian Rupee · INR</option></select></div><div class="form-field"><label for="locale">Date and number format</label><select name="locale" id="locale"><option value="en-LK" '+(s.locale==='en-LK'?'selected':'')+'>English · Sri Lanka</option><option value="en-US" '+(s.locale==='en-US'?'selected':'')+'>English · United States</option><option value="en-GB" '+(s.locale==='en-GB'?'selected':'')+'>English · United Kingdom</option><option value="en-IN" '+(s.locale==='en-IN'?'selected':'')+'>English · India</option></select></div></div></form></section>';
  return heading+receiverStatus+profiles+accountSecurity+preferences;
}
function renderAbout(){
  return pageHeading('About itsme invoicey','Business management software for invoices, quotations, inventory, payments and reports.')+
    '<div class="about-grid"><section class="settings-panel about-card"><div class="about-brand-lockup"><img src="/assets/invoicey-badge.png" alt="ITSMe Invoicey logo"><div><div class="eyebrow">ITSMe Invoicey</div><h2>Business operations, kept clear.</h2><p>Manage your company records, documents, stock, expenses and payments in one connected workspace.</p></div></div><div class="about-rule"></div><dl class="about-details"><div><dt>Designed &amp; developed by</dt><dd>B. A. Dhameera Idumal</dd></div><div><dt>Mobile</dt><dd><a href="tel:+94702359602">+94 70 235 9602</a></dd></div><div><dt>Email</dt><dd><a href="mailto:dhameera@hotmail.com">dhameera@hotmail.com</a></dd></div><div><dt>LinkedIn</dt><dd><a href="https://www.linkedin.com/in/dhameera" target="_blank" rel="noopener noreferrer">linkedin.com/in/dhameera ↗</a></dd></div></dl></section><aside class="settings-panel about-publisher"><div class="eyebrow">Publisher</div><h2>ITSMe Technology</h2><p>Published with care for small businesses that need dependable records, documents and reporting.</p><span class="about-badge">itsme invoicey</span></aside></div><p class="about-version">© ${new Date().getFullYear()} ITSMe Technology · itsme invoicey</p>';
}
function renderBackup(){
  const s=state.backupStatus,when=s?.updatedAt?new Intl.DateTimeFormat(settings().locale||'en-LK',{dateStyle:'medium',timeStyle:'short'}).format(new Date(s.updatedAt)):'A private backup will be created as you work.';
  return pageHeading('Account Backup & Restore','Each company account is backed up separately in private server storage.')+'<section class="settings-panel backup-panel"><div class="settings-section-heading"><div><h2>'+esc(defaultCompany().name)+' account backup</h2><p>The backup contains this company’s complete business database, including customers, suppliers, invoices, quotations, payments, expenses, stock and attached records. Passwords, OTPs and active sessions are never included.</p></div><span class="backup-badge">Private SQLite backup</span></div><div class="backup-status '+(s?.available?'':'backup-unavailable')+'"><span class="backup-status-dot"></span><span><strong>'+esc(when)+'</strong><small>'+esc(s?.fileName||defaultCompany().name+'_Account_Backup.invoicey')+'</small></span></div><div class="backup-actions"><button class="button primary" data-action="create-backup">Create secure backup</button><button class="button" data-action="download-backup">Download latest backup</button></div><p class="help-note">Backups are isolated per company account and retained on the server. Restoring a history copy first saves the current account database as a recovery copy, then replaces only this company’s records.</p></section><section class="settings-panel backup-history-panel"><h2>Recent account backup copies</h2><div id="backupHistoryList" class="empty-row">Loading backup history…</div></section>';
}
const adminScopes=['dashboard','customers','suppliers','products','services','inventory','quotations','estimates','invoices','purchases','payments','expenses','profit','reports','partners','companies','users','backup','records'];
const adminActions=['view','view_own','create','edit','delete','adjust','export','restore','manage'];
function renderAdmin(){
  const role=state.access?.user?.role||'',isSuper=!!state.access?.user?.isSuper;
  return pageHeading('Administrator Control Panel',isSuper?'Manage businesses, company administrators, feature access, user limits and system activity.':'Manage users and permissions for this business.')+'<div class="admin-tabs"><button class="tab-button active" data-action="admin-tab" data-tab="users">Users & permissions</button>'+(isSuper?'<button class="tab-button" data-action="admin-tab" data-tab="companies">Companies</button>':'')+'<button class="tab-button" data-action="admin-tab" data-tab="audit">Activity log</button><button class="tab-button" data-action="admin-tab" data-tab="password">Change password</button></div><section id="adminPanel" class="settings-panel admin-panel"><div class="empty-row">Loading administrator controls…</div></section>';
}
async function loadBackupHistory(){
  const target=$('#backupHistoryList');if(!target)return;
  try{const items=await api('/api/backup/history');target.innerHTML=items.length?items.map(x=>'<div class="backup-history-row"><div><strong>'+esc(x.fileName)+'</strong><small>'+esc(new Intl.DateTimeFormat(settings().locale||'en-LK',{dateStyle:'medium',timeStyle:'short'}).format(new Date(x.updatedAt)))+'</small></div><span>'+esc(x.kind)+'</span><button class="button small" data-action="restore-history" data-file="'+esc(x.fileName)+'">Restore</button></div>').join(''):'<div class="empty-row">No prior account copies have been kept yet.</div>';}catch(error){target.innerHTML='<div class="empty-row">'+esc(error.message)+'</div>';}
}
async function loadAdminLists(tab='users'){
  const panel=$('#adminPanel');if(!panel)return;
  try{
    if(tab==='audit'){const logs=await api('/api/admin/audit');panel.innerHTML='<div class="panel-header"><div><div class="panel-title">Recent activity</div><div class="panel-subtitle">Sign-ins, record changes, company management and restores.</div></div></div>'+table(['DATE & TIME','USER','COMPANY','ACTION','DETAILS'],logs.map(x=>'<tr><td>'+esc(dateFmt(x.date.slice(0,10)))+' '+esc(x.date.slice(11,19))+'</td><td>'+esc(x.username)+'</td><td>'+esc(x.companyName||'All companies')+'</td><td>'+esc(x.action)+'</td><td>'+esc(x.details)+'</td></tr>'),'No activity recorded yet.');return;}
    if(tab==='password'){panel.innerHTML='<div class="panel-header"><div><div class="panel-title">Change password</div><div class="panel-subtitle">Use at least 12 characters.</div></div></div><form id="changePasswordForm" class="form-grid two-column"><label>Current password<input type="password" name="currentPassword" required autocomplete="current-password"></label><label>New password<input type="password" name="newPassword" required minlength="12" autocomplete="new-password"></label><button class="button primary" type="submit">Update password</button></form>';return;}
    const users=await api('/api/admin/users');const activeCompany=state.access.company;
    if(tab==='companies'&&state.access.user.isSuper){const businesses=await api('/api/admin/companies');panel.innerHTML='<div class="panel-header"><div><div class="panel-title">Businesses</div><div class="panel-subtitle">Each business uses its own database and company backup.</div></div><button class="button primary" data-action="new-business">Add business</button></div>'+table(['COMPANY','STATUS','USERS','MAX USERS','MODULES',''],businesses.map(c=>'<tr><td><strong>'+esc(c.name)+'</strong><small class="table-secondary">'+esc(c.id)+'</small></td><td>'+badge(c.enabled?'active':'disabled')+'</td><td>'+Number(c.userCount||0)+'</td><td><input class="limit-input" type="number" min="1" max="500" value="'+Number(c.userLimit)+'" data-limit-company="'+esc(c.id)+'"></td><td>'+Object.values(c.modules).filter(Boolean).length+' enabled</td><td><button class="button small" data-action="save-company-limits" data-id="'+esc(c.id)+'">Save</button><button class="button small" data-action="toggle-business" data-id="'+esc(c.id)+'" data-enabled="'+c.enabled+'">'+(c.enabled?'Deactivate':'Activate')+'</button></td></tr>'),'No businesses configured.')+'</section><div class="admin-feature-grid">'+businesses.map(c=>'<label class="module-toggle"><strong>'+esc(c.name)+'</strong>'+Object.keys(c.modules).map(m=>'<span><input type="checkbox" data-company-module="'+esc(c.id)+'" data-module="'+esc(m)+'" '+(c.modules[m]?'checked':'')+'> '+esc(m)+'</span>').join('')+'</label>').join('')+'</div>';return;}
    panel.innerHTML='<div class="panel-header"><div><div class="panel-title">Users for '+esc(activeCompany?.name||'this company')+'</div><div class="panel-subtitle">'+users.length+' accounts · maximum '+Number(activeCompany?.userLimit||0)+' users</div></div><button class="button primary" data-action="new-user">Add user</button></div>'+table(['NAME','USERNAME','ROLE','STATUS','PERMISSIONS',''],users.map(u=>'<tr><td>'+esc(u.displayName)+'</td><td>'+esc(u.username)+'</td><td>'+esc(u.role.replaceAll('_',' '))+'</td><td>'+badge(u.active?'active':'inactive')+'</td><td>'+Object.entries(u.permissions||{}).flatMap(([s,p])=>Object.entries(p).filter(([,v])=>v).map(([a])=>s+'.'+a)).length+' enabled</td><td><button class="button small" data-action="edit-user" data-id="'+esc(u.id)+'">Edit</button><button class="button small" data-action="toggle-user" data-id="'+esc(u.id)+'" data-active="'+u.active+'">'+(u.active?'Deactivate':'Activate')+'</button><button class="button small danger-action" data-action="remove-user" data-id="'+esc(u.id)+'">Remove</button></td></tr>'),'No user accounts yet.')+(state.access.user.isSuper?'':'<div class="help-note">The super administrator manages user limits and modules. Company administrators manage this business’s users and permissions.</div>');
  }catch(error){panel.innerHTML='<div class="empty-row">'+esc(error.message)+'</div>';}
}
function permissionForm(initial={}){
  const scopes=adminScopes.map(scope=>'<fieldset class="permission-scope"><legend>'+esc(scope.replaceAll('_',' '))+'</legend>'+adminActions.map(action=>'<label><input type="checkbox" name="perm_'+scope+'_'+action+'" '+(initial[scope]?.[action]?'checked':'')+'> '+esc(action.replaceAll('_',' '))+'</label>').join('')+'</fieldset>').join('');
  return '<details class="permission-details"><summary>Fine-grained permissions</summary><div class="permission-grid">'+scopes+'</div></details>';
}
function openUserForm(id=''){
  const user=id?state.adminUsers?.find(x=>x.id===id):null;const defaultRole=user?.role||'accountant';
  const roleOptions=['company_admin','accountant','salesperson','storekeeper','manager','custom'].map(x=>({value:x,label:x.replaceAll('_',' ')}));
  const body='<div class="form-grid two-column"><div class="form-field"><label>Full name<input name="displayName" required value="'+esc(user?.displayName||'')+'"></label></div><div class="form-field"><label>Username<input name="username" required minlength="3" maxlength="40" '+(user?'readonly':'')+' value="'+esc(user?.username||'')+'"></label></div>'+(!user?'<div class="form-field"><label>Temporary password<input name="password" type="password" minlength="12" required></label></div><div class="form-field"><label>Account email<input name="email" type="email" maxlength="254" autocomplete="email"></label><button class="button" type="button" data-action="request-admin-user-otp">Verify new user email</button><p class="setup-help" id="newAccountOtpStatus" aria-live="polite">New accounts need a verified email for password recovery. Existing users can be added by username.</p><label>Six-digit email code<input name="emailOtp" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" minlength="6" maxlength="6"></label></div>':'')+'<div class="form-field"><label>Role<select name="role">'+roleOptions.map(x=>'<option value="'+x.value+'" '+(x.value===defaultRole?'selected':'')+'>'+esc(x.label)+'</option>').join('')+'</select></label></div>'+(user?'<div class="form-field"><label><input type="checkbox" name="active" '+(user.active?'checked':'')+'> Account active</label></div><div class="form-field"><label><input type="checkbox" name="resetPassword"> Reset password</label><input name="newPassword" type="password" minlength="12" placeholder="New password if resetting"></div>':'')+'</div>'+permissionForm(user?.permissions||{});
  showForm(user?'Edit user and access':'Create company user','Passwords must be at least 12 characters. Changes are recorded in the activity log.',body,async form=>{
    const permissions={};for(const scope of adminScopes){permissions[scope]={};for(const action of adminActions)permissions[scope][action]=!!$('#modalForm [name="perm_'+scope+'_'+action+'"]')?.checked;}
    if(user){await api('/api/admin/users/'+user.id,'PUT',{role:form.role,active:!!$('#modalForm [name="active"]')?.checked,permissions,resetPassword:!!$('#modalForm [name="resetPassword"]')?.checked,newPassword:form.newPassword});}
    else{await api('/api/admin/users','POST',{...form,companyId:state.access.company.id,permissions});}
    await loadAdminLists('users');
  },{wide:true,submit:user?'Save user':'Create user'});
}
function openBusinessForm(){
  const body='<div class="form-grid two-column"><label>Company name<input name="name" required maxlength="160"></label><label>Company administrator name<input name="adminDisplayName" required></label><label>Company administrator username<input name="adminUsername" required minlength="3"></label><label>Administrator email<input name="email" type="email" maxlength="254" autocomplete="email"></label><button class="button" type="button" data-action="request-company-admin-otp">Verify new administrator email</button><p class="setup-help" id="newAccountOtpStatus" aria-live="polite">New accounts need a verified email for password recovery. Existing users can be selected by username.</p><label>Six-digit email code<input name="emailOtp" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" minlength="6" maxlength="6"></label><label>Temporary password<input name="adminPassword" type="password" minlength="12"></label><label>Maximum users<input name="userLimit" type="number" min="1" max="500" value="15"></label></div>';
  showForm('Add a company','Create its own database, private account backup and administrator.',body,async form=>{const payload={company:{name:form.name},userLimit:Number(form.userLimit),admin:{username:form.adminUsername,displayName:form.adminDisplayName,password:form.adminPassword,email:form.email,emailOtp:form.emailOtp}};await api('/api/admin/companies','POST',payload);await refresh();},{wide:true,submit:'Create company'});
}
function applySearch(query){
  const filters=[['invoiceStatusFilter','status'],['purchaseStatusFilter','status'],['quoteStatusFilter','status'],['inventoryFilter','stock'],['categoryFilter','category'],['expenseCategoryFilter','category']].map(([id,key])=>({key,value:$('#'+id)?.value||'all'}));
  let paymentTotal=0;
  $$('#pageContent .data-table tbody tr').forEach(row=>{
    const fields=row.dataset.search?JSON.parse(row.dataset.search):[];
    const visible=searchMatches([...fields,row.textContent],query)&&filters.every(({key,value})=>value==='all'||row.dataset[key]===value);
    row.style.display=visible?'':'none';
    if(visible&&row.dataset.paymentAmount)paymentTotal+=Number(row.dataset.paymentAmount);
  });
  const total=$('#filteredPaymentTotal');if(total)total.textContent='Filtered total: '+money(paymentTotal);
  const search=$('.table-search');if(search&&search.value!==query)search.value=query;
}

function field(label,name,type='text',value='',required=false,full=''){
  return `<div class="form-field ${full==='full'?'full':''}"><label for="f-${name}">${esc(label)}${required?` <span class="required">*</span>`:''}</label><input id="f-${name}" name="${esc(name)}" type="${esc(type)}" value="${esc(value??'')}" ${required===true?'required':''}></div>`;
}
function selectField(label,name,options,current='',required=true,full=''){
  return `<div class="form-field ${full==='full'?'full':''}"><label for="f-${name}">${esc(label)}${required?` <span class="required">*</span>`:''}</label><select id="f-${name}" name="${esc(name)}" ${required?'required':''}>${options.map(o=>`<option value="${esc(o.value)}" ${String(o.value)===String(current)?'selected':''}>${esc(o.label)}</option>`).join('')}</select></div>`;
}
function showForm(title,subtitle,content,onSubmit,{wide=false,submit='Save changes',submitDisabled=false}={}){
  state.modal={submit};
  $('#modalRoot').innerHTML=`<div class="modal-backdrop" data-backdrop><section class="modal ${wide?'wide':''}" role="dialog" aria-modal="true" aria-labelledby="modalTitle"><div class="modal-head"><div><h2 id="modalTitle">${esc(title)}</h2><p>${esc(subtitle||'Complete the details below.')}</p></div><button class="close-button" type="button" data-action="close-modal" aria-label="Close">×</button></div><form id="modalForm" novalidate><div class="modal-body">${content}<div id="modalError" class="form-error" role="alert"></div></div><div class="modal-footer"><span class="required-note"><span class="required">*</span> Required fields</span><div class="modal-actions"><button class="button" type="button" data-action="close-modal">Cancel</button><button class="button primary" type="submit" ${submitDisabled?'disabled':''}>${esc(submit)}</button></div></div></form></section></div>`;
  state.modal.onSubmit=onSubmit;
  const first=$('input:not([type=hidden]),select', $('#modalRoot'));if(first)first.focus();
}
function showContentModal(title,subtitle,content,{wide=false,print=false,editAction='',editId='',editLabel='Edit document'}={}){
  state.modal={};
  const androidPrint=document.documentElement.classList.contains('invoicey-android');
    $('#modalRoot').innerHTML=`<div class="modal-backdrop" data-backdrop><section class="modal ${wide?'wide':''}" role="dialog" aria-modal="true"><div class="modal-head"><div><h2>${esc(title)}</h2><p>${esc(subtitle||'')}</p></div><button class="close-button" type="button" data-action="close-modal" aria-label="Close">×</button></div><div class="modal-body">${content}</div><div class="modal-footer"><span class="required-note">${print?(androidPrint?'A4 document · Save PDF or print with Android':'Turn off “Headers and footers” in the print dialog for a clean PDF.'):'Account overview'}</span><div class="modal-actions">${editAction?`<button class="button" type="button" data-action="${esc(editAction)}" data-id="${esc(editId)}">✎ ${esc(editLabel)}</button>`:''}${print?(window.invoiceyDesktop?.savePDF?'<button class="button primary" type="button" data-action="save-pdf">'+icon('download')+' Save PDF</button>':'')+(androidPrint&&window.invoiceyDesktop?.sharePDF?'<button class="button" type="button" data-action="share-pdf">'+icon('share')+' Share PDF</button>':'')+'<button class="button" type="button" data-action="print-doc">'+icon('print')+(androidPrint?' Print PDF':(window.invoiceyDesktop?.savePDF?' Print':' Print / Save PDF'))+'</button>':''}<button class="button" type="button" data-action="close-modal">Close</button></div></div></section></div>`;
}
function closeModal(){state.modal=null;$('#modalRoot').innerHTML='';}
const defaultLine=()=>({item_type:arr('products').length?'product':'service',product_id:arr('products')[0]?.id||'',quantity:1,unit_price:null,unit_cost:null});
function lineRow(line={},kind='invoice'){
  const type=kind==='purchase'?'product':(line.item_type||line.itemType||(arr('products').length?'product':'service')),productId=line.product_id||line.productId||'',serviceId=line.service_id||line.serviceId||'',p=product(productId),s=byId(arr('services'),serviceId),linePrice=line[kind==='purchase'?'unit_cost':'unit_price']??line[kind==='purchase'?'unitCost':'unitPrice']??(type==='service'?s?.unit_price:kind==='purchase'?p?.purchase_price:p?.selling_price)??'';
  const lineDiscount=line.discount_percent??line.discountPercent??0,serviceTitle=line.service_title||line.serviceTitle||s?.title||'',serviceDescription=line.service_description||line.serviceDescription||s?.description||'',productDescription=line.productDescription||(line.description&&line.description!==p?.name?line.description:'')||p?.description||'';
  const canSaveServices=Boolean(state.access?.user?.isSuper||state.access?.permissions?.services?.create);
  const typePicker=kind==='purchase'?'':`<div class="line-kind-row"><select class="line-type" aria-label="Item type"><option value="product" ${type==='product'?'selected':''}>Product</option><option value="service" ${type==='service'?'selected':''}>Service</option></select></div>`;
  const productFields=`<div class="line-detail product-detail" ${type==='product'?'':'hidden'}><select class="line-select line-product" aria-label="Product"><option value="">Choose a product…</option>${arr('products').map(x=>`<option value="${esc(x.id)}" data-price="${x.selling_price}" data-cost="${x.purchase_price}" data-quantity="${x.quantity}" data-description="${esc(x.description||'')}" ${x.id===productId?'selected':''}>${esc(x.name)} · ${esc(x.sku)}${kind==='invoice'?` · ${Number(x.quantity)} in stock`:''}</option>`).join('')}</select><input class="line-description product-description" type="text" value="${esc(productDescription)}" placeholder="Product description (optional)" aria-label="Product description"></div>`;
  const serviceFields=`<div class="line-detail service-detail" ${type==='service'?'':'hidden'}><select class="line-select line-service" aria-label="Saved service"><option value="">Choose a saved service or type a new title…</option>${arr('services').map(x=>`<option value="${esc(x.id)}" data-price="${x.unit_price}" data-cost="${x.unit_cost}" data-title="${esc(x.title)}" data-description="${esc(x.description)}" ${x.id===serviceId?'selected':''}>${esc(x.title)}${x.code?` · ${esc(x.code)}`:''}</option>`).join('')}</select><input class="line-service-title" list="service-title-suggestions" type="text" value="${esc(serviceTitle)}" placeholder="Service title — type to search saved services" aria-label="Service title"><textarea class="line-service-description" rows="2" placeholder="Service description" aria-label="Service description">${esc(serviceDescription)}</textarea><label class="service-catalog-toggle"><input class="line-save-service" type="checkbox" ${line.serviceSaveToCatalog===false?'':'checked'} ${canSaveServices?'':'disabled'}> ${canSaveServices?'Save this title, description and price to the service catalog':'Service catalog saving is managed by an administrator'}</label></div>`;
  return `<tr class="line-row" data-kind="${kind}" data-item-type="${type}"><td class="line-item-cell">${typePicker}${productFields}${kind==='purchase'?'':serviceFields}</td><td><input class="line-qty" type="number" min="0.001" step="0.001" value="${esc(line.quantity??1)}" aria-label="Quantity"></td><td><input class="line-price" type="number" min="0" step="0.01" value="${esc(linePrice)}" placeholder="0.00" aria-label="Unit price"></td>${kind==='purchase'?'':`<td><input class="line-discount" type="number" min="0" max="100" step="0.01" value="${esc(lineDiscount)}" aria-label="Line discount percent"></td>`}<td class="line-total">${money((Number(line.quantity)||0)*(Number(linePrice)||0))}</td><td><button type="button" class="remove-line" data-action="remove-line" aria-label="Remove line">×</button></td></tr>`;
}
function linesEditor(kind,items=[]){
  const suggestions=kind==='purchase'?'':`<datalist id="service-title-suggestions">${arr('services').map(x=>`<option value="${esc(x.title)}" label="${esc(x.description||x.code||'Saved service')}"></option>`).join('')}</datalist>`;
  return `${suggestions}<div class="form-field full"><label>Line items <span class="required">*</span></label><div class="line-items-wrap"><table class="line-table"><thead><tr><th>${kind==='purchase'?'PRODUCT':'PRODUCT / SERVICE'}</th><th>QTY</th><th>${kind==='purchase'?'UNIT COST':'UNIT PRICE'}</th>${kind==='purchase'?'':'<th>DISC. %</th>'}<th>AMOUNT</th><th></th></tr></thead><tbody id="lineRows">${(items.length?items:[defaultLine()]).map(item=>lineRow(item,kind)).join('')}</tbody></table></div><button class="add-line-button" type="button" data-action="add-line">+ Add another item</button></div>${kind==='purchase'?'':`<div class="doc-tax-fields">${field('Document discount (%)','discountPercent','number','0')}${field('Tax rate (%)','taxRate','number','0')}</div>`}<div class="invoice-total-box"><div id="totalBreakdown" class="total-breakdown"></div><span>Document total</span><strong id="documentTotal">${money(0)}</strong></div>`;
}
function readLines(kind){
  const rows=$$('.line-row', $('#modalRoot')), lines=[];
  rows.forEach((row,index)=>{
    const itemType=kind==='purchase'?'product':($('.line-type',row)?.value||row.dataset.itemType||'product');
    const productId=$('.line-product',row)?.value||'', serviceSelectorId=$('.line-service',row)?.value||'', serviceTitle=($('.line-service-title',row)?.value||'').trim();
    const savedTitleMatch=itemType==='service'&&serviceTitle?arr('services').find(item=>String(item.title||'').trim().toLocaleLowerCase()===serviceTitle.toLocaleLowerCase()):null;
    const serviceId=serviceSelectorId||savedTitleMatch?.id||'';
    const quantity=$('.line-qty',row)?.value||''; let price=$('.line-price',row)?.value||'';
    if(itemType==='service'&&savedTitleMatch&&!String(price).trim())price=savedTitleMatch.unit_price||0;
    const touched=Boolean(productId||serviceId||serviceTitle||String(quantity).trim()||String(price).trim());
    if(!touched)return;
    if(itemType==='product'&&!productId)throw new Error(`Choose a product for line ${index+1}.`);
    if(itemType==='service'&&!serviceTitle)throw new Error(`Enter a service title for line ${index+1}.`);
    if(!(Number(quantity)>0))throw new Error(`Enter a quantity greater than zero for line ${index+1}.`);
    if(!(Number(price)>=0))throw new Error(`Enter a valid unit price for line ${index+1}.`);
    lines.push({itemType,productId,productDescription:$('.product-description',row)?.value||'',serviceId,serviceTitle,serviceDescription:$('.line-service-description',row)?.value||'',serviceSaveToCatalog:$('.line-save-service',row)?.checked!==false,quantity,[kind==='purchase'?'unitCost':'unitPrice']:price,unitCost:$('.line-service',row)?.selectedOptions[0]?.dataset.cost||undefined,discountPercent:$('.line-discount',row)?.value||0});
  });
  if(!lines.length)throw new Error('Add at least one line item by selecting a product or entering a service title.');
  return lines;
}
async function persistServiceCatalog(lines){
  const result=[];
  const canWrite=Boolean(state.access?.user?.isSuper||state.access?.permissions?.services?.create);
  for(const line of lines){
    if(!canWrite||line.itemType!=='service'||line.serviceSaveToCatalog===false||!line.serviceTitle){result.push(line);continue;}
    const title=line.serviceTitle.trim(), key=title.toLocaleLowerCase();
    const match=arr('services').find(item=>String(item.title||'').trim().toLocaleLowerCase()===key);
    const payload={code:match?.code||'',title,description:String(line.serviceDescription||''),unitPrice:Number(line.unitPrice)||0,unitCost:Number(line.unitCost)||Number(match?.unit_cost)||0};
    const saved=match?await api(`/api/services/${match.id}`,'PUT',payload):await api('/api/services','POST',payload);
    if(Array.isArray(state.data?.services)){
      const index=state.data.services.findIndex(item=>item.id===saved.id);
      if(index>=0)state.data.services[index]=saved;else state.data.services.push(saved);
    }
    result.push({...line,serviceId:saved.id,serviceSaveToCatalog:true});
  }
  return result;
}
function applySavedServiceTitle(row){
  const title=$('.line-service-title',row)?.value?.trim().toLocaleLowerCase();
  if(!title)return;
  const saved=arr('services').find(item=>String(item.title||'').trim().toLocaleLowerCase()===title);
  if(!saved)return;
  const selector=$('.line-service',row),description=$('.line-service-description',row),price=$('.line-price',row);
  if(selector)selector.value=saved.id;
  if(description&&!description.value)description.value=saved.description||'';
  if(price&&!String(price.value).trim())price.value=saved.unit_price||0;
  row.dataset.serviceCost=saved.unit_cost||0;
  updateLineTotals();
}
function updateLineTotals(){
  let subtotal=0,lineDiscounts=0;
  $$('.line-row', $('#modalRoot')).forEach(row=>{const qty=Number($('.line-qty',row)?.value)||0,price=Number($('.line-price',row)?.value)||0;const line=qty*price,discount=Math.round(line*(Number($('.line-discount',row)?.value)||0))/100;subtotal+=line;lineDiscounts+=discount;const cell=$('.line-total',row);if(cell)cell.textContent=money(line-discount);});
  const discountPercent=Number($('#f-discountPercent')?.value)||0,taxRate=Number($('#f-taxRate')?.value)||0,discount=lineDiscounts+Math.round((subtotal-lineDiscounts)*discountPercent)/100,tax=Math.round((subtotal-discount)*taxRate)/100,total=Math.round((subtotal-discount+tax)*100)/100;
  const breakdown=$('#totalBreakdown');if(breakdown)breakdown.innerHTML=`<span>Subtotal&nbsp; ${money(subtotal)}</span>${discount?`<span>Discount&nbsp; −${money(discount)}</span>`:''}${tax?`<span>Tax (${taxRate}%)&nbsp; ${money(tax)}</span>`:''}`;
  const output=$('#documentTotal');if(output)output.textContent=money(total);
}
function companyOptions(selected=''){
  return [{value:'',label:'Select a company or entity…'},...arr('companies').map(c=>({value:c.id,label:`${c.name}${Number(c.is_default)?' · Default':''}`}))].map(o=>`<option value="${esc(o.value)}" ${o.value===selected?'selected':''}>${esc(o.label)}</option>`).join('');
}
function companyPreviewMarkup(companyId){
  const c=company(companyId);if(!c)return '<div class="company-autofill empty-company">Select a company to load its document details.</div>';
  const logo=c.logo_data?`<img src="${esc(c.logo_data)}" alt="">`:`<span class="company-logo-fallback">${esc(initials(c.name).slice(0,1))}</span>`;
  const contacts=[c.address,c.contact_numbers,c.email,c.website].filter(Boolean).map(esc).join(' · ');
  const bank=[c.bank_name,c.bank_branch,c.account_holder,c.bank_account_number].filter(Boolean).map(esc).join(' · ');
  const receiver=c.receiver_key?`Receiver Key: ${esc(c.receiver_key)}`:'Receiver Key not entered — add it manually in Company Settings.';
  return `<div class="company-autofill"><span class="company-autofill-logo">${logo}</span><span class="company-autofill-copy"><strong>${esc(c.name)}</strong><small>${contacts||'Add this entity’s contact details in Company Settings.'}</small>${bank?`<small>${bank}</small>`:''}<small class="company-receiver-key">${receiver}</small></span></div>`;
}
function openCompanyForm(companyId=''){
  const existing=companyId?company(companyId):null;
  const logoMarkup=existing?.logo_data?`<div class="uploaded-logo-preview" id="logoPreview"><img src="${esc(existing.logo_data)}" alt="Current logo"><span>Current logo</span><button type="button" class="row-action danger-action" data-action="clear-company-logo" title="Remove logo">×</button></div>`:'<div class="uploaded-logo-preview" id="logoPreview" hidden></div>';
  const markup=`<div class="company-form-section"><h3>Company identity</h3><div class="form-grid">${field('Company or entity name','name','text',existing?.name||'',true,'full')}${field('Business address','address','text',existing?.address||'',false,'full')}<div class="form-field full"><label for="logoFile">Company logo <span class="field-hint">PNG, JPG, WebP or SVG · up to 4 MB</span></label>${existing?.logo_data?`<input id="f-logoData" name="logoData" type="hidden" value="${esc(existing.logo_data)}">`:''}<input id="logoFile" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"><span class="helper-caption">The source image is embedded at its original resolution and aspect ratio.</span>${logoMarkup}</div>${field('Contact numbers','contactNumbers','text',existing?.contact_numbers||'')}${field('Email address','email','email',existing?.email||'')}${field('Website','website','url',existing?.website||'')}${field('Tax or registration number','taxNumber','text',existing?.tax_number||'')}${field('Receiver Key','receiverKey','text',existing?.receiver_key??'',false,'full')}<div class="helper-caption form-field full receiver-key-help">Enter the Receiver Key manually. The application never generates, replaces or assigns this value.</div>${field('Other company information','additionalInfo','text',existing?.additional_info||'',false,'full')}</div></div><div class="company-form-section"><h3>Bank details protected by email OTP</h3><p>Normal profile changes save directly. If any bank detail changes, request a code using your current password and enter the code sent to your verified account email.</p><div class="form-grid">${field('Bank name','bankName','text',existing?.bank_name||'')}${field('Bank branch','bankBranch','text',existing?.bank_branch||'')}${field('Account holder name','accountHolder','text',existing?.account_holder||'')}${field('Account number','bankAccountNumber','text',existing?.bank_account_number||'')}<label>Current password<input name="currentPassword" type="password" autocomplete="current-password"></label><button class="button" type="button" data-action="request-bank-change-otp">Email bank-change code</button><p id="bankChangeOtpStatus" class="setup-help form-field full" aria-live="polite">The code is required only when bank information changes.</p><div id="bankChangeOtpFields" class="form-field full" hidden><label>Six-digit email code<input name="bankOtp" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" minlength="6" maxlength="6" disabled></label></div></div></div><div class="company-form-section"><h3>Default terms & conditions</h3><p>New documents copy these terms. You can edit the wording on each individual document.</p><div class="form-field"><textarea name="termsConditions" id="termsConditions" class="terms-large" placeholder="Enter payment terms, warranty, delivery and other conditions…">${esc(existing?.terms_conditions||'')}</textarea></div></div>`;
  showForm(existing?'Edit company profile':'Add company profile','Each entity has its own branding, contact details, bank instructions and document terms.',markup,async form=>api(existing?`/api/companies/${existing.id}`:'/api/companies',existing?'PUT':'POST',form),{wide:true,submit:'Save company'});
  const colorGrid=$('#f-address')?.closest('.form-grid');
  if(colorGrid){
    const colorField=document.createElement('div');
    colorField.className='form-field document-color-field';
    const selectedColor=/^#[0-9a-fA-F]{6}$/.test(existing?.document_color||'')?existing.document_color:'#1f5fae';
    colorField.innerHTML='<label for="f-documentColor">Invoice / document color <span class="field-hint">Used for invoice and quotation headings, rules and table headers</span></label><div class="document-color-control"><input id="f-documentColor" name="documentColor" type="color" value="'+esc(selectedColor)+'"><output id="documentColorValue">'+esc(selectedColor.toUpperCase())+'</output></div>';
    colorGrid.append(colorField);
    $('#f-documentColor')?.addEventListener('input',event=>{const output=$('#documentColorValue');if(output){const value=String(event.target.value||'').toUpperCase();output.value=value;output.textContent=value;}});
  }
  $('#logoFile')?.addEventListener('change',()=>{
    const chosen=$('#logoFile').files?.[0];if(!chosen)return;
    const modal=state.modal,request=(modal.logoRequest||0)+1;modal.logoRequest=request;modal.logoError='';
    if(chosen.size>4*1024*1024){$('#logoFile').value='';modal.logoError='Choose a company logo no larger than 4 MB.';toast(modal.logoError,true);return;}
    if(!['image/png','image/jpeg','image/webp','image/svg+xml'].includes(chosen.type)){$('#logoFile').value='';modal.logoError='Choose a PNG, JPG, WebP or SVG company logo.';toast(modal.logoError,true);return;}
    const reader=new FileReader();
    modal.logoRead=new Promise(resolve=>{
      reader.onload=()=>{
        if(state.modal===modal&&modal.logoRequest===request){
          let hidden=$('#f-logoData');if(!hidden){hidden=document.createElement('input');hidden.type='hidden';hidden.name='logoData';hidden.id='f-logoData';$('#modalForm').append(hidden);}
          hidden.value=String(reader.result||'');
          const preview=$('#logoPreview');preview.hidden=false;
          preview.innerHTML='<img src="'+esc(hidden.value)+'" alt="Logo preview"><span>Logo preview</span><button type="button" class="row-action danger-action" data-action="clear-company-logo" title="Remove logo">×</button>';
        }
        resolve();
      };
      reader.onerror=()=>{if(state.modal===modal&&modal.logoRequest===request){modal.logoError='Could not read the selected company logo. Choose it again before saving.';toast(modal.logoError,true);}resolve();};
    });
    reader.readAsDataURL(chosen);
  });
}
function openInvoiceForm(customerId='', invoiceId=''){
  if(!arr('customers').length){toast('Add a customer before creating an invoice.',true);setView('customers');return;}
  if(!arr('companies').length){toast('Add a company profile before creating an invoice.',true);setView('settings');return;}
  const existing=invoiceId?byId(arr('invoices'),invoiceId):null;
  if(invoiceId&&!existing){toast('Invoice not found.',true);return;}
  const lockReason=existing&&invoiceEditLockReason(existing);
  if(lockReason){toast(lockReason,true);return;}
  const options=[{value:'',label:'Select a customer…'},...arr('customers').map(c=>({value:c.id,label:c.name}))];
  const entity=existing?.company_id||defaultCompany().id,terms=existing?.terms??company(entity)?.terms_conditions??'';
  const project=existing?.project_key?arr('projects').find(p=>p.project_key===existing.project_key):null;
  const markup=`<div class="inline-note">${existing?'This unpaid invoice can be edited safely. Product stock is restored and re-applied inside one transaction; its number, company and Project Key stay unchanged.':'Saving an invoice reduces product stock, records any payment received and connects all project costs to its Project Key.'}</div><div class="form-grid"><div class="form-field"><label for="f-companyId">Company / entity <span class="required">*</span></label><select id="f-companyId" name="companyId" required ${existing?'disabled':''}>${companyOptions(entity)}</select>${existing?`<input type="hidden" name="companyId" value="${esc(entity)}">`:''}</div>${selectField('Bill to','customerId',options,existing?.customer_id||customerId)}${field('Project name','projectName','text',project?.title||'',false,'full')}<div class="form-field full" id="companyPreview">${companyPreviewMarkup(entity)}</div>${field('Invoice date','invoiceDate','date',existing?.invoice_date||todayISO(),true)}${field('Due date','dueDate','date',existing?.due_date||'',false)}${existing?'':`${field('Amount received now','paidAmount','number',0,false)}${selectField('Payment method','paymentMethod',[{value:'Cash',label:'Cash'},{value:'Bank transfer',label:'Bank transfer'},{value:'Card',label:'Card'},{value:'Mobile payment',label:'Mobile payment'},{value:'Cheque',label:'Cheque'}],'Cash',false)}`}<div class="form-field full"><label for="f-notes">Notes</label><textarea id="f-notes" name="notes" placeholder="Delivery or payment details…">${esc(existing?.notes||'')}</textarea></div><div class="form-field full"><label for="f-terms">Terms & conditions <span class="field-hint">Copied from the selected company · editable for this invoice</span></label><textarea id="f-terms" name="terms" class="terms-document" placeholder="Terms for this invoice…">${esc(terms)}</textarea></div>${linesEditor('invoice',existing?invoiceItems(existing.id):[])}</div>`;
  showForm(existing?'Edit invoice':'Create invoice',existing?'Update this unpaid invoice without changing its accounting identity.':'A new sale will be linked to this customer and deduct its products from inventory.',markup,async form=>{const items=await persistServiceCatalog(readLines('invoice'));const body={...form,items};return api(existing?`/api/invoices/${existing.id}`:'/api/invoices',existing?'PUT':'POST',body);},{wide:true,submit:existing?'Save invoice':'Create invoice'});
  updateLineTotals();
}
function openInvoiceEdit(invoiceId){openInvoiceForm('',invoiceId);}
function openQuoteForm(quoteId=''){
  if(!arr('customers').length){toast('Add a customer before creating a quotation.',true);return;}
  if(!arr('companies').length){toast('Add a company profile before creating a quotation.',true);setView('settings');return;}
  const existing=quoteId?byId(arr('quotations'),quoteId):null;
  const options=[{value:'',label:'Select a customer…'},...arr('customers').map(c=>({value:c.id,label:c.name}))];
  const entity=existing?.company_id||defaultCompany().id,terms=existing?.terms??company(entity)?.terms_conditions??'',discountPercent=Number(existing?.discount_rate)||0;
  const markup=`<div class="form-grid"><div class="form-field"><label for="f-companyId">Company / entity <span class="required">*</span></label><select id="f-companyId" name="companyId" required>${companyOptions(entity)}</select></div>${selectField('Customer','customerId',options,existing?.customer_id||'')}${selectField('Document type','documentType',[{value:'quotation',label:'Quotation'},{value:'estimate',label:'Estimate'}],existing?.document_type||'quotation')}<div class="form-field full" id="companyPreview">${companyPreviewMarkup(entity)}</div>${field('Project name','projectName','text',existing?.project_key?byId(arr('projects'),arr('projects').find(p=>p.project_key===existing.project_key)?.id)?.title||'':'',false,'full')}<div class="helper-caption form-field full">Project Key is generated when you save and remains the same when this document is converted to an invoice.</div>${field('Quote date','quoteDate','date',existing?.quote_date||todayISO(),true)}${field('Valid until','validUntil','date',existing?.valid_until||'')}${selectField('Status','status',[{value:'draft',label:'Draft'},{value:'sent',label:'Sent'}],existing?.status||'draft',false)}<div class="form-field"><label for="f-notes">Notes</label><input id="f-notes" name="notes" value="${esc(existing?.notes||'')}" placeholder="Delivery or reference details…"></div><div class="form-field full"><label for="f-terms">Terms & conditions <span class="field-hint">Copied from the selected company · editable for this document</span></label><textarea id="f-terms" name="terms" class="terms-document">${esc(terms)}</textarea></div>${linesEditor('quotation',existing?quoteItems(existing.id):[])}</div>`;
  showForm(existing?'Edit quotation':'New quotation','Prepare a clear quotation or estimate. Products update stock only after conversion to an invoice; services never affect stock.',markup,async form=>api(existing?`/api/quotations/${existing.id}`:'/api/quotations',existing?'PUT':'POST',{...form,items:await persistServiceCatalog(readLines('quotation'))}),{wide:true,submit:existing?'Save document':'Create document'});
  $('#f-discountPercent').value=String(discountPercent);$('#f-taxRate').value=String(existing?.tax_rate||0);updateLineTotals();
}
function openPurchaseForm(){
  if(!arr('suppliers').length||!arr('products').length){toast('Add a supplier and at least one product before recording a purchase.',true);return;}
  if(!arr('companies').length){toast('Add a company profile before recording a purchase.',true);setView('settings');return;}
  const options=[{value:'',label:'Select a supplier…'},...arr('suppliers').map(s=>({value:s.id,label:s.name}))];
  const entity=defaultCompany().id,terms=company(entity)?.terms_conditions||'';
  const markup=`<div class="inline-note">Stock increases as soon as this purchase is saved. Product purchase costs update using weighted average.</div><div class="form-grid"><div class="form-field"><label for="f-companyId">Company / entity <span class="required">*</span></label><select id="f-companyId" name="companyId" required>${companyOptions(entity)}</select></div>${selectField('Supplier','supplierId',options)}<div class="form-field full" id="companyPreview">${companyPreviewMarkup(entity)}</div>${field('Purchase date','purchaseDate','date',todayISO(),true)}${field('Amount paid now','paidAmount','number',0)}${selectField('Payment method','paymentMethod',[{value:'Cash',label:'Cash'},{value:'Bank transfer',label:'Bank transfer'},{value:'Card',label:'Card'},{value:'Cheque',label:'Cheque'}],'Cash',false)}<div class="form-field full"><label for="f-notes">Supplier reference or notes</label><textarea id="f-notes" name="notes" placeholder="Supplier invoice number or delivery details…"></textarea></div><div class="form-field full"><label for="f-terms">Purchase terms <span class="field-hint">Copied from the selected company · editable for this order</span></label><textarea id="f-terms" name="terms" class="terms-document">${esc(terms)}</textarea></div>${linesEditor('purchase')}</div>`;
  showForm('Record purchase','Enter the goods received and any supplier payment made today.',markup,async form=>api('/api/purchases','POST',{...form,items:readLines('purchase')}),{wide:true,submit:'Receive stock'});
}
function expenseAllocationRow(allocation={}){
  const options=['<option value="">Choose a project…</option>',...arr('projects').map(project=>`<option value="${esc(project.project_key)}" ${project.project_key===allocation.project_key?'selected':''}>${esc(project.project_key+(project.title?' · '+project.title:''))}</option>`)].join('');
  return `<div class="expense-allocation-row"><select class="expense-allocation-project" aria-label="Allocated project">${options}</select><input class="expense-allocation-amount" type="number" min="0.01" step="0.01" value="${esc(allocation.amount??'')}" placeholder="Amount" aria-label="Allocated amount"><button class="row-action danger-action" type="button" data-action="remove-expense-allocation" title="Remove project allocation">×</button></div>`;
}
function currentExpenseFormTotal(){
  if($('#f-expenseType')?.value==='labour'){const n=name=>Number($(`#f-${name}`)?.value)||0;return n('workerCount')*($('#f-labourRateUnit')?.value==='hour'?n('workingHours'):n('workingDays'))*n('labourRate')+n('additionalLabour');}
  return Number($('#f-amount')?.value)||0;
}
function expenseInvoiceRow(invoiceId=''){
  const options=['<option value="">Choose an invoice…</option>',...arr('invoices').map(invoice=>`<option value="${esc(invoice.id)}" ${invoice.id===invoiceId?'selected':''}>${esc(invoice.number+(customer(invoice.customer_id)?.name?' · '+customer(invoice.customer_id).name:''))}</option>`)].join('');
  return `<div class="expense-invoice-row"><select class="expense-invoice-select" aria-label="Linked invoice">${options}</select><button class="row-action danger-action" type="button" data-action="remove-expense-invoice" title="Remove invoice link">×</button></div>`;
}
function syncExpenseAllocationSummary(){const node=$('#expenseAllocationSummary');if(!node)return;const total=currentExpenseFormTotal(),allocated=$$('.expense-allocation-amount',$('#expenseProjectAllocations')).reduce((sum,input)=>sum+(Number(input.value)||0),0),remaining=Math.round((total-allocated)*100)/100;node.textContent=!$$('.expense-allocation-row',$('#expenseProjectAllocations')).length?'No project allocation — this remains a general company expense.':`Expense ${money(total)} · allocated ${money(allocated)} · ${Math.abs(remaining)<0.01?'fully allocated':money(Math.abs(remaining))+(remaining>0?' still to allocate':' over-allocated')}`;node.classList.toggle('form-error',Math.abs(remaining)>=0.01&&allocated>0);}
function setSingleExpenseAllocation(projectKey){const host=$('#expenseProjectAllocations');if(!host)return;host.innerHTML=expenseAllocationRow({project_key:projectKey,amount:currentExpenseFormTotal()||''});syncExpenseAllocationSummary();}
function openEntityForm(type,id=''){
  const existing=id?byId(arr(type==='customer'?'customers':type==='supplier'?'suppliers':type==='product'?'products':type==='service'?'services':type==='expense'?'expenses':'partners'),id):null;
  let title='',subtitle='',markup='',endpoint='',method=existing?'PUT':'POST',body={};
  if(type==='customer'||type==='supplier'){
    title=existing?`Edit ${type}`:`Add ${type}`;subtitle=`Keep the ${type}'s contact details ready for transactions.`;
    markup=`<div class="form-grid">${field('Name','name','text',existing?.name||'',true,'full')}${field('Phone number','phone','tel',existing?.phone||'')}${field('Email address','email','email',existing?.email||'')}${field('Address','address','text',existing?.address||'',false,'full')}</div>`;
    endpoint=`/api/${type==='customer'?'customers':'suppliers'}${existing?`/${existing.id}`:''}`;body=f=>f;
  } else if(type==='product'){
    title=existing?'Edit product':'Add product';subtitle=existing?'Change product details, pricing or correct its on-hand quantity.':'Set the product’s pricing and opening stock.';
    markup=`<div class="form-grid">${field('Product name','name','text',existing?.name||'',true,'full')}${field('SKU or product code','sku','text',existing?.sku||'',true)}${field('Category','category','text',existing?.category||'General')}${field('Unit','unit','text',existing?.unit||'each',true)}${field('Reorder when at','reorderLevel','number',existing?.reorder_level??5,true)}${field(existing?'On-hand quantity':'Opening stock','quantity','number',existing?.quantity??0,true)}${field('Purchase price / unit','purchasePrice','number',existing?.purchase_price??0,true)}${field('Selling price / unit','sellingPrice','number',existing?.selling_price??0,true)}<div class="form-field full"><label for="f-description">Product description</label><textarea id="f-description" name="description">${esc(existing?.description||'')}</textarea></div></div>`;
    endpoint=`/api/products${existing?`/${existing.id}`:''}`;method=existing?'PUT':'POST';body=f=>({name:f.name,sku:f.sku,category:f.category,unit:f.unit,reorderLevel:f.reorderLevel,quantity:f.quantity,purchasePrice:f.purchasePrice,sellingPrice:f.sellingPrice,description:f.description});
  } else if(type==='service'){
    title=existing?'Edit service':'Add service';subtitle='Service charges are saved on document lines and do not change product stock.';
    markup=`<div class="form-grid">${field('Service title','title','text',existing?.title||'',true,'full')}${field('Service code','code','text',existing?.code||'')}${field('Unit charge','unitPrice','number',existing?.unit_price??0,true)}${field('Estimated unit cost','unitCost','number',existing?.unit_cost??0,true)}<div class="form-field full"><label for="f-description">Service description</label><textarea id="f-description" name="description">${esc(existing?.description||'')}</textarea></div></div>`;
    endpoint=`/api/services${existing?`/${existing.id}`:''}`;body=f=>f;
  } else if(type==='expense'){
    title=existing?'Edit expense':'Add expense';subtitle='Record one cost once and optionally link it to multiple invoices. Quotations are not linked because they are not paid documents.';
    const categories=arr('expense_categories').map(x=>x.name),invoiceIds=existing?expenseInvoiceIds(existing):[];
    markup=`<div class="form-grid">${selectField('Expense type','expenseType',[{value:'general',label:'General expense'},{value:'labour',label:'Labour / employee cost'}],existing?.expense_type||'general')}${selectField('Category','category',[...categories.map(x=>({value:x,label:x})),...(!categories.includes(existing?.category)?[{value:existing?.category,label:existing?.category}]:[])],existing?.category||'Other')}<div class="form-field full"><label>Linked invoices <span class="field-hint">Optional — invoices only; quotations cannot be linked</span></label><div id="expenseInvoiceLinks" class="expense-invoice-list">${invoiceIds.map(expenseInvoiceRow).join('')}</div><button class="button small" type="button" data-action="add-expense-invoice">+ Add invoice</button><p class="setup-help">These are reference links. The full expense total is counted once even when several invoices are selected.</p></div>${selectField('Customer','customerId',[{value:'',label:'No customer selected'},...arr('customers').map(c=>({value:c.id,label:c.name}))],existing?.customer_id||'',false)}${selectField('Supplier / vendor','supplierId',[{value:'',label:'No supplier selected'},...arr('suppliers').map(s=>({value:s.id,label:s.name}))],existing?.supplier_id||'',false)}${field('Description','description','text',existing?.description||'',true,'full')}<div class="labour-fields form-field full" ${existing?.expense_type==='labour'?'':'hidden'}><div class="form-grid labour-grid">${field('Number of workers','workerCount','number',existing?.worker_count||1,false)}${field('Worker names','workerNames','text',existing?.worker_names||'',false)}${field('Working days','workingDays','number',existing?.working_days||0,false)}${field('Hours per worker','workingHours','number',existing?.working_hours||0,false)}${field('Rate per worker','labourRate','number',existing?.labour_rate||0,false)}${selectField('Rate is per','labourRateUnit',[{value:'day',label:'Day'},{value:'hour',label:'Hour'}],existing?.labour_rate_unit||'day',false)}${field('Additional labour cost','additionalLabour','number',existing?.additional_labour||0,false)}<div class="form-field"><label>Calculated labour total</label><div class="calculated-labour" id="calculatedLabour">${money(existing?.amount||0)}</div></div></div></div><div class="general-expense-fields" ${existing?.expense_type==='labour'?'hidden':''}>${field('Amount','amount','number',existing?.expense_type==='labour'?'':existing?.amount||'',true)}</div>${field('Date','expenseDate','date',existing?.expense_date||todayISO(),true)}${selectField('Payment method','paymentMethod',[{value:'Cash',label:'Cash'},{value:'Bank transfer',label:'Bank transfer'},{value:'Card',label:'Card'},{value:'Mobile payment',label:'Mobile payment'},{value:'Cheque',label:'Cheque'}],existing?.payment_method||'Cash',false)}<div class="form-field full"><label for="expenseFiles">Bills and receipts <span class="field-hint">PDF, JPG, JPEG, PNG · up to 6 MB each</span></label><input type="file" id="expenseFiles" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" multiple><div id="expenseFileList" class="uploaded-logo-preview">${arr('expense_attachments').filter(a=>a.expense_id===existing?.id).map(a=>`<a href="${apiUrl('/api/expense-attachments/'+a.id)}" target="_blank">${esc(a.file_name)}</a>`).join(' · ')||'No files selected'}</div></div><div class="form-field full"><label for="f-notes">Notes</label><textarea id="f-notes" name="notes" placeholder="Optional details…">${esc(existing?.notes||'')}</textarea></div></div>`;
    endpoint=`/api/expenses${existing?`/${existing.id}`:''}`;body=async f=>{const files=[...($('#expenseFiles')?.files||[])],invoiceIds=$$('.expense-invoice-select',$('#expenseInvoiceLinks')).map(select=>select.value).filter(Boolean);const attachments=await Promise.all(files.map(file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve({name:file.name,type:file.type,data:String(reader.result||'')});reader.onerror=()=>reject(new Error(`Could not read ${file.name}.`));reader.readAsDataURL(file);})));return {...f,invoiceIds,attachments};};
  } else if(type==='partner'){
    title=existing?'Edit partner':'Add partner';subtitle='The share percentage is applied to each saved profit distribution.';
    markup=`<div class="form-grid">${field('Partner name','name','text',existing?.name||'',true,'full')}${field('Email address','email','email',existing?.email||'')}${field('Profit share (%)','sharePercent','number',existing?.share_percent??0,true)}<div class="helper-caption form-field full">Combined partner percentages should not exceed 100%. Any unallocated profit remains in the business.</div></div>`;
    endpoint=`/api/partners${existing?`/${existing.id}`:''}`;body=f=>f;
  }
  showForm(title,subtitle,markup,async form=>api(endpoint,method,await body(form)),{submit:type==='product'?'Save product':type==='expense'?'Save expense':type==='service'?'Save service':existing?'Save changes':`Add ${type}`});
  $('#expenseFiles')?.addEventListener('change',()=>{const list=$('#expenseFileList');if(list)list.innerHTML=[...$('#expenseFiles').files].map(f=>`<span>${esc(f.name)} · ${(f.size/1024/1024).toFixed(1)} MB</span>`).join('<br>')||'No files selected';});
  if(type==='expense')syncExpenseAllocationSummary();
}
function openStockAdjust(productId=''){
  const products=[...arr('products')];if(!products.length){toast('Add a product first.',true);return;}
  const markup=`<div class="form-grid">${selectField('Product','productId',[{value:'',label:'Select a product…'},...products.map(p=>({value:p.id,label:`${p.name} · ${p.quantity} in stock`}))],productId)}${selectField('Movement','direction',[{value:'in',label:'Stock in · increase quantity'},{value:'out',label:'Stock out · reduce quantity'}],'in')}${field('Quantity','quantity','number',1,true)}${field('Date','date','date',todayISO(),true)}${field('Reason','notes','text','Stock count adjustment',true,'full')}</div>`;
  showForm('Adjust stock','Record returned, damaged, missing or manually counted stock.',markup,async form=>api('/api/stock-adjustments','POST',form),{submit:'Save adjustment'});
}
function openPaymentForm(kind='customer',invoiceId=''){
  if(kind==='customer'){
    const open=arr('invoices').filter(i=>invoiceBalance(i)>0);
    const opts=[{value:'',label:'Select an outstanding invoice…'},...open.map(i=>({value:i.id,label:`${i.number} · ${customer(i.customer_id)?.name||''} · ${money(invoiceBalance(i))} due`}))];
    const selected=invoiceId||open[0]?.id||'';
    const markup=`<div class="form-grid">${selectField('Invoice','invoiceId',opts,selected)}${field('Payment date','paymentDate','date',todayISO(),true)}${field('Amount received','amount','number',selected?invoiceBalance(byId(arr('invoices'),selected)):0,true)}${selectField('Payment method','method',[{value:'Cash',label:'Cash'},{value:'Bank transfer',label:'Bank transfer'},{value:'Card',label:'Card'},{value:'Mobile payment',label:'Mobile payment'},{value:'Cheque',label:'Cheque'}],'Cash')}${field('Reference','reference','text','','','full')}${field('Notes','notes','text','','','full')}<div class="helper-caption form-field full">If more is received than the invoice balance, the extra is recorded as a customer credit.</div></div>`;
    showForm('Record customer payment','Apply a receipt to an invoice and update its outstanding balance.',markup,async form=>api('/api/payments','POST',form),{submit:'Save payment'});
  }else{
    const vendors=arr('suppliers');if(!vendors.length){toast('Add a supplier before recording a supplier payment.',true);return;}
    const markup=`<div class="form-grid">${selectField('Supplier','supplierId',[{value:'',label:'Select a supplier…'},...vendors.map(s=>({value:s.id,label:s.name}))],'')}${selectField('Link to purchase','purchaseId',[{value:'',label:'Supplier account credit'} ,...arr('purchases').filter(p=>p.total>purchasePaid(p.id)).map(p=>({value:p.id,label:`${p.number} · ${supplier(p.supplier_id)?.name||''} · ${money(Math.max(0,p.total-purchasePaid(p.id)))} due`}))],'',false)}${field('Payment date','paymentDate','date',todayISO(),true)}${field('Amount paid','amount','number',0,true)}${selectField('Payment method','method',[{value:'Cash',label:'Cash'},{value:'Bank transfer',label:'Bank transfer'},{value:'Card',label:'Card'},{value:'Cheque',label:'Cheque'}],'Bank transfer')}${field('Reference','reference','text','','','full')}${field('Notes','notes','text','','','full')}<div class="helper-caption form-field full">Choose an invoice to update its payment status, or leave it on account as a supplier credit.</div></div>`;
    showForm('Record supplier payment','Record a payment to a vendor and update the outstanding amount.',markup,async form=>api('/api/supplier-payments','POST',form),{submit:'Save payment'});
  }
}
function openGenerateShares(){
  const markup=`<div class="form-grid">${field('Period starts','periodStart','date',monthStart(),true)}${field('Period ends','periodEnd','date',todayISO(),true)}<div class="form-field full"><div class="inline-note">Calculation order: invoice revenue − product/service costs − all expenses − each project’s company percentage = distributable profit. Partner percentages are then applied to that remainder. Negative profit produces no distribution.</div></div></div>`;
  showForm('Calculate partner shares','Save each partner’s share after expenses and the company’s per-project retention.',markup,async form=>api('/api/profit-shares/generate','POST',form),{submit:'Calculate shares'});
}

function documentHeader(profile,kind,number,date,secondaryLabel='',secondaryDate=''){
  const logo=profile?.logo_data?`<img src="${esc(profile.logo_data)}" alt="${esc(profile.name)} logo">`:`<span class="doc-logo-fallback">${esc(initials(profile?.name).slice(0,1))}</span>`;
  const contacts=[profile?.contact_numbers,profile?.email,profile?.website].filter(Boolean).map(esc).join(' · ');
  const primaryDate=kind==='INVOICE'?'Invoice date':kind==='QUOTATION'?'Quote date':kind==='PURCHASE ORDER'?'Order date':'Payment date';
  return `<header class="doc-company-header"><div class="doc-brand-block"><div class="doc-logo-box">${logo}</div><div class="doc-company-copy"><h1>${esc(profile?.name||'Company')}</h1><p>${esc(profile?.address||'')}</p><p>${contacts}</p>${profile?.tax_number?`<p>Registration no. ${esc(profile.tax_number)}</p>`:''}</div></div><div class="doc-identification"><span class="doc-type">${esc(kind)}</span><strong>${esc(number)}</strong><p>${primaryDate}: ${dateFmt(date)}</p>${secondaryDate?`<p>${esc(secondaryLabel)}: ${dateFmt(secondaryDate)}</p>`:''}</div></header><div class="doc-red-rule"></div>`;
}
function documentRecipient(label,person,metaTitle,metaContent=''){
  return `<section class="doc-recipient-row"><div class="doc-recipient"><span class="doc-section-kicker">${esc(label)}</span><strong>${esc(person?.name||'')}</strong><p>${esc(person?.address||'')}</p><p>${[person?.phone,person?.email].filter(Boolean).map(esc).join(' · ')}</p></div><div class="doc-recipient-meta"><span class="doc-section-kicker">${esc(metaTitle)}</span>${metaContent}</div></section>`;
}
function documentItemTable(lines,kind='invoice'){
  const purchase=kind==='purchase';
  return `<table class="doc-items-table"><thead><tr><th class="doc-number-col">#</th><th>Item / description</th><th class="doc-qty-col">Qty</th><th class="doc-price-col">Unit price (${esc(settings().currency)})</th>${purchase?'':'<th class="doc-discount-col">Discount</th>'}<th class="doc-total-col">Amount (${esc(settings().currency)})</th></tr></thead><tbody>${lines.map((x,index)=>{const p=product(x.product_id),service=x.item_type==='service',title=service?(x.service_title||x.description||'Service'):(x.description||p?.name||'Product'),description=service?(x.service_description||''):(x.service_description||p?.description||''),sku=x.item_code||p?.sku||'',unitPrice=purchase?x.unit_cost:x.unit_price,discount=Number(x.discount_amount)||0;return `<tr><td class="doc-number-col">${index+1}</td><td><strong>${esc(title)}</strong>${service?'<small class="item-type-label">SERVICE</small>':`<small class="item-type-label">PRODUCT${sku?` · SKU ${esc(sku)}`:''}</small>`}${description?`<small>${esc(description)}</small>`:''}</td><td class="doc-qty-col">${Number(x.quantity).toLocaleString()}</td><td class="doc-price-col">${money(unitPrice)}</td>${purchase?'':`<td class="doc-discount-col">${discount?`−${money(discount)}<small>${Number(x.discount_percent||0)}%</small>`:'—'}</td>`}<td class="doc-total-col">${money(Number(x.line_total)-discount)}</td></tr>`;}).join('')}</tbody></table>`;
}
function documentTotals(doc,title='Grand total'){
  const subtotal=Number(doc.subtotal??doc.total),discount=Number(doc.discount_amount)||0,tax=Number(doc.tax_amount)||0,rate=Number(doc.tax_rate)||0;
  return `<section class="doc-totals"><div class="doc-total-row"><span>Subtotal</span><strong>${money(subtotal)}</strong></div>${discount?`<div class="doc-total-row"><span>Discount</span><strong>−${money(discount)}</strong></div>`:''}${tax?`<div class="doc-total-row"><span>Tax (${rate}%)</span><strong>${money(tax)}</strong></div>`:''}<div class="doc-total-row doc-grand-total"><span>${esc(title)}</span><strong>${money(doc.total)}</strong></div></section>`;
}
function bankInstructions(profile,number){
  const items=[['Bank',profile?.bank_name],['Branch',profile?.bank_branch],['Account holder',profile?.account_holder],['Account number',profile?.bank_account_number]].filter(x=>x[1]);
  if(!items.length)return '';
  return `<section class="doc-bank-block"><div><span class="doc-section-kicker">PAYMENT INSTRUCTIONS</span><strong>Bank transfer</strong><p>Please include reference <b>${esc(number)}</b> with your payment.</p></div><div class="doc-bank-details">${items.map(([label,value])=>`<div><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('')}</div></section>`;
}
function documentTerms(terms){return terms?`<section class="doc-terms"><span class="doc-section-kicker">TERMS & CONDITIONS</span><div>${esc(terms).replace(/\r?\n/g,'<br>')}</div></section>`:'';}
function documentFooter(profile){return `<footer class="doc-print-footer"><span>${esc(profile?.name||'')}</span><span>Thank you for your business.</span></footer>`;}
function documentShell(profile,kind,number,date,secondLabel,secondDate,content){
  const accent=/^#[0-9a-fA-F]{6}$/.test(profile?.document_color||'')?profile.document_color:'#1f5fae';
  return `<div class="print-wrap"><article class="print-document pdf-document" style="--document-accent:${esc(accent)}">${documentHeader(profile,kind,number,date,secondLabel,secondDate)}<main class="doc-body">${content}</main>${documentFooter(profile)}</article></div>`;
}
function invoicePrintMarkup(inv){
  const c=customer(inv.customer_id),profile=company(inv.company_id),lines=invoiceItems(inv.id);
  const status=`<div class="doc-status">${badge(inv.status)}<p>Received: ${money(invoicePaid(inv.id))}<br>Balance due: ${money(invoiceBalance(inv))}${invoiceCredit(inv)?`<br>Customer credit: ${money(invoiceCredit(inv))}`:''}</p></div>`;
  const meta=`<div class="doc-reference-pair"><span>Invoice number</span><strong>${esc(inv.number)}</strong></div><div class="doc-reference-pair"><span>Project Key</span><strong>${esc(inv.project_key||'—')}</strong></div><div class="doc-reference-pair"><span>Issued</span><strong>${dateFmt(inv.invoice_date)}</strong></div><div class="doc-reference-pair"><span>Payment due</span><strong>${dateFmt(inv.due_date)}</strong></div>${status}`;
  const content=`${documentRecipient('BILL TO',c,'INVOICE DETAILS',meta)}${documentItemTable(lines)}${documentTotals(inv)}${inv.notes?`<section class="doc-notes"><span class="doc-section-kicker">NOTES</span><div>${esc(inv.notes).replace(/\r?\n/g,'<br>')}</div></section>`:''}${bankInstructions(profile,inv.number)}${documentTerms(inv.terms)}`;
  return documentShell(profile,'INVOICE',inv.number,inv.invoice_date,'Due date',inv.due_date,content);
}
function quotePrintMarkup(quote){
  const c=customer(quote.customer_id),profile=company(quote.company_id),lines=quoteItems(quote.id);
  const meta=`<div class="doc-reference-pair"><span>${quote.document_type==='estimate'?'Estimate':'Quotation'} number</span><strong>${esc(quote.number)}</strong></div><div class="doc-reference-pair"><span>Project Key</span><strong>${esc(quote.project_key||'—')}</strong></div><div class="doc-reference-pair"><span>Prepared</span><strong>${dateFmt(quote.quote_date)}</strong></div><div class="doc-reference-pair"><span>Valid until</span><strong>${dateFmt(quote.valid_until)}</strong></div>`;
  const content=`${documentRecipient('PREPARED FOR',c,'QUOTATION DETAILS',meta)}${documentItemTable(lines)}${documentTotals(quote,'Quotation total')}${quote.notes?`<section class="doc-notes"><span class="doc-section-kicker">NOTES</span><div>${esc(quote.notes).replace(/\r?\n/g,'<br>')}</div></section>`:''}${bankInstructions(profile,quote.number)}${documentTerms(quote.terms)}`;
  return documentShell(profile,quote.document_type==='estimate'?'ESTIMATE':'QUOTATION',quote.number,quote.quote_date,'Valid until',quote.valid_until,content);
}
function purchasePrintMarkup(purchase){
  const vendor=supplier(purchase.supplier_id),profile=company(purchase.company_id),lines=purchaseItems(purchase.id);
  const meta=`<div class="doc-reference-pair"><span>Order number</span><strong>${esc(purchase.number)}</strong></div><div class="doc-reference-pair"><span>Order date</span><strong>${dateFmt(purchase.purchase_date)}</strong></div>`;
  const content=`${documentRecipient('SUPPLIER',vendor,'ORDER DETAILS',meta)}${documentItemTable(lines,'purchase')}${documentTotals({subtotal:purchase.total,total:purchase.total},'Order total')}${purchase.notes?`<section class="doc-notes"><span class="doc-section-kicker">NOTES</span><div>${esc(purchase.notes).replace(/\r?\n/g,'<br>')}</div></section>`:''}${documentTerms(purchase.terms)}`;
  return documentShell(profile,'PURCHASE ORDER',purchase.number,purchase.purchase_date,'','',content);
}
function receiptPrintMarkup(payment){
  const invoice=byId(arr('invoices'),payment.invoice_id),profile=company(invoice?.company_id),c=customer(payment.customer_id);
  if(!invoice)return '<div class="empty-row">The invoice connected to this receipt could not be found.</div>';
  const remaining=invoiceBalance(invoice),credit=invoiceCredit(invoice);
  const meta=`<div class="doc-reference-pair"><span>Receipt number</span><strong>RCT-${esc(payment.id.slice(0,8).toUpperCase())}</strong></div><div class="doc-reference-pair"><span>Payment date</span><strong>${dateFmt(payment.payment_date)}</strong></div><div class="doc-reference-pair"><span>Method</span><strong>${esc(payment.method)}</strong></div>`;
  const content=`${documentRecipient('RECEIVED FROM',c,'RECEIPT DETAILS',meta)}<section class="doc-receipt-summary"><span>Amount received</span><strong>${money(payment.amount)}</strong></section><div class="doc-reference-pair"><span>Applied to invoice</span><strong>${esc(invoice.number)} · ${money(invoice.total)}</strong></div><div class="doc-reference-pair"><span>Invoice balance after payment</span><strong>${money(remaining)}</strong></div>${credit?`<div class="doc-reference-pair"><span>Customer credit created</span><strong>${money(credit)}</strong></div>`:''}${payment.reference?`<div class="doc-reference-pair"><span>Payment reference</span><strong>${esc(payment.reference)}</strong></div>`:''}${documentTerms(invoice.terms)}`;
  return documentShell(profile,'PAYMENT RECEIPT',`RCT-${payment.id.slice(0,8).toUpperCase()}`,payment.payment_date,'','',content);
}
function openPrint(kind,id){
  if(kind==='invoice'){const inv=byId(arr('invoices'),id);if(inv)showContentModal(`Invoice ${inv.number}`,'A4-ready · print or save as PDF.',invoicePrintMarkup(inv),{wide:true,print:true,editAction:invoiceCanEdit(inv)?'edit-invoice':'',editId:inv.id,editLabel:'Edit invoice'});}
  else if(kind==='quote'){const quote=byId(arr('quotations'),id);if(quote)showContentModal(`Quotation ${quote.number}`,'A4-ready · print or save as PDF.',quotePrintMarkup(quote),{wide:true,print:true,editAction:quote.invoice_id?'':'edit-quote',editId:quote.id,editLabel:'Edit quotation'});}
  else if(kind==='purchase'){const purchase=byId(arr('purchases'),id);if(purchase)showContentModal(`Purchase order ${purchase.number}`,'A4-ready · print or save as PDF.',purchasePrintMarkup(purchase),{wide:true,print:true});}
  else if(kind==='receipt'){const payment=byId(arr('payments'),id);if(payment)showContentModal('Payment receipt','A4-ready · print or save as PDF.',receiptPrintMarkup(payment),{wide:true,print:true});}
}
async function documentReady(){
  const article=$('#modalRoot .pdf-document');if(!article)throw new Error('Open a document before printing or saving a PDF.');
  await document.fonts?.ready;
  await Promise.all($$('img',article).map(async img=>{
    if(!img.complete)await new Promise((resolve,reject)=>{
      const done=error=>{clearTimeout(timer);img.removeEventListener('load',loaded);img.removeEventListener('error',failed);error?reject(error):resolve();};
      const loaded=()=>done(),failed=()=>done(new Error('The company logo could not be loaded. Check the company profile and try again.'));
      const timer=setTimeout(()=>done(new Error('The company logo is still loading. Please try again.')),15000);
      img.addEventListener('load',loaded,{once:true});img.addEventListener('error',failed,{once:true});
    });
    if(!img.naturalWidth)throw new Error('The company logo could not be loaded. Check the company profile and try again.');
    if(img.decode)await img.decode();
  }));
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
}
async function saveDocumentPDF(button){
  const label=button.textContent;button.disabled=true;button.textContent='Preparing PDF…';
  try{
    await documentReady();
    const suggestedName=$('#modalRoot .doc-identification strong')?.textContent||'Business document';
    const result=await window.invoiceyDesktop.savePDF({suggestedName});
    if(result?.saved)toast('PDF saved'+(result.fileName?' · '+result.fileName:'.'));
    else if(result?.queued)toast('Android print dialog opened. Choose “Save as PDF”.');
  }catch(error){toast(error.message||'The PDF could not be saved.',true);}
  finally{button.disabled=false;button.textContent=label;}
}
async function shareDocumentPDF(button){
  const label=button.textContent;button.disabled=true;button.textContent='Preparing PDF…';
  try{
    await documentReady();
    const suggestedName=$('#modalRoot .doc-identification strong')?.textContent||'Business document';
    const result=await window.invoiceyDesktop.sharePDF({suggestedName});
    if(result?.shared)toast('PDF ready to share.');
  }catch(error){toast(error.message||'The PDF could not be shared.',true);}
  finally{button.disabled=false;button.textContent=label;}
}
async function printDocument(){
  await documentReady();
  if(document.documentElement.classList.contains('invoicey-android')&&window.invoiceyDesktop?.printPDF){
    const suggestedName=$('#modalRoot .doc-identification strong')?.textContent||'Business document';
    const result=await window.invoiceyDesktop.printPDF({suggestedName});
    if(result?.printed)toast('Android print dialog opened.');
    return;
  }
  if(document.documentElement.classList.contains('invoicey-android')&&window.invoiceyDesktop?.savePDF){
    const suggestedName=$('#modalRoot .doc-identification strong')?.textContent||'Business document';
    const result=await window.invoiceyDesktop.savePDF({suggestedName});
    if(result?.saved)toast('PDF saved'+(result.fileName?' · '+result.fileName:'.'));
    return;
  }
  const originalTitle=document.title;
  document.title='';
  window.addEventListener('afterprint',()=>{document.title=originalTitle;},{once:true});
  window.print();
}
function openCustomerDetail(id){
  const c=customer(id);if(!c)return;
  const invoices=arr('invoices').filter(i=>i.customer_id===id).sort((a,b)=>b.invoice_date.localeCompare(a.invoice_date)),quotes=arr('quotations').filter(q=>q.customer_id===id).sort((a,b)=>b.quote_date.localeCompare(a.quote_date)),payments=arr('payments').filter(p=>p.customer_id===id).sort((a,b)=>b.payment_date.localeCompare(a.payment_date));
  const sales=invoices.reduce((s,i)=>s+Number(i.total),0),balance=invoices.reduce((s,i)=>s+invoiceBalance(i),0),credit=invoices.reduce((s,i)=>s+invoiceCredit(i),0);
  const customerExpenses=arr('expenses').filter(e=>e.customer_id===id),history=[...invoices.map(x=>({date:x.invoice_date,title:`Invoice ${x.number}`,detail:`${money(x.total)} · ${statusText(x.status)} · ${x.project_key||''}`})),...quotes.map(x=>({date:x.quote_date,title:`${x.document_type==='estimate'?'Estimate':'Quotation'} ${x.number}`,detail:`${money(x.total)} · ${statusText(x.status)} · ${x.project_key||''}`})),...payments.map(x=>({date:x.payment_date,title:`Payment received · ${money(x.amount)}`,detail:`${x.method}${x.reference?` · ${x.reference}`:''}`})),...customerExpenses.map(x=>({date:x.expense_date,title:`Expense · ${x.description}`,detail:`${money(x.amount)} · ${expenseInvoiceLabels(x).join(', ')||'No invoice linked'}`}))].sort((a,b)=>b.date.localeCompare(a.date));
  showContentModal(c.name,`${c.email||'No email'}${c.phone?` · ${c.phone}`:''}${c.address?` · ${c.address}`:''}`,`<div class="detail-grid"><div class="detail-stat"><span>Lifetime sales</span><strong>${money(sales)}</strong></div><div class="detail-stat"><span>Outstanding</span><strong>${money(balance)}</strong></div><div class="detail-stat"><span>Customer credit</span><strong>${money(credit)}</strong></div></div><div class="detail-heading"><strong>Account history</strong><span class="panel-head-meta">${history.length} records</span></div><div style="max-height:290px;overflow:auto">${history.length?history.map(x=>`<div class="timeline-item"><span class="timeline-dot"></span><div><strong>${esc(x.title)}</strong><small>${dateFmt(x.date)} · ${esc(x.detail)}</small></div></div>`).join(''):'<div class="empty-row">No transactions for this customer yet.</div>'}</div><div class="detail-actions"><button class="button" data-action="edit-customer" data-id="${c.id}">Edit details</button><button class="button" data-action="new-quote-customer" data-id="${c.id}">New quote</button><button class="button primary" data-action="new-invoice-customer" data-id="${c.id}">Create invoice</button></div>`,{wide:true});
}
function openExpenseCategoryForm(categoryId=''){
  const item=categoryId?byId(arr('expense_categories'),categoryId):null;
  showForm(item?'Edit expense category':'Add expense category','Expense categories help group project and operating costs.',`<div class="form-grid">${field('Category name','name','text',item?.name||'',true,'full')}</div>`,async f=>api(item?`/api/expense-categories/${item.id}`:'/api/expense-categories',item?'PUT':'POST',f),{submit:item?'Save category':'Add category'});
}
function openExpenseCategories(){
  const rows=arr('expense_categories').map(c=>`<div class="category-manage-row"><strong>${esc(c.name)}</strong><span>${arr('expenses').filter(e=>e.category===c.name).length} expenses</span><button class="row-action" data-action="edit-expense-category" data-id="${c.id}">✎</button><button class="row-action danger-action" data-action="delete-expense-category" data-id="${c.id}">×</button></div>`).join('');
  showContentModal('Expense categories','Add and maintain categories for project and operating costs.',`<div class="category-manager">${rows||'<div class="empty-row">No categories yet.</div>'}</div><div class="detail-actions"><button class="button primary" data-action="new-expense-category">+ Add category</button></div>`,{wide:true});
}
function openProjectDetail(key){
  const project=arr('projects').find(p=>p.project_key===key),s=projectSummary(key);if(!project){toast('Project was not found.',true);return;}
  const labor=s.expenses.filter(e=>e.expense_type==='labour'||e.category.toLowerCase()==='labour').reduce((n,e)=>n+Number(e.allocated_amount),0),groups=new Map();for(const e of s.expenses)groups.set(e.category,(groups.get(e.category)||0)+Number(e.allocated_amount));
  const material=s.expenses.filter(e=>e.category.toLowerCase().includes('material')).reduce((n,e)=>n+Number(e.allocated_amount),0),transport=s.expenses.filter(e=>['transport','delivery','fuel'].some(c=>e.category.toLowerCase().includes(c))).reduce((n,e)=>n+Number(e.allocated_amount),0),other=s.expenses.filter(e=>e.expense_type!=='labour'&&!e.category.toLowerCase().includes('material')&&!['transport','delivery','fuel'].some(c=>e.category.toLowerCase().includes(c))).reduce((n,e)=>n+Number(e.allocated_amount),0);
  const summary=`<div class="detail-grid project-metrics"><div class="detail-stat"><span>Revenue (before tax)</span><strong>${money(s.revenue)}</strong></div><div class="detail-stat"><span>Product / service cost</span><strong>${money(s.cogs)}</strong></div><div class="detail-stat"><span>Allocated expenses</span><strong>${money(s.cost)}</strong></div><div class="detail-stat"><span>Total project cost</span><strong>${money(s.totalCost)}</strong></div><div class="detail-stat"><span>Labour</span><strong>${money(labor)}</strong></div><div class="detail-stat"><span>Materials</span><strong>${money(material)}</strong></div><div class="detail-stat"><span>Transport / delivery / fuel</span><strong>${money(transport)}</strong></div><div class="detail-stat"><span>Other costs</span><strong>${money(other)}</strong></div><div class="detail-stat"><span>Net project profit</span><strong class="${s.profit<0?'profit-negative':'profit-positive'}">${money(s.profit)}</strong></div><div class="detail-stat"><span>Company keeps (${s.companySharePercent}%)</span><strong>${money(s.companyRetained)}</strong></div><div class="detail-stat"><span>Available for partners</span><strong>${money(s.distributable)}</strong></div><div class="detail-stat"><span>Profit margin</span><strong>${s.margin.toFixed(1)}%</strong></div></div><div class="project-retention-control"><label>Company share for this project (%)<input id="projectCompanyShare" type="number" min="0" max="100" step="0.01" value="${esc(s.companySharePercent)}"></label><button class="button" data-action="save-project-company-share" data-key="${esc(key)}">Save company percentage</button><span class="helper-caption">Use 30% when the company keeps 30%; use 0% when the full remainder goes to partners.</span></div>`;
  const expenseRows=s.expenses.sort((a,b)=>b.expense_date.localeCompare(a.expense_date)).map(e=>`<tr><td>${dateFmt(e.expense_date)}</td><td><span class="table-primary">${esc(e.description)}</span>${e.expense_type==='labour'?`<span class="table-secondary">${Number(e.worker_count)} workers · ${Number(e.working_days)} days · ${Number(e.working_hours)} hrs</span>`:''}</td><td>${esc(e.category)}</td><td>${esc(supplier(e.supplier_id)?.name||'—')}</td><td class="amount-cell">${money(e.allocated_amount)}</td><td>${arr('expense_attachments').filter(a=>a.expense_id===e.id).map(a=>`<a class="text-link" href="${apiUrl('/api/expense-attachments/'+a.id)}" target="_blank">${esc(a.file_name)}</a>`).join('<br>')||'—'}</td><td><button class="row-action" data-action="edit-expense" data-id="${e.id}">✎</button></td></tr>`);
  const docs=[...s.quotes.map(q=>`<div class="timeline-item"><span class="timeline-dot"></span><div><strong>${esc(q.document_type==='estimate'?'Estimate':'Quotation')} ${esc(q.number)}</strong><small>${dateFmt(q.quote_date)} · ${money(q.total)} · ${statusText(q.status)}${q.invoice_id?' · converted to invoice':''}</small></div><button class="row-action" data-action="print-quote" data-id="${q.id}">↗</button></div>`),...s.docs.map(i=>`<div class="timeline-item"><span class="timeline-dot"></span><div><strong>Invoice ${esc(i.number)}</strong><small>${dateFmt(i.invoice_date)} · ${money(i.total)} · ${statusText(i.status)}</small></div><button class="row-action" data-action="print-invoice" data-id="${i.id}">↗</button></div>`)].join('');
  showContentModal(`${project.project_key} · ${project.title||'Project'}`,`${customer(project.customer_id)?.name||'No customer linked'} · ${s.margin.toFixed(1)}% project margin`,`<div class="project-tabs"><button class="project-tab active" data-action="project-tab" data-tab="overview">Overview</button><button class="project-tab" data-action="project-tab" data-tab="expenses">Expenses</button><button class="project-tab" data-action="project-tab" data-tab="documents">Documents</button></div><div class="project-detail-tabs"><section data-project-pane="overview">${summary}<div class="detail-heading"><strong>Cost by category</strong></div>${table(['CATEGORY','TOTAL'],[...groups].map(([name,value])=>`<tr><td>${esc(name)}</td><td class="amount-cell">${money(value)}</td></tr>`),'No categorized costs yet.')}</section><section data-project-pane="expenses" hidden><div class="detail-heading"><strong>Historic expenses and supporting bills</strong><span class="panel-head-meta">${s.expenses.length} entries · ${money(s.cost)}</span></div>${table(['DATE','DESCRIPTION / LABOUR','CATEGORY','SUPPLIER','AMOUNT','SUPPORTING FILES',''],expenseRows,'No historic expenses linked to this project.')}</section><section data-project-pane="documents" hidden><div class="detail-heading"><strong>Quotation and invoice history</strong><span class="panel-head-meta">${s.quotes.length+s.docs.length} records</span></div>${docs||'<div class="empty-row">No quotations or invoices linked yet.</div>'}</section></div><div class="detail-actions"><button class="button primary" data-action="close-modal">Close</button></div>`,{wide:true});
}
function openSupplierDetail(id){
  const s=supplier(id);if(!s)return;
  const purchases=arr('purchases').filter(p=>p.supplier_id===id).sort((a,b)=>b.purchase_date.localeCompare(a.purchase_date)),payments=arr('supplier_payments').filter(p=>p.supplier_id===id).sort((a,b)=>b.payment_date.localeCompare(a.payment_date)),total=purchases.reduce((sum,p)=>sum+Number(p.total),0),paid=payments.reduce((sum,p)=>sum+Number(p.amount),0);
  const history=[...purchases.map(p=>({date:p.purchase_date,title:`Purchase ${p.number}`,detail:`${money(p.total)} · ${statusText(p.status)}`})),...payments.map(p=>({date:p.payment_date,title:`Payment sent · ${money(p.amount)}`,detail:`${p.method}${p.reference?` · ${p.reference}`:''}`}))].sort((a,b)=>b.date.localeCompare(a.date));
  showContentModal(s.name,`${s.email||'No email'}${s.phone?` · ${s.phone}`:''}${s.address?` · ${s.address}`:''}`,`<div class="detail-grid"><div class="detail-stat"><span>Total purchases</span><strong>${money(total)}</strong></div><div class="detail-stat"><span>Payments made</span><strong>${money(paid)}</strong></div><div class="detail-stat"><span>Balance due</span><strong>${money(Math.max(0,total-paid))}</strong></div></div><div class="detail-heading"><strong>Account history</strong><span class="panel-head-meta">${history.length} records</span></div><div style="max-height:290px;overflow:auto">${history.length?history.map(x=>`<div class="timeline-item"><span class="timeline-dot"></span><div><strong>${esc(x.title)}</strong><small>${dateFmt(x.date)} · ${esc(x.detail)}</small></div></div>`).join(''):'<div class="empty-row">No activity for this supplier yet.</div>'}</div><div class="detail-actions"><button class="button" data-action="edit-supplier" data-id="${s.id}">Edit details</button><button class="button primary" data-action="new-supplier-payment">Record payment</button></div>`,{wide:true});
}
function openStockHistory(productId){
  const item=product(productId);if(!item)return;
  const movements=arr('stock_movements').filter(m=>m.product_id===productId).sort((a,b)=>b.movement_date.localeCompare(a.movement_date)||b.created_at.localeCompare(a.created_at));
  showContentModal(`${item.name} · stock history`,`${item.sku} · ${Number(item.quantity).toLocaleString()} ${item.unit||'units'} currently on hand`,`<div class="detail-grid"><div class="detail-stat"><span>On hand</span><strong>${Number(item.quantity).toLocaleString()}</strong></div><div class="detail-stat"><span>Average cost</span><strong>${money(item.purchase_price)}</strong></div><div class="detail-stat"><span>Reorder level</span><strong>${Number(item.reorder_level).toLocaleString()}</strong></div></div>${table(['DATE','MOVEMENT','REFERENCE / REASON','QUANTITY','UNIT COST'],movements.map(m=>`<tr><td>${dateFmt(m.movement_date)}</td><td>${badge(m.movement_type.toLowerCase().replace(' ','-'))}</td><td><span class="table-primary">${esc(m.reference||'Manual adjustment')}</span><span class="table-secondary">${esc(m.notes||'')}</span></td><td class="amount-cell ${m.quantity<0?'profit-negative':'profit-positive'}">${Number(m.quantity)>0?'+':''}${Number(m.quantity).toLocaleString()}</td><td>${money(m.unit_cost)}</td></tr>`),'No stock movements recorded for this product yet.')}`,{wide:true});
}

function openConvertQuote(id){
  const quote=byId(arr('quotations'),id);if(!quote)return;
  const markup=`<div class="inline-note">This quotation will become a customer invoice. The selected company and quote terms carry forward. Stock is checked and deducted when you confirm.</div><div class="form-grid"><div class="form-field full" id="companyPreview">${companyPreviewMarkup(quote.company_id)}</div>${field('Invoice date','invoiceDate','date',todayISO(),true)}${field('Amount received now','paidAmount','number',0)}${selectField('Payment method','paymentMethod',[{value:'Cash',label:'Cash'},{value:'Bank transfer',label:'Bank transfer'},{value:'Card',label:'Card'},{value:'Mobile payment',label:'Mobile payment'},{value:'Cheque',label:'Cheque'}],'Cash',false)}<div class="form-field full"><span class="table-primary">${esc(quote.number)} · ${esc(customer(quote.customer_id)?.name||'')} · ${money(quote.total)}</span></div><div class="form-field full"><label for="f-terms">Terms & conditions <span class="field-hint">Copied from the quotation · editable for the invoice</span></label><textarea id="f-terms" name="terms" class="terms-document">${esc(quote.terms||'')}</textarea></div></div>`;
  showForm(`Convert ${quote.number}`,'Create an invoice from the accepted quotation.',markup,async form=>api(`/api/quotations/${id}/convert`,'POST',form),{submit:'Create invoice'});
}
function toast(message,error=false){
  const stack=$('#toastStack');if(!stack)return;const node=document.createElement('div');node.className=`toast ${error?'error':''}`;node.textContent=message;stack.append(node);setTimeout(()=>node.remove(),3600);
}
function csvCell(value){return `"${String(value??'').replaceAll('"','""')}"`;}
function exportReport(){
  const start=state.reportStart,end=state.reportEnd,rows=[['Period','Sales','Purchases','Expenses','Net profit','Invoice count'],...groupedReport().map(x=>[x.period,x.sales,x.purchases,x.expenses,x.profit,x.invoices])];
  if((state.reportSection||'all')==='sales'){rows.splice(1,rows.length-1,...arr('invoices').filter(i=>inRange(i.invoice_date,start,end)).flatMap(i=>invoiceItems(i.id).map(x=>[i.invoice_date,i.number,i.project_key,customer(i.customer_id)?.name,x.item_type==='service'?'Service':'Product',x.service_title||x.description,x.quantity,x.unit_price,x.discount_amount,Number(x.line_total)-Number(x.discount_amount||0),invoiceProfit(i),invoicePaid(i.id)])));rows[0]=['Date','Invoice','Project Key','Customer','Item type','Product / service','Quantity','Unit price','Line discount','Line amount','Invoice gross profit','Collected'];}
   if((state.reportSection||'all')==='expenses'){rows.splice(1,rows.length-1,...arr('expenses').filter(e=>inRange(e.expense_date,start,end)).map(e=>[e.expense_date,expenseInvoiceLabels(e).join(', '),e.description,e.category,supplier(e.supplier_id)?.name,e.amount,e.payment_method,arr('expense_attachments').filter(a=>a.expense_id===e.id).length]));rows[0]=['Date','Linked invoices','Description','Category','Supplier','Total amount','Payment method','Attachments'];}
  if((state.reportSection||'all')==='purchases'){rows.splice(1,rows.length-1,...arr('purchases').filter(p=>inRange(p.purchase_date,start,end)).map(p=>[p.purchase_date,p.number,supplier(p.supplier_id)?.name,p.total,purchasePaid(p.id)]));rows[0]=['Date','Purchase','Supplier','Total','Paid'];}
  if((state.reportSection||'all')==='inventory'){rows.splice(1,rows.length-1,...arr('products').map(p=>[p.name,p.sku,p.quantity,p.purchase_price,p.selling_price,p.quantity*p.purchase_price]));rows[0]=['Product','SKU','Quantity','Unit cost','Selling price','Stock value'];}
  const blob=new Blob([rows.map(row=>row.map(csvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=`itsme-invoicey-${state.reportSection||'activity'}-${start}-to-${end}.csv`;link.click();URL.revokeObjectURL(link.href);toast('Your report is ready to download.');
}

document.addEventListener('click',async event=>{
  if(event.target.closest('.global-search')){$('#globalSearch').focus();renderGlobalSearch($('#globalSearch').value);}
  const searchResult=event.target.closest('[data-global-result]');if(searchResult){state.view=searchResult.dataset.view;state.query=searchResult.dataset.value||'';if(searchResult.dataset.tab)state.paymentTab=searchResult.dataset.tab;$('#globalSearch').value='';renderGlobalSearch('');if(location.hash!=='#'+state.view)location.hash=state.view;renderPage();$('#sidebar').classList.remove('open');return;}
  if(!event.target.closest('.global-search-wrap'))renderGlobalSearch('');
  const nav=event.target.closest('[data-view]');if(nav){event.preventDefault();setView(nav.dataset.view);return;}
  const button=event.target.closest('[data-action]');
  if(button){
    const action=button.dataset.action,id=button.dataset.id,key=button.dataset.key;
    const deletions={
      'delete-invoice':{url:`/api/invoices/${id}`,confirm:'Delete this unpaid invoice? Converted invoices, invoices with payments, linked expenses, and invoices included in saved profit shares are protected. Product stock will be restored.',done:'Invoice deleted and product stock restored.'},
      'delete-purchase':{url:`/api/purchases/${id}`,confirm:'Delete this purchase? This restores stock and weighted-average cost only if there are no supplier payments or later stock movements. Otherwise the purchase will be protected.',done:'Purchase deleted and inventory cost and quantity restored.'},
      'delete-quote':{url:`/api/quotations/${id}`,confirm:'Delete this unconverted quotation? Converted quotations are protected. Quotations are not linked to expenses.',done:'Quotation deleted.'},
      'delete-product':{url:`/api/products/${id}`,confirm:'Delete this product? Products with stock movements or linked documents are protected.',done:'Product deleted.'},
      'delete-service':{url:`/api/services/${id}`,confirm:'Delete this service? Services used in quotations or invoices are protected.',done:'Service deleted.'},
      'delete-customer':{url:`/api/customers/${id}`,confirm:'Delete this customer? Customers with documents, payments or expenses are protected.',done:'Customer deleted.'},
      'delete-supplier':{url:`/api/suppliers/${id}`,confirm:'Delete this supplier? Suppliers with purchases, payments or expenses are protected.',done:'Supplier deleted.'},
      'delete-expense':{url:`/api/expenses/${id}`,confirm:'Delete this expense and its uploaded bills? This will update project costs and profit.',done:'Expense and attached files deleted.'},
      'delete-payment':{url:`/api/payments/${id}`,confirm:'Delete this customer receipt? The invoice balance and customer credit will be recalculated.',done:'Receipt deleted and invoice balance updated.'},
      'delete-supplier-payment':{url:`/api/supplier-payments/${id}`,confirm:'Delete this supplier payment? The purchase balance will be recalculated.',done:'Supplier payment deleted.'},
      'delete-partner':{url:`/api/partners/${id}`,confirm:'Delete this partner? Partners with saved profit-share records are protected.',done:'Partner deleted.'}
    };
    if(deletions[action]){const item=deletions[action];if(!window.confirm(item.confirm))return;try{await api(item.url,'DELETE');await refresh();toast(item.done);}catch(error){toast(error.message,true);}return;}
    if(action==='close-modal'){closeModal();return;}
    if(action==='new-invoice'){openInvoiceForm();return;}
    if(action==='new-invoice-customer'){closeModal();openInvoiceForm(id);return;}
    if(action==='edit-invoice'){closeModal();openInvoiceEdit(id);return;}
    if(action==='new-quote'){openQuoteForm();return;}
    if(action==='new-quote-customer'){closeModal();openQuoteForm();const select=$('#f-customerId');if(select)select.value=id;return;}
    if(action==='edit-quote'){closeModal();openQuoteForm(id);return;}
    if(action==='new-purchase'){openPurchaseForm();return;}
    if(action==='new-product'){openEntityForm('product');return;}
    if(action==='edit-product'){openEntityForm('product',id);return;}
    if(action==='new-service'){openEntityForm('service');return;}
    if(action==='edit-service'){openEntityForm('service',id);return;}
    if(action==='stock-adjust'){openStockAdjust(id||'');return;}
    if(action==='stock-history'){openStockHistory(id);return;}
    if(action==='new-customer'){openEntityForm('customer');return;}
    if(action==='edit-customer'){closeModal();openEntityForm('customer',id);return;}
    if(action==='customer-detail'){openCustomerDetail(id);return;}
    if(action==='new-supplier'){openEntityForm('supplier');return;}
    if(action==='edit-supplier'){closeModal();openEntityForm('supplier',id);return;}
    if(action==='supplier-detail'){openSupplierDetail(id);return;}
    if(action==='new-expense'){openEntityForm('expense');return;}
    if(action==='edit-expense'){openEntityForm('expense',id);return;}
    if(action==='new-expense-project'){closeModal();openEntityForm('expense');return;}
    if(action==='project-detail'){openProjectDetail(key);return;}
    if(action==='add-expense-allocation'){const host=$('#expenseProjectAllocations');if(host){host.insertAdjacentHTML('beforeend',expenseAllocationRow());syncExpenseAllocationSummary();}return;}
    if(action==='remove-expense-allocation'){button.closest('.expense-allocation-row')?.remove();syncExpenseAllocationSummary();return;}
    if(action==='add-expense-invoice'){const host=$('#expenseInvoiceLinks');if(host)host.insertAdjacentHTML('beforeend',expenseInvoiceRow());return;}
    if(action==='remove-expense-invoice'){button.closest('.expense-invoice-row')?.remove();return;}
    if(action==='save-project-company-share'){const input=$('#projectCompanyShare'),percentage=Number(input?.value);if(!Number.isFinite(percentage)||percentage<0||percentage>100){toast('Enter a company percentage from 0 to 100.',true);return;}try{await api(`/api/projects/${encodeURIComponent(key)}/company-share`,'PUT',{companySharePercent:percentage});closeModal();await refresh();openProjectDetail(key);toast('Project company percentage saved.');}catch(error){toast(error.message,true);}return;}
    if(action==='project-tab'){const pane=button.dataset.tab;$$('[data-project-pane]',$('#modalRoot')).forEach(node=>node.hidden=node.dataset.projectPane!==pane);$$('.project-tab',$('#modalRoot')).forEach(node=>node.classList.toggle('active',node===button));return;}
    if(action==='expense-categories'){openExpenseCategories();return;}
    if(action==='new-expense-category'){openExpenseCategoryForm();return;}
    if(action==='edit-expense-category'){openExpenseCategoryForm(id);return;}
    if(action==='delete-expense-category'){if(!window.confirm('Delete this expense category?'))return;try{await api(`/api/expense-categories/${id}`,'DELETE');await refresh();openExpenseCategories();toast('Category deleted.');}catch(error){toast(error.message,true);}return;}
    if(action==='new-payment'){openPaymentForm('customer');return;}
    if(action==='new-supplier-payment'){openPaymentForm('supplier');return;}
    if(action==='record-payment'){openPaymentForm('customer',id);return;}
    if(action==='payments-tab'){state.paymentTab=button.dataset.tab;renderPage();return;}
    if(action==='new-partner'){openEntityForm('partner');return;}
    if(action==='edit-partner'){openEntityForm('partner',id);return;}
    if(action==='generate-shares'){openGenerateShares();return;}
    if(action==='new-company'){openCompanyForm();return;}
    if(action==='edit-company'){openCompanyForm(id);return;}
    if(action==='set-default-company'){
      try{await api(`/api/companies/${id}/default`,'PUT',{});await refresh();toast('Default company updated.');}catch(error){toast(error.message,true);}return;
    }
    if(action==='delete-company'){
      if(!window.confirm('Delete this company profile? Profiles with linked documents cannot be removed.'))return;
      try{await api(`/api/companies/${id}`,'DELETE');await refresh();toast('Company profile deleted.');}catch(error){toast(error.message,true);}return;
    }
    if(action==='clear-company-logo'){
      if(state.modal){state.modal.logoRequest=(state.modal.logoRequest||0)+1;state.modal.logoError='';state.modal.logoRead=null;}
      const hidden=$('#f-logoData');if(hidden)hidden.value='';const file=$('#logoFile');if(file)file.value='';const preview=button.closest('.uploaded-logo-preview');if(preview)preview.hidden=true;return;
    }
    if(action==='print-invoice'){openPrint('invoice',id);return;}
    if(action==='print-quote'){openPrint('quote',id);return;}
    if(action==='print-purchase'){openPrint('purchase',id);return;}
    if(action==='print-receipt'){openPrint('receipt',id);return;}
    if(action==='convert-quote'){openConvertQuote(id);return;}
    if(action==='save-pdf'){await saveDocumentPDF(button);return;}
    if(action==='share-pdf'){await shareDocumentPDF(button);return;}
    if(action==='print-doc'){try{await printDocument();}catch(error){toast(error.message,true);}return;}
    if(action==='export-report'){exportReport();return;}
    if(action==='download-backup'){
      try{const response=await requestFetch('/api/backup/download');if(!response.ok){const error=await response.json().catch(()=>({}));throw new Error(error.error||'The account backup could not be downloaded.');}const blob=await response.blob(),name=decodeURIComponent((response.headers.get('content-disposition')||'').match(/filename="?([^";]+)"?/i)?.[1]||defaultCompany().name+'_Account_Backup.invoicey'),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(link.href),1000);toast('Private account backup downloaded.');}catch(error){toast(error.message,true);}return;
    }
    if(action==='report-period'){
      state.reportType=button.dataset.period;state.reportStart='';state.reportEnd='';reportDefaults();renderPage();return;
    }
    if(action==='add-line'){
      const kind=$('.line-row')?.dataset.kind||'invoice';$('#lineRows')?.insertAdjacentHTML('beforeend',lineRow(defaultLine(),kind));updateLineTotals();return;
    }
    if(action==='remove-line'){
      const rows=$$('.line-row',$('#modalRoot'));if(rows.length<=1){toast('Each document needs at least one item.',true);return;}button.closest('tr').remove();updateLineTotals();return;
    }
    if(action==='settings-data'){showContentModal('Account data','This workspace stores each company’s records in a separate SQLite database.',`<div class="detail-grid"><div class="detail-stat"><span>Saved records</span><strong>${arr('invoices').length+arr('quotations').length+arr('customers').length+arr('suppliers').length+arr('products').length}</strong></div><div class="detail-stat"><span>Currency</span><strong>${esc(settings().currency)}</strong></div><div class="detail-stat"><span>Product catalog</span><strong>${arr('products').length} products</strong></div></div><p class="help-note">Use Company Settings → Account Backup &amp; Restore to create or download a private copy of this company’s complete business database.</p>`);return;}
  }
  if(event.target.matches('[data-backdrop]'))closeModal();
  // android-ui.js owns the hamburger tap on phone-sized browsers. Avoid
  // toggling it a second time here, which would immediately close the drawer.
  if((event.target.matches('#menuButton')||event.target.closest('#menuButton'))&&!window.InvoiceyAndroidUI)$('#sidebar').classList.toggle('open');
  if(event.target.closest('#notificationButton')){setView('inventory');$('#inventoryFilter').value='low';applySearch(state.query);}
});

document.addEventListener('submit',async event=>{
  if(event.target.id==='accountEmailForm'){
    event.preventDefault();const form=event.target;if(!form.reportValidity())return;const button=form.querySelector('[type="submit"]'),old=button?.textContent,status=$('#accountEmailOtpStatus');if(button){button.disabled=true;button.textContent='Verifying…';}
    try{const values=Object.fromEntries(new FormData(form).entries());await api('/api/auth/email/confirm','POST',values);await refresh();toast('Recovery email verified and saved.');}
    catch(error){if(status)status.textContent=error.message;else toast(error.message,true);if(button){button.disabled=false;button.textContent=old||'Verify and save email';}}return;
  }
  if(event.target.id==='settingsForm'){
    event.preventDefault();const form=Object.fromEntries(new FormData(event.target).entries());
    try{await api('/api/settings','PUT',form);await refresh();toast('Business settings saved.');}catch(error){toast(error.message,true);}return;
  }
  if(event.target.id==='modalForm'){
    event.preventDefault();const form=event.target;
    if(!form.reportValidity())return;
    if(!state.modal?.onSubmit)return;
    const modal=state.modal;
    const submit=$('button[type="submit"]',form),label=submit?.textContent;if(submit){submit.disabled=true;submit.textContent='Saving…';}
    try{if(modal.logoRead)await modal.logoRead;if(state.modal!==modal)return;if(modal.logoError)throw new Error(modal.logoError);const values=Object.fromEntries(new FormData(form).entries());await modal.onSubmit(values);if(state.modal===modal)closeModal();await refresh();toast('Saved successfully.');}
    catch(error){const errorNode=$('#modalError');if(errorNode)errorNode.textContent=error.message;else toast(error.message,true);if(submit){submit.disabled=false;submit.textContent=label||'Save';}}
  }
});

document.addEventListener('input',event=>{
  if(event.target.id==='globalSearch')renderGlobalSearch(event.target.value);
  if(event.target.matches('.table-search')){state.query=event.target.value;applySearch(state.query);}
  if(event.target.matches('.line-qty,.line-price,.line-discount'))updateLineTotals();
  if(event.target.matches('#f-workerCount,#f-workingDays,#f-workingHours,#f-labourRate,#f-additionalLabour'))updateLabourTotal();
  if(event.target.matches('#f-amount,.expense-allocation-amount'))syncExpenseAllocationSummary();
  if(event.target.matches('#f-discountPercent,#f-taxRate'))updateLineTotals();
  if(event.target.id==='f-terms')event.target.dataset.overridden='true';
});

document.addEventListener('change',async event=>{
  const target=event.target;
  if(['invoiceStatusFilter','purchaseStatusFilter','inventoryFilter','categoryFilter','expenseCategoryFilter','quoteStatusFilter'].includes(target.id))applySearch(state.query);
  if(target.id==='reportSection'){state.reportSection=target.value;renderPage();}
  if(target.id==='reportStart'){state.reportStart=target.value;if(state.reportEnd&&state.reportEnd<state.reportStart){state.reportEnd=state.reportStart;}renderPage();}
  if(target.id==='reportEnd'){state.reportEnd=target.value;if(state.reportStart&&state.reportEnd<state.reportStart){state.reportStart=state.reportEnd;}renderPage();}
  if(target.id==='f-companyId'){
    const selected=target.value,preview=$('#companyPreview');if(preview)preview.innerHTML=companyPreviewMarkup(selected);
    const terms=$('#f-terms');if(terms&&!terms.dataset.overridden)terms.value=company(selected)?.terms_conditions||'';
  }
  if(target.id==='f-expenseType'){const labour=target.value==='labour';const fields=$('.labour-fields'),general=$('.general-expense-fields');if(fields)fields.hidden=!labour;if(general)general.hidden=labour;if(labour&&$('#f-category')&&arr('expense_categories').some(c=>c.name==='Labour'))$('#f-category').value='Labour';updateLabourTotal();syncExpenseAllocationSummary();}
  if(target.matches('.expense-allocation-project,.expense-allocation-amount')||target.id==='f-labourRateUnit')syncExpenseAllocationSummary();
  if(target.id==='f-invoiceId'&&target.value){const i=byId(arr('invoices'),target.value);if(i){setSingleExpenseAllocation(i.project_key);$('#f-customerId').value=i.customer_id;}}
  if(target.id==='f-quotationId'&&target.value){const q=byId(arr('quotations'),target.value);if(q){setSingleExpenseAllocation(q.project_key);$('#f-customerId').value=q.customer_id;}}
  if(target.matches('.line-type')){const row=target.closest('.line-row');row.dataset.itemType=target.value;$('.product-detail',row).hidden=target.value!=='product';$('.service-detail',row).hidden=target.value!=='service';const price=$('.line-price',row);if(price)price.value='';updateLineTotals();}
  if(target.matches('.line-product')){
    const opt=target.selectedOptions[0],row=target.closest('.line-row'),cost=Number(opt?.dataset.cost),price=Number(opt?.dataset.price);
    const input=$('.line-price',row);if(input&&opt?.value)input.value=row.dataset.kind==='purchase'?cost:price;updateLineTotals();
    const description=$('.product-description',row);if(description&&!description.value)description.value=opt?.dataset.description||'';
  }
  if(target.matches('.line-service')){const opt=target.selectedOptions[0],row=target.closest('.line-row');if(!opt?.value)return;$('.line-service-title',row).value=opt.dataset.title||'';$('.line-service-description',row).value=opt.dataset.description||'';$('.line-price',row).value=opt.dataset.price||0;row.dataset.serviceCost=opt.dataset.cost||0;updateLineTotals();}
  if(target.matches('.line-service-title'))applySavedServiceTitle(target.closest('.line-row'));
  if(target.id==='f-invoiceId'&&$('#f-amount')){$('#f-amount').value=invoiceBalance(byId(arr('invoices'),target.value)||{id:'',total:0}).toFixed(2);}
  if(target.id==='f-paidAmount')target.dataset.auto='false';
});

function updateLabourTotal(){const n=id=>Number($(`#f-${id}`)?.value)||0,workers=n('workerCount'),rate=n('labourRate'),unit=$('#f-labourRateUnit')?.value||'day',base=workers*(unit==='hour'?n('workingHours'):n('workingDays'))*rate,total=base+n('additionalLabour'),node=$('#calculatedLabour');if(node)node.textContent=money(total);syncExpenseAllocationSummary();}

document.addEventListener('keydown',event=>{
  if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();$('#globalSearch').focus();}
  if(event.target.id==='globalSearch'&&event.key==='Enter'){const first=$('[data-global-result]');if(first){event.preventDefault();first.click();}}
  if(event.target.id==='globalSearch'&&event.key==='Escape')renderGlobalSearch('');
  if(event.key==='Escape'&&state.modal)closeModal();
  if(event.key==='Escape')$('#sidebar').classList.remove('open');
});
window.addEventListener('hashchange',()=>{const view=location.hash.slice(1);if(headerNames[view]&&view!==state.view){state.view=view;state.query='';renderPage();}});

async function fileAsDataURL(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('The company logo could not be read.'));reader.readAsDataURL(file);});}
async function showRecoveryPage(){document.body.classList.add('access-locked');$('#accessRoot').hidden=false;$('#accessRoot').innerHTML='<section class="access-card login-card"><div class="access-brand"><strong>itsme invoicey</strong></div><p class="eyebrow">PASSWORD RECOVERY</p><h1>Reset password</h1><p class="access-intro">Enter the email address verified on your account. We’ll send a one-time code if it matches.</p><form id="recoverForm"><label>Account email<input name="email" type="email" required maxlength="254" autocomplete="email"></label><button class="button" type="button" data-action="request-password-reset-otp">Send code to my email</button><p class="setup-help" id="resetOtpStatus" aria-live="polite"></p><div id="resetOtpFields" hidden><label>Six-digit email code<input name="emailOtp" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" minlength="6" maxlength="6" required disabled></label><label>New password (12 characters minimum)<input name="newPassword" type="password" minlength="12" maxlength="128" autocomplete="new-password" required disabled></label><button class="button primary auth-submit" type="submit">Reset password</button></div><div class="auth-error" id="accessError" role="alert"></div></form><button class="auth-link" data-action="show-login" type="button">Back to sign in</button></section>';}
async function handleAccessSubmit(event){const form=event.target;if(!['setupForm','loginForm','signupForm','recoverForm','changePasswordForm'].includes(form.id))return;event.preventDefault();const button=form.querySelector('[type=submit]'),old=button?.textContent;if(button){button.disabled=true;button.textContent='Please wait…'}const error=$('#accessError');if(error)error.textContent='';try{
  const f=Object.fromEntries(new FormData(form).entries());
  if(form.id==='loginForm'){
    await api('/api/auth/login','POST',f);await refresh();return;
  }
  if(form.id==='signupForm'){
    if(f.password!==f.confirmPassword)throw new Error('The password confirmations do not match.');
    await api('/api/auth/signup','POST',{company:{name:f.companyName,address:f.address,contactNumbers:f.contactNumbers,email:f.email,currency:'LKR',locale:'en-LK'},username:f.username,displayName:f.displayName,accountEmail:f.accountEmail,emailOtp:f.emailOtp,password:f.password});
    $('#accessRoot').innerHTML='<section class="access-card login-card"><div class="access-brand"><span class="brand-mark"><span></span><span></span><span></span></span><strong>itsme invoicey</strong></div><p class="eyebrow">ACCOUNT CREATED</p><h1>Your workspace is ready</h1><p class="access-intro">Your email is verified and your business workspace is ready to use.</p><p class="auth-footnote">Username: '+esc(f.username)+'. Your password is stored securely. Use your verified email if you ever need to reset it.</p><button class="button primary auth-submit" data-action="continue-signup" type="button">Continue to itsme invoicey</button></section>';
    return;
  }
  if(form.id==='recoverForm'){await api('/api/auth/recover','POST',f);await showAccessLogin();toast('Password changed. Sign in with your new password.');return;}
  if(form.id==='changePasswordForm'){await api('/api/auth/change-password','POST',f);form.reset();toast('Password updated.');return;}
  if(f.adminPassword!==f.adminPasswordConfirm)throw new Error('The password confirmations do not match.');
  const profile={name:f.companyName,address:f.address,email:f.email,currency:'LKR',locale:'en-LK'};
  await api('/api/auth/setup','POST',{company:profile,username:f.adminUsername,displayName:f.adminDisplayName,accountEmail:f.accountEmail,emailOtp:f.emailOtp,password:f.adminPassword});
  await refresh();
 }catch(err){if(error)error.textContent=err.message;else toast(err.message,true);}finally{if(button){button.disabled=false;button.textContent=old||'Continue';}}}
async function requestRegistrationOtp(button){const form=button.closest('form'),email=form?.elements.namedItem('accountEmail'),status=form?.querySelector('#registrationOtpStatus');if(!email?.reportValidity())return;button.disabled=true;const old=button.textContent;button.textContent='Sending…';if(status)status.textContent='Sending a code to your email…';try{await api('/api/auth/email-otp/request','POST',{purpose:'registration',email:email.value});if(status)status.textContent='Code sent. Check your inbox and spam folder; the code expires in 10 minutes.';form.elements.namedItem('emailOtp')?.focus();}catch(error){if(status)status.textContent=error.message;}finally{button.disabled=false;button.textContent=old;}}
async function requestPasswordResetOtp(button){const form=button.closest('form'),email=form?.elements.namedItem('email'),status=form?.querySelector('#resetOtpStatus');if(!email?.reportValidity())return;button.disabled=true;const old=button.textContent;button.textContent='Sending…';if(status)status.textContent='Requesting a verification code…';try{const result=await api('/api/auth/email-otp/request','POST',{purpose:'password-reset',email:email.value});if(status)status.textContent=result.message||'If an account matches that verified email, a code has been sent.';const fields=form.querySelector('#resetOtpFields');fields.hidden=false;form.elements.namedItem('emailOtp').disabled=false;form.elements.namedItem('newPassword').disabled=false;form.elements.namedItem('emailOtp').focus();}catch(error){if(status)status.textContent=error.message;}finally{button.disabled=false;button.textContent=old;}}
async function requestAdminAccountOtp(button){const form=button.closest('form'),email=form?.elements.namedItem('email'),status=form?.querySelector('#newAccountOtpStatus');if(!email?.reportValidity())return;button.disabled=true;const old=button.textContent;button.textContent='Sending…';if(status)status.textContent='Sending a verification code…';try{const purpose=button.dataset.action==='request-company-admin-otp'?'company-admin':'admin-user',payload={purpose,email:email.value};if(purpose==='admin-user')payload.companyId=state.access?.company?.id;const result=await api('/api/auth/email-otp/request','POST',payload);if(status)status.textContent=(result.message||'A verification code was sent.')+' Check the inbox and spam folder.';form.elements.namedItem('emailOtp')?.focus();}catch(error){if(status)status.textContent=error.message;}finally{button.disabled=false;button.textContent=old;}}
async function requestAccountEmailOtp(button){const form=button.closest('form'),email=form?.elements.namedItem('email'),password=form?.elements.namedItem('currentPassword'),status=form?.querySelector('#accountEmailOtpStatus');if(!email?.reportValidity()||!password?.reportValidity())return;button.disabled=true;const old=button.textContent;button.textContent='Sending…';if(status)status.textContent='Sending a verification code…';try{const result=await api('/api/auth/email-otp/request','POST',{purpose:'email-change',email:email.value,currentPassword:password.value});if(status)status.textContent=result.message+' The code expires in 10 minutes.';const fields=form.querySelector('#accountEmailCodeFields');fields.hidden=false;form.elements.namedItem('emailOtp').disabled=false;form.elements.namedItem('emailOtp').required=true;form.elements.namedItem('emailOtp').focus();}catch(error){if(status)status.textContent=error.message;}finally{button.disabled=false;button.textContent=old;}}
async function requestBankChangeOtp(button){const form=button.closest('form'),password=form?.elements.namedItem('currentPassword'),status=form?.querySelector('#bankChangeOtpStatus');if(!password?.value){password?.focus();if(status)status.textContent='Enter your current password first.';return;}const bankDetails={bankName:form.elements.namedItem('bankName')?.value||'',bankBranch:form.elements.namedItem('bankBranch')?.value||'',accountHolder:form.elements.namedItem('accountHolder')?.value||'',bankAccountNumber:form.elements.namedItem('bankAccountNumber')?.value||''};button.disabled=true;const old=button.textContent;button.textContent='Sending…';if(status)status.textContent='Sending a bank-change code to your verified account email…';try{const result=await api('/api/auth/email-otp/request','POST',{purpose:'bank-change',currentPassword:password.value,bankDetails});if(status)status.textContent=result.message+' The code expires in 10 minutes and applies only to these exact bank details.';const fields=form.querySelector('#bankChangeOtpFields'),input=form.elements.namedItem('bankOtp');fields.hidden=false;input.disabled=false;input.required=true;input.focus();}catch(error){if(status)status.textContent=error.message;}finally{button.disabled=false;button.textContent=old;}}
async function showAccessLogin(){document.body.classList.add('access-locked');$('#accessRoot').hidden=false;$('#accessRoot').innerHTML='<section class="access-card login-card"><div class="access-brand"><span class="brand-mark"><span></span><span></span><span></span></span><strong>itsme invoicey</strong></div><p class="eyebrow">SECURE BUSINESS WORKSPACE</p><h1>Sign in</h1><p class="access-intro">Sign in with your company account or super administrator account. After four failed password attempts, use the verified email OTP to reset your password.</p><form id="loginForm"><label>Username<input name="username" required autocomplete="username" autofocus></label><label>Password<input name="password" required type="password" autocomplete="current-password"></label><div class="auth-error" id="accessError" role="alert"></div><button class="button primary auth-submit" type="submit">Sign in</button></form><button class="auth-link" data-action="show-signup" type="button">New here? Sign up</button><button class="auth-link" data-action="show-recovery" type="button">Forgot password? Get a code by email</button></section>';}
function showAccessSignup(){document.body.classList.add('access-locked');$('#accessRoot').hidden=false;$('#accessRoot').innerHTML='<section class="access-card login-card"><div class="access-brand"><span class="brand-mark"><span></span><span></span><span></span></span><strong>itsme invoicey</strong></div><p class="eyebrow">CREATE A BUSINESS WORKSPACE</p><h1>Create new account</h1><p class="access-intro">Create your company workspace and first administrator. Your company records stay separate from other businesses.</p><form id="signupForm"><label>Company or business name<input name="companyName" required maxlength="160" autocomplete="organization"></label><label>Your full name<input name="displayName" required maxlength="120" autocomplete="name"></label><label>Account email for verification and password recovery<input name="accountEmail" type="email" required maxlength="254" autocomplete="email"></label><button class="button" type="button" data-action="request-registration-otp">Email me a verification code</button><p class="setup-help" id="registrationOtpStatus" aria-live="polite">Verify your email before creating the account.</p><label>Six-digit email code<input name="emailOtp" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" minlength="6" maxlength="6" required></label><label>Company contact email <span class="field-hint">Optional</span><input name="email" type="email" maxlength="180" autocomplete="email"></label><label>Business address <span class="field-hint">Optional</span><input name="address" maxlength="500" autocomplete="street-address"></label><label>Contact number <span class="field-hint">Optional</span><input name="contactNumbers" maxlength="160" autocomplete="tel"></label><label>Username<input name="username" required minlength="3" maxlength="40" pattern="[a-zA-Z0-9._-]+" autocomplete="username"></label><label>Password (12 characters minimum)<input name="password" type="password" required minlength="12" maxlength="128" autocomplete="new-password"></label><label>Confirm password<input name="confirmPassword" type="password" required minlength="12" maxlength="128" autocomplete="new-password"></label><div class="auth-error" id="accessError" role="alert"></div><button class="button primary auth-submit" type="submit">Create new account</button></form><p class="auth-footnote">Your account email is verified before the business workspace is created.</p><button class="auth-link" data-action="show-login" type="button">Back to sign in</button></section>';}
function showCompanySwitcher(){const choices=(state.access?.companies||[]).filter(c=>c.enabled);if(choices.length<2)return;showContentModal('Switch company','You will be taken to that company’s separate records and backup.',choices.map(c=>'<button class="company-switch-choice" data-action="select-company" data-id="'+esc(c.id)+'"><strong>'+esc(c.name)+'</strong>'+(c.id===state.access.company?.id?'<span>Current company</span>':'')+'</button>').join(''),{wide:false});}
function openProfileForm(){const c=defaultCompany();openCompanyForm(c.id);}
async function adminClick(event){const button=event.target.closest('[data-action]');if(!button)return;const action=button.dataset.action,id=button.dataset.id;
 if(action==='toggle-theme'){toggleTheme();return;}
 if(action==='show-recovery'){event.preventDefault();showRecoveryPage();return;}if(action==='show-login'){event.preventDefault();showAccessLogin();return;}if(action==='show-signup'){event.preventDefault();showAccessSignup();return;}if(action==='request-registration-otp'){event.preventDefault();await requestRegistrationOtp(button);return;}if(action==='request-password-reset-otp'){event.preventDefault();await requestPasswordResetOtp(button);return;}if(action==='request-account-email-otp'){event.preventDefault();await requestAccountEmailOtp(button);return;}if(action==='request-bank-change-otp'){event.preventDefault();await requestBankChangeOtp(button);return;}if(action==='request-admin-user-otp'||action==='request-company-admin-otp'){event.preventDefault();await requestAdminAccountOtp(button);return;}if(action==='retry-startup'){location.reload();return;}if(action==='continue-signup'){await refresh();toast('Your company account is ready.');return;}
 if(action==='logout'){await api('/api/auth/logout','POST',{});state.data=null;state.access=null;await refresh();toast('You are signed out.');return;}
 if(action==='switch-company'){showCompanySwitcher();return;}
 if(action==='select-company'){try{await api('/api/auth/select-company','POST',{companyId:id});closeModal();await refresh();toast('Switched to '+defaultCompany().name+'.');}catch(error){toast(error.message,true);}return;}
 if(action==='admin-tab'){await loadAdminLists(button.dataset.tab);$$('.admin-tabs .tab-button').forEach(x=>x.classList.toggle('active',x===button));return;}
 if(action==='new-user'){openUserForm();return;}if(action==='edit-user'){openUserForm(id);return;}
 if(action==='toggle-user'){const active=button.dataset.active!=='true';try{await api('/api/admin/users/'+id,'PUT',{active,companyId:state.access.company.id});await loadAdminLists();}catch(error){toast(error.message,true);}return;}
 if(action==='remove-user'){if(!confirm('Remove this user from the current company? The user may retain access to other companies.'))return;try{await api('/api/admin/users/'+id,'DELETE',{companyId:state.access.company.id});await loadAdminLists();toast('User removed.');}catch(error){toast(error.message,true);}return;}
 if(action==='new-business'){openBusinessForm();return;}
 if(action==='toggle-business'){const current=Number(button.dataset.enabled)===1;try{await api('/api/admin/companies/'+id,'PUT',{enabled:!current});if(current&&id===state.access.company?.id){const next=state.access.companies.find(c=>c.id!==id&&c.enabled);if(next)await api('/api/auth/select-company','POST',{companyId:next.id});else await api('/api/auth/logout','POST',{});}await refresh();}catch(error){toast(error.message,true);}return;}
 if(action==='save-company-limits'){const input=$('[data-limit-company="'+CSS.escape(id)+'"]');try{await api('/api/admin/companies/'+id,'PUT',{userLimit:Number(input?.value)});await loadAdminLists('companies');toast('User limit saved.');}catch(error){toast(error.message,true);}return;}
 if(action==='create-backup'){try{await api('/api/backup/create','POST',{});const r=await requestFetch('/api/backup/download');if(!r.ok)throw new Error((await r.json()).error||'Account backup could not be created.');const bytes=new Uint8Array(await r.arrayBuffer()),name=decodeURIComponent((r.headers.get('content-disposition')||'').match(/filename="?([^";]+)"?/i)?.[1]||defaultCompany().name+'_Account_Backup.invoicey');if(window.invoiceyDesktop?.saveBackup){const result=await window.invoiceyDesktop.saveBackup({fileName:name,bytes});if(result.saved)toast('Account backup saved as '+result.fileName+'.');}else{const blob=new Blob([bytes],{type:'application/octet-stream'}),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);toast('Private account backup downloaded.');}await refresh();}catch(error){toast(error.message,true);}return;}
 if(action==='restore-history'){if(!confirm('Restore this account backup? Current company data will be replaced after a recovery copy is saved.'))return;try{await api('/api/backup/restore-history','POST',{fileName:button.dataset.file});await refresh();toast('Account backup restored.');}catch(error){toast(error.message,true);}return;}
}
document.addEventListener('submit',event=>{void handleAccessSubmit(event);});
document.addEventListener('click',event=>{void adminClick(event);});
document.addEventListener('change',event=>{if(event.target.matches('[data-company-module]')){const id=event.target.dataset.companyModule,module=event.target.dataset.module,checks=$$('[data-company-module="'+CSS.escape(id)+'"]'),modules=Object.fromEntries(checks.map(x=>[x.dataset.module,x.checked]));void api('/api/admin/companies/'+id,'PUT',{modules}).catch(error=>toast(error.message,true));}});
async function startInvoiceyApp(){
  try{
    const timeout=new Promise((_,reject)=>setTimeout(()=>reject(new Error('The local workspace service did not respond within 15 seconds.')),15000));
    await Promise.race([refresh(),timeout]);
    const params=new URLSearchParams(location.search),kind=params.get('print'),ref=params.get('number');
    if(kind&&ref){const lists={invoice:arr('invoices'),quote:arr('quotations'),purchase:arr('purchases'),receipt:arr('payments')},doc=lists[kind]?.find(x=>x.number===ref||x.id===ref);if(doc){document.title='';state.view=kind==='invoice'?'invoices':kind==='quote'?'quotations':kind==='purchase'?'purchases':'payments';renderPage();openPrint(kind,doc.id);}}
  }catch(error){
    const message=error?.message||'The workspace could not be opened.';
    const errorMarkup=`<div class="empty-state" role="alert"><strong>Couldn’t open your workspace</strong><p>${esc(message)}<br>Try again, or close and reopen itsme invoicey.</p><button class="button primary" data-action="retry-startup" type="button">Try again</button></div>`;
    if(document.body.classList.contains('access-locked')){$('#accessRoot').hidden=false;$('#accessRoot').innerHTML='<section class="access-card">'+errorMarkup+'</section>';}else{$('#pageContent').innerHTML=errorMarkup;}
  }
}
void startInvoiceyApp();

