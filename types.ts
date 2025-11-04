
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

export interface FormData {
  lastName: string;
  firstName: string;
  schedule: ScheduleEntry[];
}