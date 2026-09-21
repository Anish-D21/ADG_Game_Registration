/**
 * @file studentService.js
 * @description Student creation, deduplication & SFIT email domain validation
 */

import { EVENT_CONFIG } from '../../../shared/eventConfig.js';
import { store } from '../store/dataStore.js';

export class StudentService {
  /**
   * Validates SFIT student email domain
   */
  validateEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const normalized = email.trim().toLowerCase();
    return normalized.endsWith(EVENT_CONFIG.participantConfig.collegeEmailDomain.toLowerCase());
  }

  /**
   * Upserts a student to prevent duplicate records
   */
  async upsertStudent(data) {
    const email = data.email.trim().toLowerCase();
    const studentId = data.studentId.trim().toUpperCase();

    // Determine whether this student is SFIT or Non-SFIT
    const isSfit = data.isSfit !== undefined
      ? Boolean(data.isSfit)
      : (data.collegeType === 'SFIT' || (!data.collegeType && (data.college === 'SFIT' || this.validateEmail(email))));
    const collegeType = isSfit ? 'SFIT' : 'NON_SFIT';
    const college = isSfit ? 'SFIT' : (data.college?.trim() || 'Other College');

    // Check college email constraint
    if (isSfit) {
      if (EVENT_CONFIG.participantConfig.requireCollegeEmail && !this.validateEmail(email)) {
        throw new Error(`Email "${data.email}" is invalid. SFIT participants must use official college email ending with ${EVENT_CONFIG.participantConfig.collegeEmailDomain}`);
      }
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error(`Email "${data.email}" is invalid. Please provide a valid email address.`);
      }
    }

    // Deduplication check: existing by email or student ID
    let student = store.students.find(
      s => s.email.toLowerCase() === email || s.studentId.toUpperCase() === studentId
    );

    if (student) {
      // Update details while preserving original ID
      student.fullName = data.fullName.trim();
      student.mobile = data.mobile.trim();
      student.gender = data.gender || student.gender;
      student.branch = data.branch || student.branch;
      student.year = data.year || student.year;
      student.collegeType = collegeType;
      student.isSfit = isSfit;
      student.college = college;
      student.participantType = data.participantType || student.participantType;
      if (data.idCardUrl) student.idCardUrl = data.idCardUrl;
      if (data.idCardPublicId) student.idCardPublicId = data.idCardPublicId;
      student.updatedAt = new Date();
      return student;
    }

    // Create new student
    student = {
      _id: `stu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fullName: data.fullName.trim(),
      studentId,
      email,
      mobile: data.mobile.trim(),
      gender: data.gender || 'Other',
      branch: data.branch || 'CMPN',
      year: data.year || 'TE',
      collegeType,
      isSfit,
      college,
      participantType: data.participantType || 'MEMBER',
      idCardUrl: data.idCardUrl || '',
      idCardPublicId: data.idCardPublicId || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    store.students.push(student);
    return student;
  }

  async getAllStudents() {
    return store.students;
  }

  async getStudentById(id) {
    return store.students.find(s => s._id === id || s.studentId === id) || null;
  }
}

export const studentService = new StudentService();
export default studentService;
