/**
 * i18n module — Korean / English (Japanese placeholder)
 *
 * Usage:
 *   import { t, getLang, setLang, applyTranslations } from './components/i18n.js';
 *
 * HTML attributes:
 *   data-i18n="key"             → el.textContent
 *   data-i18n-html="key"        → el.innerHTML
 *   data-i18n-placeholder="key" → el.placeholder
 *   data-i18n-title-key="key"   → document.title (on meta[name=page-title])
 */

const TRANSLATIONS = {
  ko: {
    // ── Nav ──────────────────────────────────────────────────────────
    'nav.services':             '서비스',
    'nav.pricing':              '이용 플랜',
    'nav.blog':                 '블로그',

    // ── Header search ────────────────────────────────────────────────
    'header.search_placeholder':        '다른 앱 분석하기',
    'header.mobile_search_label':       '다른 앱 분석하기',
    'header.mobile_search_placeholder': '앱 이름 검색',
    'header.searching':                 '검색 중...',
    'header.no_results':                '검색 결과가 없습니다',
    'header.menu_open':                 '메뉴 열기',
    'header.menu_close':                '메뉴 닫기',

    // ── Auth UI ──────────────────────────────────────────────────────
    'auth.remaining_credits':   '잔여 크레딧',
    'auth.my_analyses':         '분석결과',
    'auth.credit_history':      '크레딧 사용내역',
    'auth.payment_history':     '결제 내역',
    'auth.logout':              '로그아웃',
    'auth.logout_confirm':      '로그아웃 하시겠습니까?',

    // ── Language switcher ────────────────────────────────────────────
    'lang.ko': '한국어',
    'lang.en': 'English',
    'lang.ja': '日本語',

    // ── Footer ───────────────────────────────────────────────────────
    'footer.tagline':       '데이터로 증명하는 앱 성장 파트너. 시장 조사부터 경쟁사 분석까지 한 번에 해결하세요.',
    'footer.biz_number':    '사업자등록번호 136-15-09172',
    'footer.address':       '서울특별시 관악구 쑥고개로30길 34, 1층 101호(봉천동)',
    'footer.paddle_notice': '본 서비스의 주문 및 결제는 글로벌 결제 대행사 <strong>Paddle.com</strong> 및 <strong>PayPal</strong>에서 처리됩니다. Paddle은 법적 판매자로서 모든 결제 관련 문의와 환불을 책임집니다.',
    'footer.terms':         '이용약관',
    'footer.privacy':       '개인정보처리방침',
    'footer.refund':        '환불정책',
    'footer.policy':        'Policy',
    'footer.contact':       'Contact',

    // ── Index page ───────────────────────────────────────────────────
    'index.page_title':     'TalonInsight - 정확한 앱 경쟁자분석',
    'index.hero_title':     '귀찮은 앱 시장조사,<br><span class="text-primary">대신해 드립니다</span>',
    'index.hero_subtitle':  '경쟁앱의 스토어 등록정보와 리뷰를 분석하여 앱의 핵심 가치와 미해결 문제를 파악해 드립니다.',
    'index.search_placeholder': '분석할 앱 이름을 입력하세요',
    'index.dropdown_more':  '결과 더 보기',
    'index.error':          '오류가 발생했습니다. 잠시 후 다시 시도해주세요',
    'index.feat1_title':    '실시간 리뷰 감성 분석',
    'index.feat1_desc':     '수천 개의 사용자 리뷰를 AI가 분석하여 긍정, 부정 키워드와 핵심 요구사항을 도출합니다.',
    'index.feat2_title':    '시장 점유율 데이터',
    'index.feat2_desc':     '카테고리별 순위 변화와 다운로드 추이를 분석하여 시장 내 경쟁구도를 파악합니다.',
    'index.feat3_title':    '미해결 페인포인트 발굴',
    'index.feat3_desc':     '경쟁 서비스가 해결하지 못한 사용자들의 불편함을 찾아내어 새로운 비즈니스 기회를 제시합니다.',
    'index.feat4_title':    '시장 진입 전략 제안',
    'index.feat4_desc':     '새로운 앱 서비스를 기획하는 1인 창업자 관점에서 시장 진입 시 전략을 제안합니다.',

    // ── Pricing page ─────────────────────────────────────────────────
    'pricing.page_title':         '이용 플랜 - TalonInsight',
    'pricing.hero_title_mobile':  '필요한 만큼 충전하고,<br>원하는 만큼 분석하세요.',
    'pricing.hero_sub_mobile':    '합리적인 크레딧 플랜으로 시작해보세요.',
    'pricing.hero_title_desktop': '이용 플랜',
    'pricing.hero_sub_desktop':   '필요한 만큼 충전하고, 원하는 만큼 분석하세요.',
    'pricing.recommended':        '추천',
    'pricing.cta':                '충전하기',
    'pricing.starter_desc':       '아이디어를 빠르게 검증해보는 소규모 분석에 적합합니다.',
    'pricing.growth_desc':        '시장을 제대로 읽고 싶은 창업자에게 가장 많이 선택되는 균형 잡힌 플랜입니다.',
    'pricing.pro_desc':           '시장을 반복해서 깊게 분석하는 분께 적합한 플랜입니다.',
    'pricing.power_desc':         '여러 프로젝트를 동시에 대량으로 분석하는 분께 최적화된 플랜입니다.',
    'pricing.faq_title':          '자주 묻는 질문',
    'pricing.faq1_q':             '크레딧 유효기간은 어떻게되나요?',
    'pricing.faq1_a':             '충전된 크레딧은 평생 유효합니다. 기간 제한 없이 원하실 때 언제든 사용하실 수 있습니다.',
    'pricing.faq2_q':             '무료 분석횟수는 크레딧에 포함되나요?',
    'pricing.faq2_a':             '아니요, 매일 제공되는 무료 분석 3회는 크레딧에서 차감되지 않습니다. 무료 횟수를 모두 소진한 후에만 크레딧이 사용됩니다.',
    'pricing.faq3_q':             '환불규정은 어떻게 되나요?',
    'pricing.faq3_a':             '구매 후 크레딧을 전혀 사용하지 않으신 경우, 7일 이내에 전액 환불이 가능합니다. 자세한 내용은 <a href="refund.html" class="text-primary underline hover:text-blue-700 transition-colors">환불정책</a>을 확인하세요.',
    'pricing.faq4_q':             '분석 실패 시 크레딧이 차감되나요?',
    'pricing.faq4_a':             '시스템 오류나 서비스 장애로 인해 분석에 실패한 경우에는 크레딧이 절대 차감되지 않습니다. 안심하고 이용하세요.',
    'pricing.login_required':     '로그인 후 이용해 주세요.',
    'pricing.payment_error':      '결제 시스템을 불러오는 데 실패했어요. 잠시 후 다시 시도해 주세요.',
    'pricing.network_error':      '네트워크 오류가 발생했어요. 다시 시도해 주세요.',
    'pricing.prepare_error':      '결제 준비에 실패했어요.',

    // ── Policy pages ─────────────────────────────────────────────────
    'privacy.page_title':        '개인정보처리방침 - TalonInsight',
    'refund.page_title':         '환불정책 - TalonInsight',
    'terms.page_title':          '이용약관 - TalonInsight',
    'policy.loading':            '불러오는 중...',

    // ── Services page ────────────────────────────────────────────────
    'services.page_title':       '서비스 - TalonInsight',
    'services.single_title':     '앱 개별 분석',
    'services.single_desc':      '경쟁앱을 깊게 파고들어 시장 기회를 찾아보세요.<br>앱스토어 · 플레이스토어 리뷰를 분석하여 미해결 문제,<br>핵심 가치, 진입 전략을 도출합니다.',
    'services.single_f1':        '시장 규모 정의 (TAM / SAM)',
    'services.single_f2':        '핵심 가치 및 기능 분석',
    'services.single_f3':        '평점별 리뷰 심층 분석',
    'services.single_f4':        '미해결 문제 추출 (진입 기회)',
    'services.single_f5':        '신규 서비스 전략 제안',
    'services.free_per_day':     '일 3회 무료',
    'services.credit_per':       '이후 1 크레딧/건',
    'services.start':            '시작하기',
    'services.group_title':      '그룹 분석',
    'services.group_desc':       '같은 카테고리 앱 2~5개를 한 번에 비교·분석하세요.<br>포지셔닝 맵, 공통 페인포인트, 시장 점유율 추정으로 경쟁 구도와 시장 기회를 한눈에 파악합니다.',
    'services.group_f1':         '그룹에 추가된 모든 앱의 개별 분석',
    'services.group_f2':         '경쟁 앱 포지셔닝 맵 시각화',
    'services.group_f3':         '공통 미해결 문제 추출',
    'services.group_f4':         '시장 점유율 추정 (리뷰 기반)',
    'services.group_f5':         '진입 기회 전략 & 리스크 분석',
    'services.group_f6':         '종합 경쟁 구도 결론',
    'services.group_credit':     '앱 수 + 1 크레딧/건',
    'services.table_title':      '서비스 비교',
    'services.table_feature':    '기능',
    'services.table_single':     '개별 분석',
    'services.table_group':      '그룹 분석',
    'services.row_market_size':  '시장 규모 분석 (TAM/SAM)',
    'services.row_core_value':   '핵심 가치 & 기능 분석',
    'services.row_review':       '평점별 리뷰 분석',
    'services.row_entry':        '진입 전략 제안',
    'services.row_positioning':  '경쟁 앱 포지셔닝 맵',
    'services.row_pain':         '공통 미해결 문제 추출',
    'services.row_share':        '시장 점유율 추정',
    'services.row_risk':         '진입 리스크 분석',
    'services.row_credits':      '크레딧',
    'services.credits_single':   '1 크레딧/건',
    'services.credits_single_free': '일 3회 무료',
    'services.credits_group':    '앱 수 + 1 크레딧',
    'services.cta_question':     '크레딧이 필요하신가요?',
    'services.view_pricing':     '이용 플랜 보기',
    'services.coming_title':     '준비 중인 기능이에요',
    'services.coming_desc':      '그룹 분석 기능을 열심히 준비하고 있어요.<br>조금만 기다려 주세요!',
    'services.coming_confirm':   '확인',
  },

  en: {
    // ── Nav ──────────────────────────────────────────────────────────
    'nav.services':             'Services',
    'nav.pricing':              'Pricing',
    'nav.blog':                 'Blog',

    // ── Header search ────────────────────────────────────────────────
    'header.search_placeholder':        'Search another app',
    'header.mobile_search_label':       'Search Another App',
    'header.mobile_search_placeholder': 'Search app name',
    'header.searching':                 'Searching...',
    'header.no_results':                'No results found',
    'header.menu_open':                 'Open menu',
    'header.menu_close':                'Close menu',

    // ── Auth UI ──────────────────────────────────────────────────────
    'auth.remaining_credits':   'Credits Remaining',
    'auth.my_analyses':         'My Analyses',
    'auth.credit_history':      'Credit History',
    'auth.payment_history':     'Payment History',
    'auth.logout':              'Log out',
    'auth.logout_confirm':      'Are you sure you want to log out?',

    // ── Language switcher ────────────────────────────────────────────
    'lang.ko': '한국어',
    'lang.en': 'English',
    'lang.ja': '日本語',

    // ── Footer ───────────────────────────────────────────────────────
    'footer.tagline':       'Your data-driven app growth partner. From market research to competitor analysis — all in one place.',
    'footer.biz_number':    'Business Registration No. 136-15-09172',
    'footer.address':       '34 Ssukgogae-ro 30-gil, Gwanak-gu, Seoul, Republic of Korea',
    'footer.paddle_notice': 'Our order process is conducted by our online reseller <strong>Paddle.com Market Limited</strong>. Paddle is the <strong>Merchant of Record</strong> for all our orders. Paddle provides all customer service inquiries and handles returns.',
    'footer.terms':         'Terms of Service',
    'footer.privacy':       'Privacy Policy',
    'footer.refund':        'Refund Policy',
    'footer.policy':        'Policy',
    'footer.contact':       'Contact',

    // ── Index page ───────────────────────────────────────────────────
    'index.page_title':     'TalonInsight - Sharp App Competitor Analysis',
    'index.hero_title':     'Skip the tedious market research —<br><span class="text-primary">let us do it for you.</span>',
    'index.hero_subtitle':  'Analyze competitor apps\' store listings and reviews to uncover core value propositions and unresolved pain points.',
    'index.search_placeholder': 'Enter an app name to analyze',
    'index.dropdown_more':  'Show more results',
    'index.error':          'Something went wrong. Please try again later.',
    'index.feat1_title':    'Real-Time Review Sentiment Analysis',
    'index.feat1_desc':     'Our AI processes thousands of user reviews to surface positive and negative keywords along with the core needs your market cares about.',
    'index.feat2_title':    'Market Share Insights',
    'index.feat2_desc':     'Track category ranking shifts and download trends to map out the competitive landscape and spot opportunities.',
    'index.feat3_title':    'Unresolved Pain Point Discovery',
    'index.feat3_desc':     'Identify unmet user needs that competitors haven\'t solved — and turn those gaps into your next big opportunity.',
    'index.feat4_title':    'Market Entry Strategy',
    'index.feat4_desc':     'Get an actionable go-to-market strategy tailored for solo founders looking to break into a new app market.',

    // ── Pricing page ─────────────────────────────────────────────────
    'pricing.page_title':         'Pricing Plans - TalonInsight',
    'pricing.hero_title_mobile':  'Top up when you need it.<br>Analyze as much as you want.',
    'pricing.hero_sub_mobile':    'Pick a credit plan that fits your pace.',
    'pricing.hero_title_desktop': 'Pricing Plans',
    'pricing.hero_sub_desktop':   'Top up when you need it. Analyze as much as you want.',
    'pricing.recommended':        'Best Value',
    'pricing.cta':                'Get Credits',
    'pricing.starter_desc':       'Perfect for quickly validating ideas with small-scale analysis.',
    'pricing.growth_desc':        'The most popular plan for founders who want a real read on the market.',
    'pricing.pro_desc':           'Built for analysts who dive deep into the market on a regular basis.',
    'pricing.power_desc':         'Optimized for power users running high-volume analysis across multiple projects.',
    'pricing.faq_title':          'Frequently Asked Questions',
    'pricing.faq1_q':             'Do my credits expire?',
    'pricing.faq1_a':             'Credits never expire. Use them whenever you like — no time limit.',
    'pricing.faq2_q':             'Do free analyses count against my credits?',
    'pricing.faq2_a':             'No. Your 3 free daily analyses don\'t touch your credits. Credits only kick in after your free quota is used up.',
    'pricing.faq3_q':             'What\'s the refund policy?',
    'pricing.faq3_a':             'If you haven\'t used any credits, you can request a full refund within 7 days of purchase. See our <a href="refund.html" class="text-primary underline hover:text-blue-700 transition-colors">Refund Policy</a> for details.',
    'pricing.faq4_q':             'Will I be charged if an analysis fails?',
    'pricing.faq4_a':             'If an analysis fails due to a system error or service disruption, you will never be charged. You\'re fully covered.',
    'pricing.login_required':     'Please log in to continue.',
    'pricing.payment_error':      'Failed to load the payment system. Please try again in a moment.',
    'pricing.network_error':      'A network error occurred. Please try again.',
    'pricing.prepare_error':      'Failed to prepare your payment.',

    // ── Policy pages ─────────────────────────────────────────────────
    'privacy.page_title':        'Privacy Policy - TalonInsight',
    'refund.page_title':         'Refund Policy - TalonInsight',
    'terms.page_title':          'Terms of Service - TalonInsight',
    'policy.loading':            'Loading...',

    // ── Services page ────────────────────────────────────────────────
    'services.page_title':       'Services - TalonInsight',
    'services.single_title':     'Single App Analysis',
    'services.single_desc':      'Dig deep into a competitor app and uncover market opportunities.<br>Analyze App Store & Play Store reviews to extract unresolved problems,<br>core value propositions, and entry strategies.',
    'services.single_f1':        'Market Size Definition (TAM / SAM)',
    'services.single_f2':        'Core Value & Feature Analysis',
    'services.single_f3':        'In-Depth Rating-Based Review Analysis',
    'services.single_f4':        'Unresolved Problem Extraction (Entry Opportunities)',
    'services.single_f5':        'New Service Strategy Recommendation',
    'services.free_per_day':     '3 free/day',
    'services.credit_per':       'then 1 credit each',
    'services.start':            'Get Started',
    'services.group_title':      'Group Analysis',
    'services.group_desc':       'Compare and analyze 2–5 apps in the same category at once.<br>Visualize the competitive landscape with a positioning map, shared pain points,<br>and market share estimates — all at a glance.',
    'services.group_f1':         'Individual analysis for all apps in the group',
    'services.group_f2':         'Competitor App Positioning Map',
    'services.group_f3':         'Common Unresolved Problem Extraction',
    'services.group_f4':         'Market Share Estimation (review-based)',
    'services.group_f5':         'Entry Opportunity Strategy & Risk Analysis',
    'services.group_f6':         'Overall Competitive Landscape Summary',
    'services.group_credit':     '(apps + 1) credits each',
    'services.table_title':      'Service Comparison',
    'services.table_feature':    'Feature',
    'services.table_single':     'Single',
    'services.table_group':      'Group',
    'services.row_market_size':  'Market Size Analysis (TAM/SAM)',
    'services.row_core_value':   'Core Value & Feature Analysis',
    'services.row_review':       'Rating-Based Review Analysis',
    'services.row_entry':        'Entry Strategy Recommendation',
    'services.row_positioning':  'Competitor Positioning Map',
    'services.row_pain':         'Common Unresolved Problem Extraction',
    'services.row_share':        'Market Share Estimation',
    'services.row_risk':         'Entry Risk Analysis',
    'services.row_credits':      'Credits',
    'services.credits_single':   '1 credit each',
    'services.credits_single_free': '3 free/day',
    'services.credits_group':    '(apps + 1) credits',
    'services.cta_question':     'Need credits?',
    'services.view_pricing':     'View Pricing Plans',
    'services.coming_title':     'Coming Soon',
    'services.coming_desc':      'Group analysis is almost ready.<br>Hang tight — we\'ll let you know when it\'s live!',
    'services.coming_confirm':   'Got it',
  },
};

