/**
 * 레티나 상품 데이터 추출 스크립트
 * 브라우저에서 실행하여 모든 브랜드/상품 데이터를 JSON으로 추출
 */

// 이 스크립트는 레티나 관리자 페이지 콘솔에서 실행
// 또는 Clawdbot browser tool의 evaluate 기능 사용

async function extractAllProducts() {
  const brands = [];
  const products = [];
  
  // 브랜드 목록 추출 (ag-grid에서)
  const brandRows = document.querySelectorAll('[row-index]');
  
  for (const row of brandRows) {
    const brandName = row.querySelector('[col-id="brand_name"]')?.textContent?.trim();
    if (brandName) {
      brands.push({
        name: brandName,
        // 더 많은 데이터 추출 가능
      });
    }
  }
  
  return { brands, products };
}

// 실행
extractAllProducts().then(data => {
  console.log(JSON.stringify(data, null, 2));
});
