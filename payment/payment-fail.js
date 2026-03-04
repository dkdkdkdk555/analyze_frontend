import { applyTranslations, t } from '../components/i18n.js';

document.title = t('payment.fail_page_title');
applyTranslations();

const params = new URLSearchParams(location.search);
const msg = params.get('message');
if (msg) document.getElementById('fail-msg').textContent = decodeURIComponent(msg);
