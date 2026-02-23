/**
 * 공통 푸터 컴포넌트
 */
export function initFooter() {
  const footerEl = document.getElementById('app-footer');
  if (!footerEl) return;

  footerEl.innerHTML = `
    <footer class="border-t border-[#f0f1f4] bg-white py-8 md:py-12 px-4 sm:px-6 md:px-10 lg:px-20 xl:px-40">
      <div class="mx-auto max-w-[960px] flex flex-col md:flex-row justify-between items-start gap-8 md:gap-10">
        <div class="flex flex-col gap-3 md:gap-4">
          <div class="flex items-center gap-2 text-primary opacity-80">
            <div class="size-5 md:size-6">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.8261 17.4264C16.7203 18.1174 20.2244 18.5217 24 18.5217C27.7756 18.5217 31.2797 18.1174 34.1739 17.4264C36.9144 16.7722 39.9967 15.2331 41.3563 14.1648L24.8486 40.6391C24.4571 41.267 23.5429 41.267 23.1514 40.6391L6.64374 14.1648C8.00331 15.2331 11.0856 16.7722 13.8261 17.4264Z" fill="currentColor"></path>
              </svg>
            </div>
            <span class="font-black text-xs md:text-sm tracking-tight">분석드가?</span>
          </div>
          <p class="text-[#636e88] text-[10px] md:text-xs max-w-xs">
            데이터로 증명하는 앱 성장 파트너. 시장 조사부터 경쟁사 분석까지 한 번에 해결하세요.
          </p>
          <p class="text-[#636e88] text-[10px]">© 2026 분석드가? All rights reserved.</p>
          <p class="text-[#636e88] text-[10px]">(운영사 : HealthTier Labs)</p>
        </div>
        <div class="flex flex-col gap-2 md:gap-3 items-end text-right">
          <span class="text-[10px] md:text-xs font-bold uppercase tracking-wider text-[#111318]">Contact</span>
          <a class="text-[10px] md:text-xs text-[#636e88] hover:text-primary transition-colors"
            href="mailto:healthtier25@gmail.com">healthtier25@gmail.com</a>
        </div>
      </div>
    </footer>
  `;
}
