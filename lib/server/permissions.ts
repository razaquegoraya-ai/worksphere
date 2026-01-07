type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'

const roleRank: Record<Role, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
}

export function hasAtLeast(role: Role, required: Role) {
  return roleRank[role] >= roleRank[required]
}

export function canApprove(role: Role) {
  return role === 'OWNER' || role === 'ADMIN'
}

export function canRemove(role: Role, targetRole: Role) {
  if (role === 'OWNER') return true
  if (role === 'ADMIN') return targetRole !== 'OWNER'
  return false
}

export function canManageWorkspace(role: Role) {
  return role === 'OWNER' || role === 'ADMIN'
}
