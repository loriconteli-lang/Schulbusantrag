
export interface ScheduleEntry {
  id: string;
  day: string;
  departureStop: string;
  departureStopLocation: string;
  arrivalSchool: string;
  arrivalSchoolLocation: string;
  departureSchool: string;
  departureSchoolLocation: string;
  arrivalStop: string;
  arrivalStopLocation: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
}

export interface FormData {
  students: Student[];
  schedule: ScheduleEntry[];
}
