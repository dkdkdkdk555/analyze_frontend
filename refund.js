import { initHeader } from './components/header.js';
import { initFooter } from './components/footer.js';

const API_BASE_URL = 'https://analyze-dega.ukdroidisgood.workers.dev';

initHeader({ page: '', apiBaseUrl: API_BASE_URL });
initFooter();

const res = await fetch('/assets/policy/ko/refund.md');
const md = await res.text();
document.getElementById('policy-content').innerHTML = marked.parse(md);
