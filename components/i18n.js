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
    'index.market_tooltip': '검색할 앱의 타겟 마켓이에요',
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
    'pricing.faq3_a':             '구매 후 크레딧을 전혀 사용하지 않으신 경우, 7일 이내에 전액 환불이 가능합니다. 자세한 내용은 <a href="/policy/refund.html" class="text-primary underline hover:text-blue-700 transition-colors">환불정책</a>을 확인하세요.',
    'pricing.faq4_q':             '분석 실패 시 크레딧이 차감되나요?',
    'pricing.faq4_a':             '시스템 오류나 서비스 장애로 인해 분석에 실패한 경우에는 크레딧이 절대 차감되지 않습니다. 안심하고 이용하세요.',
    'pricing.login_required':     '로그인 후 이용해 주세요.',
    'pricing.payment_error':      '결제 시스템을 불러오는 데 실패했어요. 잠시 후 다시 시도해 주세요.',
    'pricing.network_error':      '네트워크 오류가 발생했어요. 다시 시도해 주세요.',
    'pricing.prepare_error':      '결제 준비에 실패했어요.',

    // ── Payment result pages ──────────────────────────────────────────
    'payment.success_page_title': '결제 완료 - TalonInsight',
    'payment.fail_page_title':    '결제 실패 - TalonInsight',
    'payment.loading':            '결제를 확인하는 중이에요...',
    'payment.success_title':      '충전 완료!',
    'payment.success_msg':        '{n}크레딧이 충전됐어요. 이제 분석을 마음껏 이용해 보세요!',
    'payment.top_up_more':        '더 충전하기',
    'payment.start_analysis':     '분석 시작하기',
    'payment.error_title':        '결제 처리 실패',
    'payment.error_default':      '결제 승인 중 오류가 발생했어요.',
    'payment.cancel_title':       '결제가 취소됐어요',
    'payment.cancel_msg':         '결제가 완료되지 않았어요. 크레딧은 차감되지 않았습니다.',
    'payment.retry':              '다시 시도',
    'payment.go_home':            '홈으로',
    'payment.invalid_info':       '결제 정보가 올바르지 않아요.',
    'payment.login_required':     '로그인이 필요해요.',
    'payment.confirm_error':      '결제 승인에 실패했어요.',
    'payment.network_error':      '네트워크 오류가 발생했어요.',

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

    // ── Blog page ───────────────────────────────────────────────────────
    'blog.page_title':           '블로그 - 앱 시장조사 & 분석 인사이트 | TalonInsight',
    'blog.hero_title':           '앱 분석 인사이트',
    'blog.hero_subtitle':        '앱 시장조사, 경쟁사 분석, 리뷰 분석에 대한 실용적인 가이드',
    'blog.tag_guide':            '가이드',
    'blog.tag_analysis':         '분석방법',
    'blog.tag_strategy':         '전략',
    'blog.post1_title':          '앱 시장조사 완벽 가이드: 1인 개발자를 위한 무료 분석 방법',
    'blog.post1_desc':           '앱을 출시하기 전 반드시 해야 할 시장조사. 비용 없이 경쟁 앱을 분석하고 시장 기회를 찾는 방법을 알려드립니다.',
    'blog.post2_title':          '플레이스토어 리뷰 분석으로 사용자 니즈 파악하기',
    'blog.post2_desc':           '경쟁 앱의 리뷰를 분석해 사용자들이 정말 원하는 것을 찾고, 차별화 포인트를 발굴하는 방법을 소개합니다.',
    'blog.post3_title':          '경쟁사 앱 분석: 성공하는 앱들의 공통점 찾기',
    'blog.post3_desc':           '상위 앱들은 무엇이 다를까요? 경쟁사 앱을 체계적으로 분석하고 벤치마킹하는 프레임워크를 공유합니다.',
    'blog.cta_title':            '지금 바로 앱 분석 시작하기',
    'blog.cta_desc':             '분석하고 싶은 앱 이름만 입력하세요. AI가 시장 분석부터 리뷰 인사이트까지 제공합니다.',
    'blog.cta_button':           '무료로 분석하기',

    // ── Analysis result sections ─────────────────────────────────────────────
    'analysis.market_definition':  '시장 정의',
    'analysis.core_value':         '핵심 가치',
    'analysis.core_features':      '핵심 기능',
    'analysis.unresolved':         '미해결 문제',
    'analysis.rating_dist':        '평점 분포',
    'analysis.reviews_by_rating':  '평점별 리뷰 요약',
    'analysis.complaints':         '불만 카테고리',
    'analysis.strategy':           '전략 제안',
    'analysis.avg_rating':         '평균 평점',
    'analysis.group_analysis_btn': '그룹분석 시작하기',
    'analysis.download_pdf':       'PDF 다운로드',
    'analysis.cached_notice':      '캐시된 분석 결과입니다',
    'analysis.loading':            '분석 중입니다...',
    'analysis.error':              '분석에 실패했습니다. 잠시 후 다시 시도해주세요.',
    'analysis.rate_limited':       '오늘의 무료 분석 한도를 초과했습니다.',
    'analysis.insufficient_credits': '크레딧이 부족합니다.',
    'analysis.get_credits':        '크레딧 충전하기',
    'analysis.no_reviews':         '리뷰 없음',
    'analysis.loading_initial':    '스토어 등록정보를 분석 중 입니다..',
    'analysis.error_msg':          '오류가 발생했습니다',
    'analysis.retry':              '다시 시도',
    'analysis.limited_title':      '일일 무료 분석 한도를 초과했습니다',
    'analysis.limited_desc':       '정식 출시 시 알림을 받으시겠어요?',
    'analysis.email_signup_btn':   '런칭 알림 받기',

    // ── Analysis page UI ─────────────────────────────────────────────────────
    'analysis.breadcrumb_home':        '홈',
    'analysis.breadcrumb_analysis':    '앱 분석',
    'analysis.survey_title':           '이 분석을 어떻게 활용하실 건가요?',
    'analysis.survey_btn_planning':    '앱 기획 참고',
    'analysis.survey_btn_competitor':  '경쟁사 분석',
    'analysis.survey_btn_investor':    '투자자료 준비',
    'analysis.survey_btn_test':        '그냥 테스트',
    'analysis.survey_btn_other':       '기타(직접입력)',
    'analysis.survey_other_placeholder': '직접 입력해주세요',
    'analysis.curious_label':          '추가로 궁금한 점이 있으신가요?',
    'analysis.curious_placeholder':    '질문을 입력해주세요.',
    'analysis.send':                   '전송',
    'analysis.close':                  '닫기',
    'analysis.reuse_title':            '두 번째 분석 중이시네요\n계속 사용하시는 이유가 궁금합니다',
    'analysis.email_popup_title':      '런칭 알림 받기',
    'analysis.email_popup_desc':       '정식 런칭 시 이메일로 알려드립니다',
    'analysis.email_placeholder':      '이메일을 입력해주세요',
    'analysis.submit_email':           '제출',
    'analysis.stage_title':            '어떤 단계를 작업 중이신가요?',
    'analysis.stage_idea':             '아이디어 단계',
    'analysis.stage_planning':         '기획 단계',
    'analysis.stage_dev':              '개발 중',
    'analysis.stage_launch_prep':      '출시 준비',
    'analysis.stage_post_launch':      '출시 후 개선',
    'analysis.skip':                   '건너뛰기',
    'analysis.app_analysis_prefix':    '앱 분석',
    'analysis.analysis_done':          '분석 완료',
    'analysis.feedback_thanks':        '피드백 감사합니다!',
    'analysis.review_positive':        '긍정',
    'analysis.review_neutral':         '중립',
    'analysis.review_negative':        '부정',
    'analysis.performance':            '성능',
    'analysis.stability':              '안정성',
    'mypage.analyses_title':           '분석결과',
    'mypage.group_badge':              '그룹',
    'mypage.loading':                  '불러오는 중...',
    'mypage.back_to_list':             '목록으로',
    'mypage.data_none':                '데이터 없음',
    'mypage.pdf_save':                 'PDF 저장',

    // ── Common ──────────────────────────────────────────────────────────────
    'common.login_required':           '로그인이 필요합니다',
    'common.loading':                  '불러오는 중...',

    // ── Payment History page ─────────────────────────────────────────────────
    'payment.history_title':       '결제 내역',
    'payment.history_page_title':  '결제 내역 - TalonInsight',
    'payment.history_unauth_msg':  'Google 로그인 후 결제 내역을 확인하세요.',
    'payment.history_empty_title': '결제 내역이 없습니다',
    'payment.history_empty_msg':   '크레딧을 충전하고 분석을 시작해보세요.',
    'payment.history_charge_btn':  '크레딧 충전하기',
    'payment.status_completed':    '결제완료',
    'payment.status_pending':      '처리중',
    'payment.status_failed':       '실패',
    'payment.status_refunded':     '환불',
    'payment.credit_given':        'C 지급',
    'payment.credit_package':      '크레딧 패키지',

    // ── Credit History page ──────────────────────────────────────────────────
    'credit.history_title':        '크레딧 사용내역',
    'credit.history_page_title':   '크레딧 사용내역 - TalonInsight',
    'credit.remaining':            '잔여 크레딧',
    'credit.charge_btn':           '충전하기',
    'credit.history_unauth_msg':   'Google 로그인 후 크레딧 내역을 확인하세요.',
    'credit.history_empty_title':  '크레딧 내역이 없습니다',
    'credit.history_empty_msg':    '크레딧을 충전하거나 분석을 시작해보세요.',
    'credit.col_date':             '일시',
    'credit.col_desc':             '내용',
    'credit.col_amount':           '크레딧',
    'credit.type_charge':          '충전',
    'credit.type_use':             '사용',
    'credit.type_refund':          '환불',
    'credit.type_bonus':           '보너스',
    'credit.type_expire':          '만료',
    'credit.desc_app_analysis':    '앱 분석',
    'credit.desc_group_analysis':  '그룹 분석',
    'credit.desc_apps_suffix':     '개 앱',
    'credit.desc_credit_charge':   '크레딧 충전',

    // ── Group analysis result sections ───────────────────────────────────────
    'group.verdict':         '경쟁 구도',
    'group.positioning_map': '포지셔닝 맵',
    'group.pain_points':     '공통 불만',
    'group.market_share':    '시장점유율 추정',
    'group.opportunity':     '진입 기회',
    'group.risks':           '진입 리스크',
    // ── Group Analysis Result page ───────────────────────────────────────────────
    'group_result.label':              '그룹 분석 결과',
    'group_result.loading':            '분석 결과를 불러오는 중...',
    'group_result.error_msg':          '결과를 불러올 수 없어요',
    'group_result.error_btn':          '새 그룹 분석 시작',
    'group_result.breadcrumb_home':    '홈',
    'group_result.breadcrumb_group':   '그룹 분석',
    'group_result.positioning_desc':   '각 앱의 시장 내 포지션과 기회 공간을 시각화한 분석입니다.',
    'group_result.opportunity_label':  '기회',
    'group_result.opportunity_area':   '기회 영역',
    'group_result.pain_points_desc':   '여러 앱에서 공통으로 발견된 미해결 문제들입니다.',
    'group_result.pain_points_none':   '공통 페인포인트를 분석하지 못했어요.',
    'group_result.severity_strong':    '강',
    'group_result.severity_medium':    '중',
    'group_result.severity_weak':      '약',
    'group_result.affected_apps':      '영향 앱',
    'group_result.market_share_desc':  '리뷰 수와 평점을 기반으로 추정한 시장 내 존재감입니다.',
    'group_result.opportunity_desc':   '이 시장에 새로운 서비스로 진입한다면 고려할 핵심 전략입니다.',
    'group_result.opportunity_none':   '진입 기회 분석을 불러오지 못했어요.',
    'group_result.risks_desc':         '시장 진입 시 주의해야 할 리스크 요인들입니다.',
    'group_result.risks_none':         '리스크 분석을 불러오지 못했어요.',
    'group_result.severity_high':      '높음',
    'group_result.severity_mid':       '중간',
    'group_result.severity_low':       '낮음',
    'group_result.individual_title':   '개별 앱 분석',
    'group_result.individual_desc':    '각 앱의 상세 분석 결과를 확인하세요.',
    'group_result.individual_link':    '개별 분석 보기',
    'group_result.new_analysis':       '새 그룹 분석 시작',
    // ── Group Analysis page ──────────────────────────────────────────────────────
    'group_page.page_title':            '그룹 분석 - TalonInsight',
    'group_page.coming_soon_title':     '준비 중인 기능이에요',
    'group_page.coming_soon_desc':      '그룹 분석 기능을 열심히 준비하고 있어요.<br>조금만 기다려 주세요!',
    'group_page.back_to_services':      '서비스 목록으로',
    'group_page.breadcrumb_home':       '홈',
    'group_page.breadcrumb':            '그룹 분석',
    'group_page.settings_title':        '그룹 분석 설정',
    'group_page.settings_desc':         '비교할 앱들을 추가하고 시장을 함께 분석해보세요. 최소 2개 이상의 앱을 선택할 수 있어요.',
    'group_page.label_group_name':      '그룹 이름',
    'group_page.placeholder_group_name': '예: 2030 헬스 앱 시장',
    'group_page.hint_group_name':       '어떤 시장을 분석하는지 이름을 지어주세요',
    'group_page.label_add_app':         '앱 추가',
    'group_page.placeholder_search':    '앱 이름으로 검색 (예: 배달의민족)',
    'group_page.label_group_setup':     '그룹 구성',
    'group_page.empty_placeholder':     '위에서 앱을 검색해서 추가하세요',
    'group_page.label_credits':         '차감될 크레딧',
    'group_page.credits_hint_initial':  '앱을 2개 이상 추가하면 크레딧이 표시됩니다.',
    'group_page.credits_unit':          '크레딧',
    'group_page.login_notice':          '그룹 분석은 로그인 후 이용하실 수 있어요. <a href="/" class="underline font-semibold">로그인하기</a>',
    'group_page.cancel':                '취소',
    'group_page.start_analysis':        '분석 시작',
    'group_page.progress_title':        '분석 중...',
    'group_page.progress_desc':         '각 앱을 병렬로 분석하고 있어요. 페이지를 떠나도 분석은 계속됩니다.',
    'group_page.group_progress_title':  '종합 분석 중...',
    'group_page.group_progress_desc':   '시장 기회와 경쟁 구도를 분석하고 있어요',
    'group_page.mismatch_title':        '카테고리가 다를 수 있어요',
    'group_page.mismatch_desc':         '첫 번째 앱과 다른 카테고리일 수 있어요.<br>같은 카테고리의 앱만 그룹으로 묶는 것이 좋아요.<br>그래도 추가하시겠어요?',
    'group_page.add':                   '추가',
    'group_page.no_credits_title':      '크레딧이 부족해요',
    'group_page.get_credits':           '크레딧 충전하기',
    'group_page.close':                 '닫기',
    'group_page.confirm_title':         '분석을 시작할까요?',
    'group_page.confirm_warning':       '분석이 시작되면 취소할 수 없어요.<br>페이지를 이탈해도 분석은 백그라운드에서 계속 진행돼요.',
    'group_page.start':                 '시작하기',
    'group_page.searching':             '검색 중...',
    'group_page.no_results':            '검색 결과가 없어요',
    'group_page.collapse':              '접기',
    'group_page.waiting':               '대기 중',
    'group_page.analyzing':             '분석 중...',
    'group_page.done':                  '완료',
    'group_page.failed':                '실패',
    'group_page.error_title':           '분석 실패',
    'group_page.retry':                 '다시 시도',
    'group_page.err_no_credits':        '크레딧이 부족해요. 크레딧을 충전해 주세요.',
    'group_page.err_start_failed':      '분석 시작에 실패했어요',
    'group_page.err_progress':          '분석 중 오류가 발생했어요',
    'group_page.err_network':           '네트워크 오류가 발생했어요. 다시 시도해 주세요.',
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
    'index.market_tooltip': 'Select the target market for your search',
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
    'pricing.faq3_a':             'If you haven\'t used any credits, you can request a full refund within 7 days of purchase. See our <a href="/policy/refund.html" class="text-primary underline hover:text-blue-700 transition-colors">Refund Policy</a> for details.',
    'pricing.faq4_q':             'Will I be charged if an analysis fails?',
    'pricing.faq4_a':             'If an analysis fails due to a system error or service disruption, you will never be charged. You\'re fully covered.',
    'pricing.login_required':     'Please log in to continue.',
    'pricing.payment_error':      'Failed to load the payment system. Please try again in a moment.',
    'pricing.network_error':      'A network error occurred. Please try again.',
    'pricing.prepare_error':      'Failed to prepare your payment.',

    // ── Payment result pages ──────────────────────────────────────────
    'payment.success_page_title': 'Payment Complete - TalonInsight',
    'payment.fail_page_title':    'Payment Failed - TalonInsight',
    'payment.loading':            'Verifying your payment...',
    'payment.success_title':      'Credits Added!',
    'payment.success_msg':        'Your {n} credits are ready. Start analyzing now!',
    'payment.top_up_more':        'Top Up More',
    'payment.start_analysis':     'Start Analyzing',
    'payment.error_title':        'Payment Failed',
    'payment.error_default':      'An error occurred while confirming your payment.',
    'payment.cancel_title':       'Payment Cancelled',
    'payment.cancel_msg':         'Your payment was not completed. No credits were charged.',
    'payment.retry':              'Try Again',
    'payment.go_home':            'Back to Home',
    'payment.invalid_info':       'Invalid payment information.',
    'payment.login_required':     'Login required.',
    'payment.confirm_error':      'Payment confirmation failed.',
    'payment.network_error':      'A network error occurred.',

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

    // ── Blog page ───────────────────────────────────────────────────────
    'blog.page_title':           'Blog - App Market Research & Analysis Insights | TalonInsight',
    'blog.hero_title':           'App Analysis Insights',
    'blog.hero_subtitle':        'Practical guides on app market research, competitor analysis, and review analysis',
    'blog.tag_guide':            'Guide',
    'blog.tag_analysis':         'Analysis',
    'blog.tag_strategy':         'Strategy',
    'blog.post1_title':          'Complete App Market Research Guide: Free Analysis Methods for Solo Developers',
    'blog.post1_desc':           'Essential market research before launching your app. Learn how to analyze competitor apps and find market opportunities for free.',
    'blog.post2_title':          'Understanding User Needs Through Play Store Review Analysis',
    'blog.post2_desc':           'Discover what users really want by analyzing competitor app reviews and find differentiation points.',
    'blog.post3_title':          'Competitor App Analysis: Finding Common Traits of Successful Apps',
    'blog.post3_desc':           'What makes top apps different? A systematic framework for analyzing and benchmarking competitor apps.',
    'blog.cta_title':            'Start Analyzing Apps Now',
    'blog.cta_desc':             'Just enter an app name. Our AI provides market analysis to review insights.',
    'blog.cta_button':           'Analyze for Free',

    // ── Analysis result sections ─────────────────────────────────────────────
    'analysis.market_definition':  'Market Definition',
    'analysis.core_value':         'Core Value',
    'analysis.core_features':      'Core Features',
    'analysis.unresolved':         'Unresolved Problems',
    'analysis.rating_dist':        'Rating Distribution',
    'analysis.reviews_by_rating':  'Reviews by Rating',
    'analysis.complaints':         'Complaint Categories',
    'analysis.strategy':           'Strategy Suggestion',
    'analysis.avg_rating':         'Avg. Rating',
    'analysis.group_analysis_btn': 'Start Group Analysis',
    'analysis.download_pdf':       'Download PDF',
    'analysis.cached_notice':      'Showing cached analysis',
    'analysis.loading':            'Analyzing...',
    'analysis.error':              'Analysis failed. Please try again later.',
    'analysis.rate_limited':       'You\'ve reached today\'s free analysis limit.',
    'analysis.insufficient_credits': 'Insufficient credits.',
    'analysis.get_credits':        'Get Credits',
    'analysis.no_reviews':         'No reviews',
    'analysis.loading_initial':    'Analyzing app store listings..',
    'analysis.error_msg':          'An error occurred',
    'analysis.retry':              'Retry',
    'analysis.limited_title':      'Daily free analysis limit reached',
    'analysis.limited_desc':       'Would you like to be notified when we launch?',
    'analysis.email_signup_btn':   'Get launch notification',

    // ── Analysis page UI ─────────────────────────────────────────────────────
    'analysis.breadcrumb_home':        'Home',
    'analysis.breadcrumb_analysis':    'App Analysis',
    'analysis.survey_title':           'How will you use this analysis?',
    'analysis.survey_btn_planning':    'App Planning',
    'analysis.survey_btn_competitor':  'Competitor Research',
    'analysis.survey_btn_investor':    'Investor Materials',
    'analysis.survey_btn_test':        'Just Testing',
    'analysis.survey_btn_other':       'Other (custom)',
    'analysis.survey_other_placeholder': 'Type your own answer',
    'analysis.curious_label':          'Any other questions?',
    'analysis.curious_placeholder':    'Ask anything about this analysis.',
    'analysis.send':                   'Send',
    'analysis.close':                  'Close',
    'analysis.reuse_title':            "It's your second analysis!\nWe'd love to know what keeps you coming back.",
    'analysis.email_popup_title':      'Get Launch Alerts',
    'analysis.email_popup_desc':       "We'll notify you by email when we officially launch",
    'analysis.email_placeholder':      'Enter your email',
    'analysis.submit_email':           'Submit',
    'analysis.stage_title':            'What stage are you at?',
    'analysis.stage_idea':             'Idea Stage',
    'analysis.stage_planning':         'Planning',
    'analysis.stage_dev':              'In Development',
    'analysis.stage_launch_prep':      'Pre-Launch',
    'analysis.stage_post_launch':      'Post-Launch Improvement',
    'analysis.skip':                   'Skip',
    'analysis.app_analysis_prefix':    'App Analysis',
    'analysis.analysis_done':          'Analysis complete',
    'analysis.feedback_thanks':        'Thank you for your feedback!',
    'analysis.review_positive':        'Positive',
    'analysis.review_neutral':         'Neutral',
    'analysis.review_negative':        'Negative',
    'analysis.performance':            'Performance',
    'analysis.stability':              'Stability',
    'mypage.analyses_title':           'My Analyses',
    'mypage.group_badge':              'Group',
    'mypage.loading':                  'Loading...',
    'mypage.back_to_list':             'Back to list',
    'mypage.data_none':                'No data',
    'mypage.pdf_save':                 'Save PDF',

    // ── Common ──────────────────────────────────────────────────────────────
    'common.login_required':           'Login Required',
    'common.loading':                  'Loading...',

    // ── Payment History page ─────────────────────────────────────────────────
    'payment.history_title':       'Payment History',
    'payment.history_page_title':  'Payment History - TalonInsight',
    'payment.history_unauth_msg':  'Sign in with Google to view your payment history.',
    'payment.history_empty_title': 'No payment history',
    'payment.history_empty_msg':   'Top up credits and start analyzing.',
    'payment.history_charge_btn':  'Top Up Credits',
    'payment.status_completed':    'Completed',
    'payment.status_pending':      'Processing',
    'payment.status_failed':       'Failed',
    'payment.status_refunded':     'Refunded',
    'payment.credit_given':        'C credited',
    'payment.credit_package':      'Credit Package',

    // ── Credit History page ──────────────────────────────────────────────────
    'credit.history_title':        'Credit History',
    'credit.history_page_title':   'Credit History - TalonInsight',
    'credit.remaining':            'Remaining Credits',
    'credit.charge_btn':           'Top Up',
    'credit.history_unauth_msg':   'Sign in with Google to view your credit history.',
    'credit.history_empty_title':  'No credit history',
    'credit.history_empty_msg':    'Top up credits or start an analysis.',
    'credit.col_date':             'Date',
    'credit.col_desc':             'Description',
    'credit.col_amount':           'Credits',
    'credit.type_charge':          'Charge',
    'credit.type_use':             'Usage',
    'credit.type_refund':          'Refund',
    'credit.type_bonus':           'Bonus',
    'credit.type_expire':          'Expire',
    'credit.desc_app_analysis':    'App Analysis',
    'credit.desc_group_analysis':  'Group Analysis',
    'credit.desc_apps_suffix':     'apps',
    'credit.desc_credit_charge':   'Credit Charge',

    // ── Group analysis result sections ───────────────────────────────────────
    'group.verdict':         'Competitive Landscape',
    'group.positioning_map': 'Positioning Map',
    'group.pain_points':     'Common Pain Points',
    'group.market_share':    'Market Share Est.',
    'group.opportunity':     'Entry Opportunity',
    'group.risks':           'Entry Risks',
    // ── Group Analysis Result page ───────────────────────────────────────────────
    'group_result.label':              'Group Analysis',
    'group_result.loading':            'Loading analysis results...',
    'group_result.error_msg':          'Unable to load results',
    'group_result.error_btn':          'Start New Group Analysis',
    'group_result.breadcrumb_home':    'Home',
    'group_result.breadcrumb_group':   'Group Analysis',
    'group_result.positioning_desc':   'A visualization of each app\'s position in the market and opportunity spaces.',
    'group_result.opportunity_label':  'Opportunity',
    'group_result.opportunity_area':   'Opportunity Zone',
    'group_result.pain_points_desc':   'Unresolved problems commonly found across multiple apps.',
    'group_result.pain_points_none':   'Unable to analyze common pain points.',
    'group_result.severity_strong':    'High',
    'group_result.severity_medium':    'Med',
    'group_result.severity_weak':      'Low',
    'group_result.affected_apps':      'Affected',
    'group_result.market_share_desc':  'Estimated market presence based on review count and ratings.',
    'group_result.opportunity_desc':   'Key strategies to consider when entering this market with a new service.',
    'group_result.opportunity_none':   'Unable to load entry opportunity analysis.',
    'group_result.risks_desc':         'Risk factors to watch out for when entering this market.',
    'group_result.risks_none':         'Unable to load risk analysis.',
    'group_result.severity_high':      'High',
    'group_result.severity_mid':       'Medium',
    'group_result.severity_low':       'Low',
    'group_result.individual_title':   'Individual App Analyses',
    'group_result.individual_desc':    'View the detailed analysis for each app.',
    'group_result.individual_link':    'View Analysis',
    'group_result.new_analysis':       'New Group Analysis',
    // ── Group Analysis page ──────────────────────────────────────────────────────
    'group_page.page_title':            'Group Analysis - TalonInsight',
    'group_page.coming_soon_title':     'Coming Soon',
    'group_page.coming_soon_desc':      "Group analysis is on its way.<br>Hang tight — we'll let you know when it's live!",
    'group_page.back_to_services':      'Back to Services',
    'group_page.breadcrumb_home':       'Home',
    'group_page.breadcrumb':            'Group Analysis',
    'group_page.settings_title':        'Group Analysis Setup',
    'group_page.settings_desc':         'Add apps to compare and analyze the market together. Select at least 2 apps.',
    'group_page.label_group_name':      'Group Name',
    'group_page.placeholder_group_name': 'e.g. Health Apps for Millennials',
    'group_page.hint_group_name':       "Give a name to the market you're analyzing",
    'group_page.label_add_app':         'Add Apps',
    'group_page.placeholder_search':    'Search by app name (e.g. DoorDash)',
    'group_page.label_group_setup':     'Group Setup',
    'group_page.empty_placeholder':     'Search and add apps from above',
    'group_page.label_credits':         'Credits to Use',
    'group_page.credits_hint_initial':  'Add 2 or more apps to see the credit cost.',
    'group_page.credits_unit':          'Credits',
    'group_page.login_notice':          'Group analysis requires login. <a href="/" class="underline font-semibold">Log in</a>',
    'group_page.cancel':                'Cancel',
    'group_page.start_analysis':        'Start Analysis',
    'group_page.progress_title':        'Analyzing...',
    'group_page.progress_desc':         'Analyzing apps in parallel. You can leave — analysis continues in the background.',
    'group_page.group_progress_title':  'Running group analysis...',
    'group_page.group_progress_desc':   'Analyzing market opportunities and the competitive landscape',
    'group_page.mismatch_title':        'Different Category?',
    'group_page.mismatch_desc':         "This app might be in a different category from the first.<br>It's best to group apps in the same category.<br>Add it anyway?",
    'group_page.add':                   'Add',
    'group_page.no_credits_title':      'Not Enough Credits',
    'group_page.get_credits':           'Get Credits',
    'group_page.close':                 'Close',
    'group_page.confirm_title':         'Start Analysis?',
    'group_page.confirm_warning':       'Once started, the analysis cannot be cancelled.<br>It continues in the background even if you leave the page.',
    'group_page.start':                 'Start',
    'group_page.searching':             'Searching...',
    'group_page.no_results':            'No results found',
    'group_page.collapse':              'Collapse',
    'group_page.waiting':               'Waiting',
    'group_page.analyzing':             'Analyzing...',
    'group_page.done':                  'Done',
    'group_page.failed':                'Failed',
    'group_page.error_title':           'Analysis Failed',
    'group_page.retry':                 'Retry',
    'group_page.err_no_credits':        'Not enough credits. Please top up.',
    'group_page.err_start_failed':      'Failed to start analysis',
    'group_page.err_progress':          'An error occurred during analysis',
    'group_page.err_network':           'A network error occurred. Please try again.',
  },
};

// ─── Market (country) helpers ─────────────────────────────────────────────────

const MARKET_OPTIONS = [
  { code: 'kr', label: '🇰🇷 KR' },
  { code: 'us', label: '🇺🇸 US' },
  { code: 'jp', label: '🇯🇵 JP' },
  { code: 'gb', label: '🇬🇧 GB' },
  { code: 'de', label: '🇩🇪 DE' },
  { code: 'fr', label: '🇫🇷 FR' },
  { code: 'au', label: '🇦🇺 AU' },
  { code: 'in', label: '🇮🇳 IN' },
  { code: 'br', label: '🇧🇷 BR' },
];

/** Returns the active market code ('kr' | 'us') */
export function getMarket() {
  const saved = localStorage.getItem('market');
  if (saved && MARKET_OPTIONS.some(m => m.code === saved)) return saved;
  return 'kr';
}

/** Persists a market choice */
export function setMarket(market) {
  if (!MARKET_OPTIONS.some(m => m.code === market)) return;
  localStorage.setItem('market', market);
}

export { MARKET_OPTIONS };

// ─── Language helpers ─────────────────────────────────────────────────────────

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
