# SafeExam Pro — Bulk Upload Sample Datasets

This directory contains production-ready sample CSV files and Aiken text files formatted specifically for the bulk import engines across **SafeExam Pro**.

---

## 📁 Sample Files Overview

| File | Target Entity | Module / Modal | Format |
|---|---|---|---|
| [`candidates_bulk_import_sample.csv`](./candidates_bulk_import_sample.csv) | Entrance Examinees / Candidates | **Admin > Candidates** (`/admin/students`) | CSV (RFC 4180) |
| [`questions_bulk_import_sample.csv`](./questions_bulk_import_sample.csv) | Complete 50-Question Exam Set (20 Common + 30 Dept) | **Examiner > Question Banks** (`/examiner/banks/[id]`) | CSV (RFC 4180) |
| [`questions_20_common_sample.csv`](./questions_20_common_sample.csv) | 20 Common Aptitude Questions (Part A) | **Examiner > Universal Question Banks** | CSV (RFC 4180) |
| [`questions_30_dept_specific_sample.csv`](./questions_30_dept_specific_sample.csv) | 30 Department-Specific Questions (Part B) | **Examiner > Department Question Banks** | CSV (RFC 4180) |
| [`questions_aiken_format_sample.txt`](./questions_aiken_format_sample.txt) | 50 Questions (20 Common + 30 Dept in Aiken Format) | **Examiner > Bulk Question Modal > Aiken Tab** | Plain Text |
| [`departments_bulk_import_sample.csv`](./departments_bulk_import_sample.csv) | Academic Departments | **Admin > Departments** (`/admin/departments`) | CSV (RFC 4180) |
| [`university_staff_roster_sample.csv`](./university_staff_roster_sample.csv) | Faculty & Proctors | **Admin > User Roster** (`/admin/users`) | CSV (RFC 4180) |
| [`candidate_seating_allocation_sample.csv`](./candidate_seating_allocation_sample.csv) | Seating & Lab Allocation | **Examiner > Schedules > Roster Modal** (`/examiner/schedules`) | CSV (RFC 4180) |

---

## Standard 50-Question Exam Structure (20 Common + 30 Department-Specific)

SafeExam Pro standardizes all university entrance evaluations into a **50-Question Exam Blueprint**:
- **Part A (20 Questions - Universal/Common)**: Covers Research Methodology, Quantitative Analysis, Probability & Statistics, Syllogisms, and Analytical Aptitude. Shared identically across all applicants regardless of department.
- **Part B (30 Questions - Department-Specific)**: Covers advanced discipline-specific competencies (e.g. Algorithms, Data Structures, DBMS, Operating Systems, Networks, Machine Learning, Cyber Security for Computer Applications / Computer Science).

---

---

## 1. Candidate / Student Bulk Import (`candidates_bulk_import_sample.csv`)

Used by university administrators to onboard entrance exam candidates and enroll them into academic disciplines.

### Columns
- `Full Name` *(Required)*: Candidate's full name (e.g. `Aarav Sharma`)
- `Email Address` *(Required)*: Institutional or registered candidate email (e.g. `aarav.sharma@klu.ac.in`)
- `Department / Program` *(Required)*: Department or program code/name (e.g. `MCA`, `CSE`, `AI-DS`)
- `Phone Number` *(Optional)*: Contact mobile number with country code (e.g. `+91 98401 11223`)
- `Registration No` *(Optional)*: University application / hall ticket number (e.g. `KLU2026-MCA-001`)
- `Default Password` *(Optional)*: Initial password (e.g. `CandidatePass@2026`)

---

## 2. Question Bank Bulk Import (`questions_bulk_import_sample.csv`)

Used by academic examiners to bulk populate exam question banks with varied question types.

### Columns
- `Question Statement` *(Required)*: The question prompt or LaTeX equation
- `Question Type` *(Required)*: `mcq_single`, `mcq_multiple`, `true_false`, `numerical`, `fill_blank`, or `descriptive`
- `Option A` to `Option E`: Multiple choice choices (at least A and B required for MCQs)
- `Correct Answer` *(Required)*: Correct key (`A`, `B`, `A,B,C,D` for multi-select, numerical value like `91`, or text string)
- `Difficulty` *(Optional)*: `easy`, `medium`, `hard`, `expert`, or `1` to `5`
- `Topic` *(Optional)*: Subject matter topic / tag (e.g. `Algorithms`, `Database Systems`)
- `Explanation` *(Optional)*: Detailed rationale / solution for students and reviewers

---

## 3. Aiken Text Format (`questions_aiken_format_sample.txt`)

Standard format for rapid question authoring and bulk copy-pasting directly into the examiner UI.

### Syntax
```text
What is the primary key constraint in relational database management systems?
A. Allows multiple null values in indexed columns
B. Uniquely identifies each record in a database table without duplicates
C. Automatically manages distributed shard partitioning across clusters
D. Indexes variable-length character columns only
ANSWER: B
```

---

## 4. Academic Departments (`departments_bulk_import_sample.csv`)

Used to establish academic programs, faculty divisions, and HOD contacts.

### Columns
- `Department Full Name` *(Required)*: Name of department (e.g. `Department of Computer Applications`)
- `Program Code` *(Optional)*: Short alphanumeric code (e.g. `MCA`, `CSE`, `AI-DS`)
- `Head of Department` *(Optional)*: Chairperson / HOD name (e.g. `Dr. P. Livingston`)
- `Department Email` *(Optional)*: Official contact email (e.g. `hod.mca@klu.ac.in`)
- `Description` *(Optional)*: Program focus and research areas

---

## 5. University Faculty & Staff Roster (`university_staff_roster_sample.csv`)

Provisions staff credentials and assigns RBAC security permissions.

### Columns
- `Full Name` *(Required)*: Faculty or invigilator name
- `Institutional Email` *(Required)*: University login email
- `Access Role` *(Required)*: `examiner`, `proctor`, `viewer`, `admin`, or `candidate`
- `Department / Discipline` *(Optional)*: Department assignment
- `Phone Number` *(Optional)*: Mobile number
- `Initial Password` *(Optional)*: Temporary login password

---

## 6. Exam Seating & Candidate Allocation (`candidate_seating_allocation_sample.csv`)

Allocates registered candidates to physical examination halls, computer labs, and specific desks.

### Columns
- `Candidate Email / Roll Number` *(Required)*: Email or hall ticket number
- `Seat Number` *(Optional)*: Physical desk ID (e.g. `LAB1-S01`, `HALL-A-04`)
- `Room / Lab Number` *(Optional)*: Room or hall name (e.g. `CSE-LAB-1`, `TURING-AUDITORIUM`)
