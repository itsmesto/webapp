/* Run only in a disposable Android QA installation. This exercises the Android
 * runtime through the same fetch transport used by the real interface. */
(() => {
  'use strict';
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const equal = (actual, expected, message) => assert(actual === expected, `${message}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  const near = (actual, expected, message) => assert(Math.abs(Number(actual) - expected) < 0.00001, `${message}: expected ${expected}, received ${actual}`);
  const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/a9sAAAAASUVORK5CYII=';
  const password = 'AndroidQA!Password2026';
  const recovery = 'android-qa-recovery-code-keep-safe-2026';
  const profile = {
    name: 'Android QA Alpha', address: '12 Alpha Lane, Colombo', contactNumbers: '+94 77 123 4567',
    email: 'alpha@example.test', website: 'https://alpha.example.test', logoData: png,
    bankName: 'Alpha Bank', bankBranch: 'Colombo', bankAccountNumber: '0000123456',
    accountHolder: 'Alpha Account Holder', taxNumber: 'ALPHA-123', additionalInfo: 'Android fixture company',
    termsConditions: 'Alpha terms only\nPayment within 7 days.', currency: 'LKR', locale: 'en-LK'
  };
  const results = [];
  const check = (name, fn) => {
    try { fn(); results.push({name, status: 'passed'}); }
    catch (error) { results.push({name, status: 'failed', error: error.message}); }
  };
  const request = async (endpoint, method = 'GET', body) => {
    const binary = body instanceof Uint8Array || body instanceof ArrayBuffer;
    const response = await fetch('/api/' + endpoint, {method,
      headers: body === undefined ? {} : {'content-type': binary ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/json'},
      body: body === undefined ? undefined : binary ? body : JSON.stringify(body)});
    const text = await response.text();
    let data; try { data = JSON.parse(text); } catch (_) { data = {unparseable: text}; }
    return {status: response.status, data};
  };
  const api = async (endpoint, method, body) => {
    const result = await request(endpoint, method, body);
    equal(result.status, 200, `${method || 'GET'} ${endpoint} status`);
    assert(result.data.unparseable === undefined, `${endpoint} returned non-JSON`);
    return result.data;
  };
  const rejected = async (name, endpoint, method, body, status = 400) => {
    const result = await request(endpoint, method, body);
    check(name, () => { equal(result.status, status, 'Rejection status'); assert(result.data.error, 'Rejection must include useful error'); });
  };
  const login = username => api('auth/login', 'POST', {username, password});
  const logout = () => api('auth/logout', 'POST', {});
  const snapshot = () => api('bootstrap');
  const nativeReporter = async report => {
    if (!window.InvoiceyNative || typeof window.InvoiceyNative.call !== 'function') return;
    const response = JSON.parse(window.InvoiceyNative.call('env', '{}'));
    const env = response.value || response.result || response.data || response;
    if (!env.dataRoot) throw new Error('Native environment did not provide a private data root.');
    const bytes = new TextEncoder().encode(JSON.stringify(report, null, 2));
    let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte);
    const fileName = report.environment.includes('post-relaunch') ? 'qa-persistence-report.json' : 'qa-report.json';
    const result = JSON.parse(window.InvoiceyNative.call('fs.write', JSON.stringify({path: env.dataRoot + '/' + fileName, data: btoa(binary)})));
    if (!result.ok) throw new Error(result.error || 'Could not save the QA report.');
  };
  let fixture = null;

  window.runInvoiceyQA = async ({report: saveReport = nativeReporter} = {}) => {
    results.length = 0;
    fixture = null;
    const date = new Date().toISOString().slice(0, 10), year = date.slice(0, 4);
    let stage = 'precondition';
    try {
      const status = await api('auth/status');
      assert(status.setupRequired === true, 'Refusing to modify an existing installation. Use a clean, disposable QA data directory.');
      const anonymous = await request('bootstrap');
      check('Anonymous requests cannot read business records', () => equal(anonymous.status, 401, 'Anonymous bootstrap'));
      stage = 'setup';
      const setup = await api('auth/setup', 'POST', {company: profile, username: 'androidqaadmin', displayName: 'Android QA Admin', password, recoveryCode: recovery, recoveryCodeConfirm: recovery,
        superUsername: 'androidqasuper', superDisplayName: 'Android QA Software Admin', superPassword: password, superRecoveryCode: recovery, superRecoveryCodeConfirm: recovery});
      const companyA = setup.company.id;
      check('First setup creates company administrator and separate super administrator', () => {equal(setup.authenticated, true, 'Authenticated'); equal(setup.company.name, profile.name, 'Company'); assert(setup.recoveryCode, 'Admin recovery code'); assert(setup.superAdminRecoveryCode, 'Super administrator recovery code'); });
      await api('companies/company-default', 'PUT', profile);
      await api('settings', 'PUT', {currency: 'LKR', locale: 'en-LK'});
      let data = await snapshot();
      check('Profile, proportional logo source, bank account, contacts and terms save', () => {
        const company = data.companies[0]; equal(company.name, profile.name, 'Name'); equal(company.address, profile.address, 'Address'); equal(company.logo_data, png, 'Logo bytes');
        equal(company.bank_account_number, profile.bankAccountNumber, 'Bank account'); equal(company.email, profile.email, 'Email'); equal(company.terms_conditions, profile.termsConditions, 'Terms');
      });
      await rejected('Company profile requires a name', 'companies/company-default', 'PUT', {...profile, name: '  '});
      stage = 'inventory and parties';
      const customer = await api('customers', 'POST', {name: 'José Perera QA', phone: '+94 77 998 7766', email: 'customer@example.test', address: '85 Mango Avenue, Galle'});
      const supplier = await api('suppliers', 'POST', {name: 'QA Parts Vendor', phone: '071 444 8899', email: 'supplier@example.test', address: '4 Supplier Road'});
      const product = await api('products', 'POST', {sku: 'ANDROID-QA-PRODUCT', name: 'Repair part', description: 'Genuine replacement part', quantity: 10, purchasePrice: 100, sellingPrice: 200, reorderLevel: 2});
      const service = await api('services', 'POST', {code: 'ANDROID-QA-SERVICE', title: 'Computer Repair Service', description: 'Diagnose, repair and test the computer.', unitPrice: 500, unitCost: 50});
      await api('services/' + service.id, 'PUT', {...service, unitPrice: 550});
      const purchase = await api('purchases', 'POST', {companyId: 'company-default', supplierId: supplier.id, purchaseDate: date, items: [{productId: product.id, quantity: 10, unitCost: 120}], paidAmount: 200, terms: profile.termsConditions});
      data = await snapshot();
      check('Purchase adds stock with weighted cost and supplier payment', () => {
        const saved = data.products.find(row => row.id === product.id); equal(saved.quantity, 20, 'Stock'); near(saved.purchase_price, 110, 'Weighted cost');
        near(purchase.total, 1200, 'Purchase total'); equal(purchase.status, 'partial', 'Status'); near(data.supplier_payments.filter(row => row.purchase_id === purchase.id).reduce((sum, row) => sum + row.amount, 0), 200, 'Supplier payment');
      });
      const items = [{itemType: 'product', productId: product.id, quantity: 2, unitPrice: 200, discountPercent: 10}, {itemType: 'service', serviceId: service.id, quantity: 1, unitPrice: 550, unitCost: 50, discountPercent: 20}];
      stage = 'documents';
      const quotePayload = {companyId: 'company-default', customerId: customer.id, quoteDate: date, validUntil: `${year}-12-31`, status: 'sent', projectName: 'Computer workshop', discountPercent: 10, taxRate: 18, terms: profile.termsConditions, items};
      const quote = await api('quotations', 'POST', quotePayload);
      data = await snapshot();
      check('Quotation discount, tax and project key are correct and stock is unchanged', () => {near(quote.subtotal, 950, 'Subtotal'); near(quote.discount_amount, 230, 'Discount'); near(quote.tax_amount, 129.6, 'Tax'); near(quote.total, 849.6, 'Total'); assert(new RegExp(`^QT-${year}-\\d{6}$`).test(quote.project_key), 'Project key format'); equal(data.products.find(row => row.id === product.id).quantity, 20, 'Quotation stock'); });
      const edited = await api('quotations/' + quote.id, 'PUT', {...quotePayload, notes: 'Edited Android quote'});
      check('Quotation update preserves project reference', () => {equal(edited.project_key, quote.project_key, 'Project key'); equal(edited.notes, 'Edited Android quote', 'Notes'); });
      await rejected('Document creation requires company selection', 'invoices', 'POST', {customerId: customer.id, items});
      await rejected('Duplicate lines cannot oversell aggregate stock', 'invoices', 'POST', {companyId: 'company-default', customerId: customer.id, items: [{productId: product.id, quantity: 11}, {productId: product.id, quantity: 11}]});
      data = await snapshot();
      check('Rejected invoice leaves no partial inventory or invoice writes', () => {equal(data.products.find(row => row.id === product.id).quantity, 20, 'Stock'); equal(data.invoices.length, 0, 'Invoices'); });
      const estimate = await api('quotations', 'POST', {companyId: 'company-default', customerId: customer.id, documentType: 'estimate', quoteDate: date, terms: profile.termsConditions, items: [{itemType: 'service', serviceTitle: 'Consultation', serviceDescription: 'Service detail', quantity: 1, unitPrice: 300, unitCost: 20}]});
      check('Estimate has separate numbering and company terms', () => {assert(estimate.number.startsWith('EST-'), 'Estimate prefix'); equal(estimate.terms, profile.termsConditions, 'Terms'); });
      stage = 'expenses';
      const labour = await api('expenses', 'POST', {projectKey: quote.project_key, quotationId: quote.id, customerId: customer.id, description: 'Workshop labour', category: 'Labour', expenseType: 'labour', workerCount: 2, workerNames: 'Technician One, Technician Two', workingDays: 2, labourRate: 1000, additionalLabour: 500, expenseDate: date, attachments: [{name: 'qa-labour-receipt.png', type: 'image/png', data: png}]});
      const materials = await api('expenses', 'POST', {projectKey: quote.project_key, quotationId: quote.id, supplierId: supplier.id, description: 'Consumable materials', category: 'Materials', amount: 3000, expenseDate: date});
      await api('expenses', 'POST', {projectKey: quote.project_key, description: 'Transport cost', category: 'Transport', amount: 500, expenseDate: date});
      data = await snapshot();
      const attachment = data.expense_attachments.find(row => row.expense_id === labour.id);
      check('Labour cost and project/supplier/receipt links save', () => {near(labour.amount, 4500, 'Labour'); equal(labour.customer_id, customer.id, 'Customer'); equal(materials.supplier_id, supplier.id, 'Supplier'); assert(attachment, 'Receipt metadata'); equal(attachment.file_name, 'qa-labour-receipt.png', 'Receipt name'); });
      const attachmentResponse = await fetch('/api/expense-attachments/' + attachment.id), attachmentBytes = new Uint8Array(await attachmentResponse.arrayBuffer());
      check('Saved receipt bytes can be read', () => {equal(attachmentResponse.status, 200, 'Receipt read'); equal(attachmentBytes[0], 137, 'PNG signature'); equal(attachmentBytes[1], 80, 'PNG signature'); });
      const invoice = await api('quotations/' + quote.id + '/convert', 'POST', {invoiceDate: date, paidAmount: 100, paymentMethod: 'Bank transfer'});
      data = await snapshot();
      check('Conversion preserves project and terms and adjusts only products once', () => {equal(invoice.project_key, quote.project_key, 'Project'); equal(invoice.terms, profile.termsConditions, 'Terms'); near(invoice.total, quote.total, 'Invoice amount'); equal(data.products.find(row => row.id === product.id).quantity, 18, 'Stock'); equal(data.stock_movements.filter(row => row.movement_type === 'Sale').length, 1, 'Sale movement'); const line = data.invoice_items.find(row => row.invoice_id === invoice.id && row.item_type === 'service'); equal(line.product_id, null, 'Service product'); equal(line.service_title, service.title, 'Service title'); equal(line.service_description, service.description, 'Service description'); });
      await api('payments', 'POST', {invoiceId: invoice.id, amount: 800, paymentDate: date, method: 'Cash'});
      data = await snapshot();
      check('Payment updates overpaid status and balance inputs', () => {equal(data.invoices.find(row => row.id === invoice.id).status, 'overpaid', 'Invoice status'); near(data.payments.filter(row => row.invoice_id === invoice.id).reduce((sum, row) => sum + row.amount, 0), 900, 'Paid total'); });
      await api('expenses/' + materials.id, 'PUT', {projectKey: quote.project_key, quotationId: quote.id, supplierId: supplier.id, description: 'Updated materials', category: 'Materials', amount: 3000, expenseDate: date});
      data = await snapshot();
      check('Project expense totals and cost inputs remain linked after edits', () => {near(data.expenses.filter(row => row.project_key === quote.project_key).reduce((sum, row) => sum + row.amount, 0), 8000, 'Project costs'); equal(data.expenses.filter(row => row.project_key === quote.project_key && row.expense_type === 'labour').length, 1, 'Labour records'); });
      const partner = await api('partners', 'POST', {name: 'Partner One QA', sharePercent: 50}), profit = await api('profit-shares/generate', 'POST', {periodStart: `${year}-01-01`, periodEnd: `${year}-12-31`});
      check('Profit-sharing calculation creates a linked partner record', () => equal(profit.shares[0].partner_id, partner.id, 'Partner'));
      stage = 'backup';
      const workbookResponse = await fetch('/api/backup.xlsx'), workbook = new Uint8Array(await workbookResponse.arrayBuffer());
      check('Company XLSX backup contains a real ZIP workbook', () => {equal(workbookResponse.status, 200, 'Backup status'); equal(workbook[0], 80, 'ZIP signature'); equal(workbook[1], 75, 'ZIP signature'); assert(workbook.length > 1000, 'Backup size'); });
      const ownRestore = await request('restore', 'POST', workbook);
      check('Company can restore its own workbook', () => equal(ownRestore.status, 200, 'Restore'));
      await api('backup/create', 'POST', {});
      const backupStatus = await api('backup/status'), history = await api('backup/history');
      check('Automatic/manual backup and recovery history remain available', () => {assert(backupStatus.available, 'Available'); assert(backupStatus.fileName.endsWith('_Backup.xlsx'), 'Per-company name'); assert(history.length > 0, 'History'); });
      await rejected('Corrupt workbook is rejected with useful error', 'restore', 'POST', new Uint8Array([80, 75, 0, 0, 0]));
      data = await snapshot();
      check('Failed restore preserves existing invoice and receipt', () => {assert(data.invoices.some(row => row.id === invoice.id), 'Invoice'); assert(data.expense_attachments.some(row => row.expense_id === labour.id), 'Receipt'); });
      stage = 'separation';
      await logout(); await login('androidqasuper');
      const companyB = await api('admin/companies', 'POST', {company: {name: 'Android QA Beta'}, userLimit: 1, admin: {username: 'androidqabeta', displayName: 'Beta Admin', password, recoveryCode: recovery, recoveryCodeConfirm: recovery}});
      await api('auth/select-company', 'POST', {companyId: companyB.id});
      data = await snapshot();
      check('New company has a separate empty business environment', () => {equal(data.customers.length, 0, 'Customers'); equal(data.products.length, 0, 'Products'); equal(data.invoices.length, 0, 'Invoices'); });
      const wrongRestore = await request('restore', 'POST', workbook);
      check('Company A workbook cannot overwrite company B', () => equal(wrongRestore.status, 400, 'Wrong-company restore'));
      await rejected('Company user limit prevents extra account', 'admin/users', 'POST', {companyId: companyB.id, username: 'androidqaextra', displayName: 'Extra', password, role: 'salesperson', recoveryCode: recovery, recoveryCodeConfirm: recovery}, 409);
      await api('customers', 'POST', {name: 'Only in Beta QA', phone: '07000112233'});
      data = await snapshot();
      check('Beta writes remain in Beta only', () => {equal(data.customers.length, 1, 'Customer count'); equal(data.customers[0].name, 'Only in Beta QA', 'Customer'); });
      await api('auth/select-company', 'POST', {companyId: companyA}); data = await snapshot();
      check('Switching to Alpha reloads only Alpha data', () => {assert(data.customers.some(row => row.id === customer.id), 'Alpha customer'); assert(!data.customers.some(row => row.name === 'Only in Beta QA'), 'Beta leakage'); assert(data.invoices.some(row => row.id === invoice.id), 'Alpha invoice'); });
      await logout();
      const signup = await api('auth/signup', 'POST', {company: {name: 'Android QA Signup'}, username: 'androidqasignup', displayName: 'Signup Admin', password, recoveryCode: recovery, recoveryCodeConfirm: recovery});
      data = await snapshot();
      check('Sign up creates and authenticates isolated company administrator', () => {equal(signup.authenticated, true, 'Authenticated'); equal(data.companies[0].name, 'Android QA Signup', 'Signup company'); equal(data.customers.length, 0, 'Customers'); assert(signup.recoveryCode, 'Recovery code'); });
      await rejected('Sign up rejects duplicate username', 'auth/signup', 'POST', {company: {name: 'Duplicate QA'}, username: 'androidqasignup', displayName: 'Duplicate', password, recoveryCode: recovery, recoveryCodeConfirm: recovery}, 409);
      stage = 'permissions';
      await logout(); await login('androidqaadmin');
      const forbidden = await request('admin/companies');
      check('Company admin cannot list software-wide companies', () => equal(forbidden.status, 403, 'Super access'));
      const salesperson = await api('admin/users', 'POST', {companyId: companyA, username: 'androidqasales', displayName: 'Android Sales', password, role: 'salesperson', recoveryCode: recovery, recoveryCodeConfirm: recovery});
      await logout(); await login('androidqasales');
      await rejected('Salesperson cannot read expenses', 'expenses', 'GET', undefined, 403);
      await rejected('Salesperson cannot manage user accounts', 'admin/users', 'GET', undefined, 403);
      const salesStatus = await api('auth/status');
      check('Salesperson role and active company are correct', () => {equal(salesStatus.user.role, 'salesperson', 'Role'); equal(salesStatus.company.id, companyA, 'Company'); });
      data = await snapshot();
      check('Salesperson cannot read another user invoice or quotation', () => {assert(!data.invoices.some(row => row.id === invoice.id), 'Admin invoice leakage'); assert(!data.quotations.some(row => row.id === quote.id), 'Admin quotation leakage'); });
      await logout();
      const blocked = await request('bootstrap');
      check('Logout denies subsequent protected reads', () => equal(blocked.status, 401, 'Logged out'));
      const recovered = await request('auth/recover', 'POST', {username: 'androidqasales', recoveryCode: recovery, newPassword: 'AndroidQA!ResetPassword2026'});
      check('Offline recovery code resets password', () => equal(recovered.status, 200, 'Recovery'));
      const resetLogin = await request('auth/login', 'POST', {username: 'androidqasales', password: 'AndroidQA!ResetPassword2026'});
      check('Reset password can authenticate', () => equal(resetLogin.status, 200, 'Reset login'));
      await logout(); await login('androidqaadmin');
      fixture = {companyId: companyA, invoiceId: invoice.id, quoteId: quote.id, productId: product.id, labourId: labour.id, salespersonId: salesperson.id, projectKey: quote.project_key, username: 'androidqaadmin', password, bankAccount: profile.bankAccountNumber, terms: profile.termsConditions};
      localStorage.setItem('invoicey-qa-fixture', JSON.stringify(fixture));
      check('Persistence fixture is ready for force-stop/relaunch verification', () => assert(!!localStorage.getItem('invoicey-qa-fixture'), 'Fixture'));
    } catch (error) { results.push({name: `Workflow execution stopped at ${stage}`, status: 'failed', error: error.stack || error.message}); }
    const report = {createdAt: new Date().toISOString(), environment: 'Android runtime through real app fetch transport', userAgent: navigator.userAgent, passed: results.filter(item => item.status === 'passed').length, failed: results.filter(item => item.status === 'failed').length, results: [...results], fixture,
      unverifiedByThisScript: ['Physical Samsung Galaxy A16', 'Android install/update', 'Force-stop/relaunch until verifyInvoiceyQAPersistence is run', 'Actual rendered phone layout', 'System file picker and external providers', 'Rendered PDF pages and A4 dimensions', 'Physical printing', 'Real phone performance']};
    console.log('INVOICEY_ANDROID_QA ' + JSON.stringify(report));
    if (saveReport) await saveReport(report);
    return report;
  };

  window.runInvoiceyPersistenceQA = async ({report: saveReport = nativeReporter} = {}) => {
    const saved = JSON.parse(localStorage.getItem('invoicey-qa-fixture') || 'null');
    assert(saved, 'No QA fixture exists. Run the main workflow in a fresh disposable installation first.');
    const persistenceResults = [];
    const verify = (name, fn) => {try {fn(); persistenceResults.push({name, status: 'passed'});} catch (error) {persistenceResults.push({name, status: 'failed', error: error.message});}};
    let status = await api('auth/status');
    if (!status.authenticated) await api('auth/login', 'POST', {username: saved.username, password: saved.password});
    const data = await snapshot();
    verify('Relaunch restores correct company and saved profile', () => {equal(data.companies[0].bank_account_number, saved.bankAccount, 'Bank account'); equal(data.companies[0].terms_conditions, saved.terms, 'Terms'); });
    verify('Relaunch retains invoice, quotation and Project Key', () => {equal(data.invoices.find(row => row.id === saved.invoiceId).project_key, saved.projectKey, 'Invoice project'); assert(data.quotations.some(row => row.id === saved.quoteId), 'Quotation'); });
    verify('Relaunch retains inventory and expense receipts', () => {equal(data.products.find(row => row.id === saved.productId).quantity, 18, 'Stock'); assert(data.expenses.some(row => row.id === saved.labourId), 'Labour'); assert(data.expense_attachments.some(row => row.expense_id === saved.labourId), 'Receipt'); });
    const users = await api('admin/users');
    verify('Relaunch retains company users and roles', () => equal(users.find(row => row.id === saved.salespersonId).role, 'salesperson', 'Role'));
    const report = {createdAt: new Date().toISOString(), environment: 'Android post-relaunch persistence', passed: persistenceResults.filter(item => item.status === 'passed').length, failed: persistenceResults.filter(item => item.status === 'failed').length, results: persistenceResults};
    console.log('INVOICEY_ANDROID_PERSISTENCE_QA ' + JSON.stringify(report));
    if (saveReport) await saveReport(report);
    return report;
  };
  window.verifyInvoiceyQAPersistence = window.runInvoiceyPersistenceQA;
})();

