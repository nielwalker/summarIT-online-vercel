# Database Schema Reference

## Tables Structure

### 1. WeeklyReport Table
- `id` (int4, Primary Key) - Auto-incrementing unique identifier
- `createdAt` (timestamp) - When the report was created
- `updatedAt` (timestamp) - When the report was last updated
- `userName` (text) - Name of the user who submitted the report
- `role` (text) - Role of the user (e.g., "student")
- `section` (text) - Section the student belongs to
- `studentId` (text, Foreign Key) - Links to StudentEnrollment.studentId
- `weekNumber` (int4) - Week number of the report
- `date` (text) - Date of the report
- `hours` (int4) - Number of hours reported
- `activities` (text) - Description of activities performed
- `score` (int4) - Score for the report
- `learnings` (text) - Description of learnings from the week

### 2. StudentEnrollment Table
- `studentId` (text, Primary Key) - Unique identifier for each student
- `userName` (text) - Student's name
- `section` (text) - Section the student is enrolled in
- `companyName` (text, Foreign Key) - Links to Company.name
- `createdAt` (timestamp) - When the enrollment record was created
- `updatedAt` (timestamp) - When the enrollment record was last updated

### 3. Coordinator Table
- `id` (int4, Primary Key) - Auto-incrementing unique identifier
- `userName` (text) - Coordinator's name
- `sections` (text array) - Sections the coordinator is responsible for
- `approved` (bool) - Whether the coordinator's account is approved
- `createdAt` (timestamp) - When the coordinator record was created
- `updatedAt` (timestamp) - When the coordinator record was last updated

### 4. Company Table
- `id` (int4, Primary Key) - Auto-incrementing unique identifier
- `name` (text) - Company's name
- `createdAt` (timestamp) - When the company record was created
- `updatedAt` (timestamp) - When the company record was last updated

## Relationships
- WeeklyReport.studentId → StudentEnrollment.studentId
- StudentEnrollment.companyName → Company.name
