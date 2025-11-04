export interface ScheduleEntry {
  id: string;
  day: string;
  departureStopMorning: string;
  departureStopLocationMorning: string;
  arrivalSchoolMorning: string;
  arrivalSchoolLocationMorning: string;
  departureSchoolMorning: string;
  departureSchoolLocationMorning: string;
  arrivalStopMorning: string;
  arrivalStopLocationMorning: string;
  departureStopAfternoon: string;
  departureStopLocationAfternoon: string;
  arrivalSchoolAfternoon: string;
  arrivalSchoolLocationAfternoon: string;
  departureSchoolAfternoon: string;
  departureSchoolLocationAfternoon: string;
  arrivalStopAfternoon: string;
  arrivalStopLocationAfternoon: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  street: string;
  zipCode: string;
  city: string;
}

export interface FormData {
  requestType: 'single' | 'group';
  students: Student[];
  schedule: ScheduleEntry[];
  groupNames: string[];
  studentCount: string;
  responsibleTeacher: string;
}