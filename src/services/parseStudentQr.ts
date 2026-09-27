/**
 * @file parseStudentQr.ts
 * @description Turn whatever a student ID QR contains into our player fields.
 *
 * The QR is issued by a college, not by us, so we cannot assume the exact key names.
 * Rather than demanding one schema, accept the spellings these cards actually use and
 * match case-insensitively, ignoring separators - so "Roll No", "roll_no", "rollNo"
 * and "ROLLNO" all land in the same field.
 */

export interface ScannedStudent {
  fullName?: string;
  college?: string;
  studentId?: string;
  email?: string;
  mobile?: string;
  branch?: string;
  year?: string;
}

/** Every spelling we are willing to recognise, in priority order. */
const ALIASES: Record<keyof ScannedStudent, string[]> = {
  fullName:  ['fullname', 'name', 'studentname', 'candidatename', 'participantname'],
  college:   ['college', 'collegename', 'institute', 'institutename', 'institution', 'school', 'university'],
  studentId: ['studentid', 'rollno', 'rollnumber', 'roll', 'prn', 'uid', 'enrollmentno', 'enrollment', 'regno', 'id'],
  email:     ['email', 'emailid', 'mail', 'emailaddress'],
  mobile:    ['mobile', 'mobileno', 'phone', 'phoneno', 'phonenumber', 'contact', 'contactno'],
  branch:    ['branch', 'department', 'dept', 'course', 'stream'],
  year:      ['year', 'academicyear', 'yearofstudy', 'class', 'sem', 'semester']
};

const norm = (k: string) => k.toLowerCase().replace(/[\s._\-/]/g, '');

/** Flatten nested objects so { student: { name } } is reachable as "name". */
function flatten(obj: any, out: Record<string, string> = {}): Record<string, string> {
  for (const [k, v] of Object.entries(obj ?? {})) {
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, out);
    else if (v !== null && v !== undefined && v !== '') out[norm(k)] = String(v).trim();
  }
  return out;
}

// Read the live lists rather than repeating them: the branch options have already
// changed once, and a parser mapping onto values the dropdown no longer offers would
// silently produce an unselectable field.
import { EVENT_CONFIG } from '../../shared/eventConfig.js';
const BRANCHES: string[] = EVENT_CONFIG.participantConfig.branches;
const YEARS: string[] = EVENT_CONFIG.participantConfig.years;

/** Map free text onto the dropdown values, since a card may say "Computer" or "3rd Year". */
function toBranch(v?: string) {
  if (!v) return undefined;
  const u = v.toUpperCase().replace(/[^A-Z]/g, '');
  const exact = BRANCHES.find(b => u === b);
  if (exact) return exact;
  if (/COMP/.test(u)) return 'CMPN';
  if (/INFO|IT/.test(u)) return 'INFT';
  if (/EXTC|ELECTRONIC.*TELE|ETC/.test(u)) return 'EXTC';
  if (/ELEC/.test(u)) return 'ELEC';
  if (/MECH/.test(u)) return 'MECH';
  if (/AIML|AI|DATA|MACHINE/.test(u)) return BRANCHES.includes('AIML') ? 'AIML' : 'OTHER';
  if (/ECS|CSBS|BUSINESS/.test(u)) return BRANCHES.includes('ECS') ? 'ECS' : 'OTHER';
  return 'OTHER';
}

function toYear(v?: string) {
  if (!v) return undefined;
  const u = v.toUpperCase();
  const exact = YEARS.find(y => u.replace(/[^A-Z]/g, '') === y);
  if (exact) return exact;
  if (/\b1|FIRST|FE\b/.test(u)) return 'FE';
  if (/\b2|SECOND|SE\b/.test(u)) return 'SE';
  if (/\b3|THIRD|TE\b/.test(u)) return 'TE';
  if (/\b4|FOURTH|FINAL|BE\b/.test(u)) return 'BE';
  return undefined;
}

/**
 * @returns the fields we could read, or null if the payload is not usable JSON.
 */
export function parseStudentQr(raw: string): ScannedStudent | null {
  let data: any;
  try {
    data = JSON.parse(raw.trim());
  } catch {
    return null;
  }
  if (!data || typeof data !== 'object') return null;

  const flat = flatten(data);
  const pick = (keys: string[]) => {
    for (const k of keys) if (flat[k]) return flat[k];
    return undefined;
  };

  const out: ScannedStudent = {
    fullName: pick(ALIASES.fullName),
    college: pick(ALIASES.college),
    studentId: pick(ALIASES.studentId),
    email: pick(ALIASES.email),
    mobile: pick(ALIASES.mobile)?.replace(/[\s\-()]/g, '').replace(/^(\+91|0091|91|0)/, ''),
    branch: toBranch(pick(ALIASES.branch)),
    year: toYear(pick(ALIASES.year))
  };

  // A payload that yielded nothing recognisable is more useful reported as a failure
  // than as a form full of blanks.
  return Object.values(out).some(Boolean) ? out : null;
}

export default parseStudentQr;
