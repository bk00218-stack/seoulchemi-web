// 브라우저에서 실행할 상품 추출 스크립트
// 이 스크립트는 현재 선택된 브랜드의 모든 상품을 추출합니다

const extractProducts = () => {
  const rows = document.querySelectorAll('.ag-center-cols-viewport .ag-row');
  const products = [];
  
  rows.forEach(row => {
    const getText = (colId) => {
      const cell = row.querySelector(`[col-id='${colId}']`);
      return cell ? cell.textContent.trim() : '';
    };
    
    const product = {
      unitType: getText('UNIT_TYPE_NAME'),
      productType: getText('PRODUCT_TYPE_NAME'),
      productName: getText('PRODUCT_NAME'),
      mainProductName: getText('MAIN_PRODUCT_NAME'),
      erpCode: getText('ERP_PRODUCT_CODE'),
      refractiveIndex: getText('R_INDEX'),
      options: getText('OPTIONS'),
      sph: getText('IS_SPH_TEXT'),
      cyl: getText('IS_CYL_TEXT'),
      axis: getText('IS_AXIS_TEXT'),
      bc: getText('BC'),
      dia: getText('DIA'),
      purchasePrice: getText('PURCHASE_PRICE_IN'),
      sellingPrice: getText('SALES_PRICE_OUT'),
      status: getText('STATUS'),
      orderNo: getText('ORDER_NO')
    };
    
    if (product.productName) {
      products.push(product);
    }
  });
  
  return products;
};

// 현재 브랜드명 가져오기
const getCurrentBrand = () => {
  const header = document.querySelector('.panel-title, h4, .brand-name');
  if (header) return header.textContent.trim();
  
  // 선택된 브랜드 행에서 가져오기
  const selectedRow = document.querySelector('.ag-row-selected .ag-cell');
  return selectedRow ? selectedRow.textContent.trim() : 'Unknown';
};

console.log('Brand:', getCurrentBrand());
console.log('Products:', extractProducts());
