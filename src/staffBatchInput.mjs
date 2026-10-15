export function parseStaffBatch(value) {
  if (!Array.isArray(value) || !value.length || value.length > 100) throw Error('Supply an array of 1–100 staff records.');
  const seen = new Set();
  return value.map((row, index) => {
    const fail = message => {throw Error(`Row ${index + 1}: ${message}`);};
    if (!row || typeof row !== 'object' || Array.isArray(row)) fail('Expected a staff record.');
    if (Object.keys(row).some(key => !['email','displayName','role','departmentId'].includes(key))) fail('Unknown field; passwords and credentials must not be supplied.');
    const {email,displayName,role,departmentId} = row;
    if (typeof email !== 'string' || email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) fail('Enter a valid email.');
    const normalizedEmail = email.trim().toLowerCase();
    if (seen.has(normalizedEmail)) fail('Duplicate email in this batch.');
    seen.add(normalizedEmail);
    if (typeof displayName !== 'string' || !displayName.trim() || displayName.trim().length > 120) fail('Name must contain 1–120 characters.');
    if (!['hod','lecturer'].includes(role)) fail('Only HOD or lecturer onboarding is supported.');
    if (typeof departmentId !== 'string' || !/^[a-z0-9][a-z0-9-]{0,119}$/.test(departmentId)) fail('Enter an existing department ID.');
    return {email:normalizedEmail,displayName:displayName.trim(),role,departmentId};
  });
}

