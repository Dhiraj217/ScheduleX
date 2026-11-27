# ScheduleX — REST API Overview

> Auto-generated from [`./openapi.json`](./openapi.json) (`FastAPI` OpenAPI 3.1).

- **Total Paths:** 94
- **Total HTTP Operations:** 118
- **Total Schemas:** 81

## Endpoint Groups

| Domain Tag | Operations |
| :--- | ---: |
| [Analytics](#analytics) | 3 |
| [Authentication](#authentication) | 9 |
| [Batch](#batch) | 3 |
| [chat](#chat) | 4 |
| [Colleges](#colleges) | 9 |
| [Departments](#departments) | 1 |
| [Exam](#exam) | 10 |
| [Export](#export) | 6 |
| [Faculty](#faculty) | 7 |
| [Global Events](#global-events) | 4 |
| [Health](#health) | 1 |
| [Natural Language Query](#natural-language-query) | 3 |
| [Notifications](#notifications) | 1 |
| [PDF Import](#pdf-import) | 5 |
| [Programs](#programs) | 5 |
| [Rooms](#rooms) | 5 |
| [Scheduling](#scheduling) | 13 |
| [Subjects](#subjects) | 5 |
| [Substitution](#substitution) | 7 |
| [Time Slots](#time-slots) | 6 |
| [Timetable](#timetable) | 9 |
| [Webhooks](#webhooks) | 2 |

## Analytics

| Method | Path | Summary |
| :--- | :--- | :--- |
| `GET` | `/analytics/dashboard` | Dashboard |
| `GET` | `/analytics/faculty-load` | Faculty Load |
| `GET` | `/analytics/room-utilisation` | Room Utilisation |

## Authentication

| Method | Path | Summary |
| :--- | :--- | :--- |
| `POST` | `/auth/login` | Login |
| `POST` | `/auth/logout` | Logout |
| `GET` | `/auth/me` | Get Me |
| `POST` | `/auth/refresh` | Refresh Token |
| `POST` | `/auth/register` | Register User |
| `POST` | `/auth/signup` | Signup |
| `GET` | `/auth/users` | List Users |
| `DELETE` | `/auth/users/{user_id}` | Delete User |
| `PUT` | `/auth/users/{user_id}` | Update User |

## Batch

| Method | Path | Summary |
| :--- | :--- | :--- |
| `GET` | `/batch` | List Batches |
| `POST` | `/batch` | Create Batch |
| `DELETE` | `/batch/{batch_id}` | Delete Batch |

## chat

| Method | Path | Summary |
| :--- | :--- | :--- |
| `POST` | `/chat/analyze-after-generate` | Analyze After Generate |
| `POST` | `/chat/analyze-before-generate` | Analyze Before Generate |
| `POST` | `/chat/message` | Chat Message |
| `POST` | `/chat/suggest-assignments` | Suggest Assignments |

## Colleges

| Method | Path | Summary |
| :--- | :--- | :--- |
| `POST` | `/colleges` | Create College |
| `GET` | `/colleges/{college_id}` | Get College |
| `GET` | `/colleges/{college_id}/departments` | List Departments |
| `POST` | `/colleges/{college_id}/departments` | Create Department |
| `GET` | `/colleges/{college_id}/holidays` | List Holidays |
| `POST` | `/colleges/{college_id}/holidays` | Create Holiday |
| `DELETE` | `/colleges/{college_id}/holidays/{holiday_id}` | Delete Holiday |
| `GET` | `/colleges/{college_id}/settings` | Get College Settings |
| `PUT` | `/colleges/{college_id}/settings` | Update College Settings |

## Departments

| Method | Path | Summary |
| :--- | :--- | :--- |
| `GET` | `/departments/{dept_id}` | Get Department |

## Exam

| Method | Path | Summary |
| :--- | :--- | :--- |
| `GET` | `/exam` | List Exam Timetables |
| `GET` | `/exam/enrolments` | List Exam Enrolments |
| `POST` | `/exam/enrolments/upload` | Upload Exam Enrolments |
| `POST` | `/exam/generate` | Generate Exam Timetable |
| `POST` | `/exam/invigilators/{assignment_id}/confirm` | Respond Invigilator Duty |
| `GET` | `/exam/my-duties` | Get My Invigilator Duties |
| `DELETE` | `/exam/{exam_tt_id}` | Delete Exam Timetable |
| `GET` | `/exam/{exam_tt_id}` | Get Exam Timetable |
| `GET` | `/exam/{exam_tt_id}/pdf` | Export Exam Pdf |
| `POST` | `/exam/{exam_tt_id}/publish` | Publish Exam Timetable |

## Export

| Method | Path | Summary |
| :--- | :--- | :--- |
| `GET` | `/export/department/{timetable_id}` | Export Department Pdf |
| `GET` | `/export/faculty/{timetable_id}` | Export Faculty Pdf |
| `GET` | `/export/ics/faculty/me` | Export My Faculty Ics |
| `GET` | `/export/ics/{timetable_id}` | Export Timetable Ics |
| `GET` | `/export/naac/{dept_id}` | Export Naac Report |
| `GET` | `/export/room/{timetable_id}` | Export Room Pdf |

## Faculty

| Method | Path | Summary |
| :--- | :--- | :--- |
| `GET` | `/faculty` | List Faculty |
| `POST` | `/faculty` | Create Faculty |
| `DELETE` | `/faculty/{faculty_id}` | Delete Faculty |
| `GET` | `/faculty/{faculty_id}` | Get Faculty |
| `PUT` | `/faculty/{faculty_id}` | Update Faculty |
| `POST` | `/faculty/{faculty_id}/blocks` | Add General Block |
| `DELETE` | `/faculty/{faculty_id}/blocks/{block_id}` | Delete General Block |

## Global Events

| Method | Path | Summary |
| :--- | :--- | :--- |
| `GET` | `/global-events` | List Global Events |
| `POST` | `/global-events` | Create Global Event |
| `DELETE` | `/global-events/{event_id}` | Delete Global Event |
| `PUT` | `/global-events/{event_id}` | Update Global Event |

## Health

| Method | Path | Summary |
| :--- | :--- | :--- |
| `GET` | `/health` | Health Check |

## Natural Language Query

| Method | Path | Summary |
| :--- | :--- | :--- |
| `POST` | `/nlq/ask` | Ask Nlq |
| `GET` | `/nlq/jobs/{job_id}` | Get Nlq Job |
| `POST` | `/nlq/query` | Query Nlq |

## Notifications

| Method | Path | Summary |
| :--- | :--- | :--- |
| `GET` | `/notifications` | List Notifications |

## PDF Import

| Method | Path | Summary |
| :--- | :--- | :--- |
| `GET` | `/pdf-import/categories` | List Categories |
| `GET` | `/pdf-import/template/excel` | Download Excel Template |
| `GET` | `/pdf-import/template/pdf` | Download Pdf Template |
| `POST` | `/pdf-import/upload` | Upload Pdf |
| `POST` | `/pdf-import/upload-excel` | Upload Excel |

## Programs

| Method | Path | Summary |
| :--- | :--- | :--- |
| `GET` | `/programs/departments/{dept_id}/programs` | List Programs |
| `POST` | `/programs/departments/{dept_id}/programs` | Create Program |
| `DELETE` | `/programs/{program_id}` | Delete Program |
| `GET` | `/programs/{program_id}` | Get Program |
| `PUT` | `/programs/{program_id}` | Update Program |

## Rooms

| Method | Path | Summary |
| :--- | :--- | :--- |
| `GET` | `/rooms` | List Rooms |
| `POST` | `/rooms` | Create Room |
| `DELETE` | `/rooms/{room_id}` | Delete Room |
| `GET` | `/rooms/{room_id}` | Get Room |
| `PUT` | `/rooms/{room_id}` | Update Room |

## Scheduling

| Method | Path | Summary |
| :--- | :--- | :--- |
| `POST` | `/scheduling/approve/{booking_id}` | Approve Booking |
| `GET` | `/scheduling/bookings` | List Bookings |
| `POST` | `/scheduling/cancel/{booking_id}` | Cancel Booking |
| `GET` | `/scheduling/date-check` | Check Date Availability |
| `POST` | `/scheduling/extra-lecture` | Create Extra Lecture |
| `POST` | `/scheduling/extra-lecture-assign` | Assign Extra Lecture |
| `GET` | `/scheduling/free-faculty/{timetable_id}` | Get Free Faculty |
| `GET` | `/scheduling/free-rooms/{timetable_id}` | Get Free Rooms |
| `GET` | `/scheduling/free-slots/{timetable_id}` | Get Free Slots For Faculty |
| `POST` | `/scheduling/proxy` | Create Proxy |
| `POST` | `/scheduling/reject/{booking_id}` | Reject Booking |
| `POST` | `/scheduling/reschedule` | Create Reschedule |
| `GET` | `/scheduling/reschedule-options/{timetable_id}` | Get Reschedule Options |

## Subjects

| Method | Path | Summary |
| :--- | :--- | :--- |
| `GET` | `/subjects` | List Subjects |
| `POST` | `/subjects` | Create Subject |
| `DELETE` | `/subjects/{subject_id}` | Delete Subject |
| `GET` | `/subjects/{subject_id}` | Get Subject |
| `PUT` | `/subjects/{subject_id}` | Update Subject |

## Substitution

| Method | Path | Summary |
| :--- | :--- | :--- |
| `POST` | `/substitution/accept/{request_id}` | Accept Substitution |
| `GET` | `/substitution/candidates/{entry_id}` | Get Candidates |
| `POST` | `/substitution/escalate-pending` | Trigger Escalation Sweep |
| `GET` | `/substitution/history` | Substitution History |
| `POST` | `/substitution/reject/{request_id}` | Reject Substitution |
| `POST` | `/substitution/report-absence` | Report Absence |
| `GET` | `/substitution/{substitution_id}` | Get Substitution |

## Time Slots

| Method | Path | Summary |
| :--- | :--- | :--- |
| `GET` | `/timeslots` | List Timeslots |
| `POST` | `/timeslots` | Create Timeslot |
| `PUT` | `/timeslots/reorder/bulk` | Reorder Timeslots |
| `POST` | `/timeslots/seed-defaults` | Seed Default Timeslots |
| `DELETE` | `/timeslots/{slot_id}` | Delete Timeslot |
| `PUT` | `/timeslots/{slot_id}` | Update Timeslot |

## Timetable

| Method | Path | Summary |
| :--- | :--- | :--- |
| `GET` | `/timetable` | List Timetables |
| `GET` | `/timetable/auto-assign` | Auto Assign Faculty |
| `POST` | `/timetable/generate` | Generate Timetable |
| `POST` | `/timetable/generate-all` | Generate All Semesters |
| `DELETE` | `/timetable/{timetable_id}` | Delete Timetable |
| `GET` | `/timetable/{timetable_id}` | Get Timetable |
| `POST` | `/timetable/{timetable_id}/clone` | Clone Timetable |
| `PUT` | `/timetable/{timetable_id}/entries/{entry_id}` | Move Or Swap Entry |
| `POST` | `/timetable/{timetable_id}/publish` | Publish Timetable |

## Webhooks

| Method | Path | Summary |
| :--- | :--- | :--- |
| `GET` | `/webhooks/whatsapp` | Verify Webhook |
| `POST` | `/webhooks/whatsapp` | Receive Whatsapp |
