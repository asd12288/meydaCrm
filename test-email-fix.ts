import { tryFixEmailDomain, normalizeEmail, validateRow } from './modules/import/lib/validators';

// Test the email fix
const testEmails = [
  'jean@gmailcom',
  'marie@yahoofr',
  'pierre@hotmailfr',
  'sophie@orangefr',
];

console.log('=== tryFixEmailDomain tests ===');
testEmails.forEach(email => {
  const result = tryFixEmailDomain(email);
  console.log('Input:', email, '-> Output:', result.email, 'Fixed:', result.wasFixed);
});

console.log('\n=== normalizeEmail tests ===');
testEmails.forEach(email => {
  const result = normalizeEmail(email);
  console.log('normalizeEmail(', email, ') =', result);
});

console.log('\n=== validateRow tests ===');
testEmails.forEach((email, i) => {
  const result = validateRow(i + 1, { email, phone: '0612345678', first_name: 'Test', last_name: 'User' });
  console.log('Row', i + 1, '- Email:', email);
  console.log('  isValid:', result.isValid);
  console.log('  normalizedData.email:', result.normalizedData.email);
  console.log('  errors:', result.errors);
  console.log('  warnings:', result.warnings);
  console.log('');
});