/**
 * Detect language: localStorage → browser language → English default
 */
function detectLang() {
  const saved = localStorage.getItem('lang');
  if (saved && TRANSLATIONS[saved]) return saved;

  const browserLang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
  if (browserLang.startsWith('ko')) return 'ko';

  return 'en';
}

/** Returns the active language code */
export function getLang() {
  return detectLang();
}

/** Persists a language choice and reloads the page */
export function setLang(lang) {
  if (!TRANSLATIONS[lang]) return;
  localStorage.setItem('lang', lang);
  location.reload();
}

/** Returns the translated string for key, falling back to Korean then key itself */
export function t(key) {
  const lang = getLang();
  return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS['ko']?.[key] ?? key;
}

/**
 * Walks the DOM and replaces text/html/placeholder for elements
 * decorated with data-i18n*, data-i18n-html, data-i18n-placeholder.
 * Also updates <html lang> and <title>.
 */
export function applyTranslations() {
  const lang = getLang();
  document.documentElement.lang = lang === 'ko' ? 'ko' : 'en';

  // textContent replacements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const val = t(el.dataset.i18n);
    if (val) el.textContent = val;
  });

  // innerHTML replacements (for markup like <br>, <a>, <strong>)
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const val = t(el.dataset.i18nHtml);
    if (val) el.innerHTML = val;
  });

  // placeholder replacements
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const val = t(el.dataset.i18nPlaceholder);
    if (val) el.placeholder = val;
  });
}
