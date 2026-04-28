
// TESTING VALUES

const ESCALATION_LIMITS = {
  cleaning: 1 * 60 * 1000,           // 1 minute
  housekeeping: 1 * 60 * 1000,       // 1 minute
  washroom: 1 * 60 * 1000,           // 1 minute
  electrical: 1 * 60 * 1000,         // 1 minute
  plumbing: 1 * 60 * 1000,           // 1 minute
  civil: 1 * 60 * 1000,              // 1 minute
  carpentry: 1 * 60 * 1000,          // 1 minute
  technician: 1 * 60 * 1000,         // 1 minute
  'it / technical': 1 * 60 * 1000,   // 1 minute
  lab: 1 * 60 * 1000,                // 1 minute
  safety: 1 * 60 * 1000,             // 1 minute
  others: 1 * 60 * 1000,             // 1 minute
};

const NO_ACCEPTANCE_LIMITS = {
  cleaning: 1 * 60 * 1000,           // 1 minute
  housekeeping: 1 * 60 * 1000,       // 1 minute
  washroom: 1 * 60 * 1000,           // 1 minute
  electrical: 1 * 60 * 1000,         // 1 minute
  plumbing: 1 * 60 * 1000,           // 1 minute
  civil: 1 * 60 * 1000,              // 1 minute
  carpentry: 1 * 60 * 1000,          // 1 minute
  technician: 1 * 60 * 1000,         // 1 minute
  'it / technical': 1 * 60 * 1000,   // 1 minute
  lab: 1 * 60 * 1000,                // 1 minute
  safety: 1 * 60 * 1000,             // 1 minute
  others: 1 * 60 * 1000,             // 1 minute
};

const HOD_EMAIL_DELAY = 20 * 1000;   // 20 seconds



// PRODUCTION VALUES

// const ESCALATION_LIMITS = {
//   cleaning: 1 * 60 * 60 * 1000,           // 1 hour
//   housekeeping: 1 * 60 * 60 * 1000,       // 1 hour
//   washroom: 1 * 60 * 60 * 1000,           // 1 hour
//   electrical: 24 * 60 * 60 * 1000,        // 24 hours
//   plumbing: 24 * 60 * 60 * 1000,          // 24 hours
//   civil: 24 * 60 * 60 * 1000,             // 24 hours
//   carpentry: 24 * 60 * 60 * 1000,         // 24 hours
//   technician: 2 * 60 * 60 * 1000,         // 2 hours
//   'it / technical': 2 * 60 * 60 * 1000,   // 2 hours
//   lab: 2 * 60 * 60 * 1000,                // 2 hours
//   safety: 2 * 60 * 60 * 1000,             // 2 hours
//   others: 2 * 60 * 60 * 1000,             // 2 hours
// };

// const NO_ACCEPTANCE_LIMITS = {
//   cleaning: 1 * 60 * 60 * 1000,           // 1 hour
//   housekeeping: 1 * 60 * 60 * 1000,       // 1 hour
//   washroom: 1 * 60 * 60 * 1000,           // 1 hour
//   electrical: 1 * 60 * 60 * 1000,         // 1 hour
//   plumbing: 1 * 60 * 60 * 1000,           // 1 hour
//   civil: 1 * 60 * 60 * 1000,              // 1 hour
//   carpentry: 1 * 60 * 60 * 1000,          // 1 hour
//   technician: 1 * 60 * 60 * 1000,         // 1 hour
//   'it / technical': 1 * 60 * 60 * 1000,   // 1 hour
//   lab: 1 * 60 * 60 * 1000,                // 1 hour
//   safety: 1 * 60 * 60 * 1000,             // 1 hour
//   others: 1 * 60 * 60 * 1000,             // 1 hour
// };

// const HOD_EMAIL_DELAY = 20 * 60 * 1000;   // 20 minutes

module.exports = { ESCALATION_LIMITS, NO_ACCEPTANCE_LIMITS, HOD_EMAIL_DELAY };