export const ROLE_LABELS = { admin: 'Super Admin', hod: 'Head of Department', lecturer: 'Supervisor' };
export function validProfile(profile) {
  return !!profile && profile.active === true && Object.hasOwn(ROLE_LABELS, profile.role)
    && typeof profile.displayName === 'string' && profile.displayName.trim().length > 0
    && (profile.role === 'admin' || (typeof profile.departmentId === 'string' && profile.departmentId.trim().length > 0));
}
export function navigationFor(profile) {
  if (!validProfile(profile)) return [];
  return profile.role === 'admin' ? ['Workspace', 'Access policy'] : ['Workspace', 'Access policy'];
}
export function canReadProject(profile, uid, project) {
  if (!validProfile(profile) || profile.role === 'admin' || profile.departmentId !== project.departmentId) return false;
  return profile.role === 'hod' || project.supervisorId === uid || project.coSupervisorId === uid;
}
