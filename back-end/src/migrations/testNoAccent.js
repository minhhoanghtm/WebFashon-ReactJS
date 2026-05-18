import { toNoAccent } from '../utils/removeAccents.js';

console.log('🔍 Kiểm tra hàm toNoAccent():\n');

const testCases = [
  { input: 'Áo sơ mi', expected: 'ao so mi' },
  { input: 'Áo', expected: 'ao' },
  { input: 'Quần', expected: 'quan' },
  { input: 'Giày dép', expected: 'giay dep' },
  { input: 'Áo khoác', expected: 'ao khoac' },
  { input: 'Túi xách', expected: 'tui xach' },
];

testCases.forEach(({ input, expected }) => {
  const result = toNoAccent(input);
  const status = result === expected ? '✅' : '❌';
  console.log(`${status} Input: "${input}" → Output: "${result}" (Expected: "${expected}")`);
});

console.log('\n📝 Ví dụ tìm kiếm:');
console.log('- Nhập "Ao" sẽ match với:', toNoAccent('Áo sơ mi'));
console.log('- Nhập "ao" sẽ match với:', toNoAccent('Áo'));
console.log('- Nhập "quan" sẽ match với:', toNoAccent('Quần'));
