const ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  STAFF: 'staff',
  ADMIN: 'admin',
};

const COLLEGE_ROLES = [ROLES.STUDENT, ROLES.TEACHER];
const ALL_ROLES = Object.values(ROLES);

module.exports = { ROLES, COLLEGE_ROLES, ALL_ROLES };