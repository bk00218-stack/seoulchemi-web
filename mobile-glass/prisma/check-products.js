const data = require('./retina-products.json');
console.log('Total products:', data.length);
const brands = [...new Set(data.map(p => p.brand))];
console.log('Brands:', brands.length);
console.log(brands);
