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
          <div class="flex items-center gap-2">
            <svg class="size-5 md:size-6" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 8 C14 8 11 16 10 24 C9 30 12 36 15 38 C16 38.5 17 38 17 37 C17 35 15 32 15 28 C15 22 17 14 18 10 C18.5 8.5 17 7 16 7.5 C15 8 14 8 14 8Z" fill="#3b82f6"/>
              <path d="M22 5 C22 5 20 14 19.5 23 C19 30 21 37 24 40 C25 41 26.5 40.5 26.5 39 C26.5 37 24.5 33 24.5 28 C24.5 21 26 12 26.5 7 C26.8 5.5 25 4 24 4.5 C23 5 22 5 22 5Z" fill="#1a56db"/>
              <path d="M31 8 C31 8 33 16 34 24 C35 30 33 36 30 38 C29 38.5 28 38 28 37 C28 35 30 32 30 28 C30 22 28 14 27 10 C26.5 8.5 28 7 29 7.5 C30 8 31 8 31 8Z" fill="#60a5fa"/>
              <path d="M12 36 C12 36 16 39 24 39 C32 39 36 36 36 36 C36 38 34 42 24 42 C14 42 12 38 12 36Z" fill="#1e3a8a"/>
            </svg>
            <div class="wm text-xs md:text-sm"><span class="t">Talon</span><span class="i">Insight</span></div>
          </div>
          <p class="text-[#636e88] text-[10px] md:text-xs max-w-xs">
            데이터로 증명하는 앱 성장 파트너. 시장 조사부터 경쟁사 분석까지 한 번에 해결하세요.
          </p>
          <p class="text-[#636e88] text-[10px]">
            © 2026 TalonInsight All rights reserved.</p>
          <!-- <p class="text-[#636e88] text-[10px]">(운영사 : HealthTier Labs<br>
            사업자 등록번호 : 136-15-09172<br>
            대표자 : 박욱현<br>
            사업장 주소 : 서울특별시 관악구 쑥고개로30길 34, 1층 101호<br>
            유선번호 : 010-2868-8557)</p> -->
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
