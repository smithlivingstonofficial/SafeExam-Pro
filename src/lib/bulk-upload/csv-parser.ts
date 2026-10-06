/**
 * Universal CSV Parser and Generator for SafeExam Pro
 * Zero-dependency, handles quoted fields, newlines, and header normalization.
 */

export interface ParsedCsvResult {
  headers: string[];
  rawHeaders: string[];
  rows: Record<string, string>[];
  totalLines: number;
}

/**
 * Normalizes header string to canonical snake_case or alphanumeric key
 * e.g., "Department Full Name" -> "name", "Full Name" -> "fullName", "E-Mail Address" -> "email"
 */
export function normalizeHeader(header: string): string {
  // Strip all spaces, hyphens, underscores, slashes, parens, dots
  const clean = header.trim().toLowerCase().replace(/[\s\-_/().,#]+/g, "");

  // Department aliases
  if (
    clean === "departmentfullname" ||
    clean === "departmentname" ||
    clean === "deptfullname" ||
    clean === "deptname" ||
    clean === "programname" ||
    clean === "disciplinename" ||
    clean === "branchname"
  ) {
    return "name";
  }
  if (
    clean === "programcode" ||
    clean === "departmentcode" ||
    clean === "deptcode" ||
    clean === "disciplinecode" ||
    clean === "branchcode" ||
    clean === "code"
  ) {
    return "code";
  }
  if (
    clean === "headofdepartment" ||
    clean === "headofdept" ||
    clean === "headname" ||
    clean === "hodname" ||
    clean === "hod" ||
    clean === "head" ||
    clean === "chairperson" ||
    clean === "director"
  ) {
    return "headName";
  }
  if (
    clean === "departmentemail" ||
    clean === "deptemail" ||
    clean === "contactemail" ||
    clean === "hodemail"
  ) {
    return "contactEmail";
  }
  if (clean === "description" || clean === "desc" || clean === "about") {
    return "description";
  }

  // Candidate / User / Roster aliases
  if (
    clean === "fullname" ||
    clean === "candidatename" ||
    clean === "studentname" ||
    clean === "applicantname" ||
    clean === "facultyname" ||
    clean === "staffname"
  ) {
    return "fullName";
  }
  if (
    clean === "email" ||
    clean === "emailaddress" ||
    clean === "candidateemail" ||
    clean === "institutionalemail" ||
    clean === "studentemail"
  ) {
    return "email";
  }
  if (
    clean === "department" ||
    clean === "dept" ||
    clean === "departmentprogram" ||
    clean === "program" ||
    clean === "discipline" ||
    clean === "departmentdiscipline"
  ) {
    return "department";
  }
  if (
    clean === "phone" ||
    clean === "phonenumber" ||
    clean === "mobile" ||
    clean === "mobilenumber" ||
    clean === "contactno" ||
    clean === "contactnumber"
  ) {
    return "phone";
  }
  if (
    clean === "password" ||
    clean === "defaultpassword" ||
    clean === "temppassword" ||
    clean === "temporarypassword" ||
    clean === "initialpassword"
  ) {
    return "password";
  }
  if (
    clean === "registrationno" ||
    clean === "regno" ||
    clean === "registrationnumber" ||
    clean === "rollno" ||
    clean === "rollnumber" ||
    clean === "applicationno" ||
    clean === "hallticketno"
  ) {
    return "registrationNo";
  }
  if (clean === "scheduleid" || clean === "schedule" || clean === "sessionid") {
    return "scheduleId";
  }
  if (clean === "category" || clean === "caste") {
    return "category";
  }
  if (clean === "role" || clean === "userrole" || clean === "accessrole" || clean === "tier") {
    return "role";
  }
  if (clean === "temporarypassword" || clean === "temppassword" || clean === "temppass") {
    return "temporaryPassword";
  }

  // Schedule allocation & seating aliases
  if (
    clean === "candidateidentifier" ||
    clean === "emailorrollnumber" ||
    clean === "candidateemailorrollnumber" ||
    clean === "candidateemailrollnumber" ||
    clean === "candidate" ||
    clean === "student" ||
    clean === "studentemail" ||
    clean === "candidateemail" ||
    clean === "identifier" ||
    clean === "email_or_roll_number"
  ) {
    return "candidateIdentifier";
  }
  if (
    clean === "seatnumber" ||
    clean === "seat" ||
    clean === "desk" ||
    clean === "seatno" ||
    clean === "seat_number"
  ) {
    return "seatNumber";
  }
  if (
    clean === "roomnumber" ||
    clean === "room" ||
    clean === "hall" ||
    clean === "hallno" ||
    clean === "lab" ||
    clean === "labno" ||
    clean === "room_number" ||
    clean === "roomlabnumber"
  ) {
    return "roomNumber";
  }

  // Question aliases
  if (
    clean === "question" ||
    clean === "questiontext" ||
    clean === "questionstatement" ||
    clean === "prompt" ||
    clean === "statement"
  ) {
    return "questionText";
  }
  if (clean === "type" || clean === "questiontype") return "questionType";
  if (clean === "optiona" || clean === "opt1" || clean === "choicea" || clean === "option_a") return "optionA";
  if (clean === "optionb" || clean === "opt2" || clean === "choiceb" || clean === "option_b") return "optionB";
  if (clean === "optionc" || clean === "opt3" || clean === "choicec" || clean === "option_c") return "optionC";
  if (clean === "optiond" || clean === "opt4" || clean === "choiced" || clean === "option_d") return "optionD";
  if (clean === "optione" || clean === "opt5" || clean === "choicee" || clean === "option_e") return "optionE";
  if (
    clean === "answer" ||
    clean === "correct" ||
    clean === "correctanswer" ||
    clean === "correctanswers" ||
    clean === "correct_answer" ||
    clean === "correctanswerkey"
  ) {
    return "correctAnswer";
  }
  if (clean === "marks" || clean === "mark" || clean === "score") return "marks";
  if (clean === "negativemarks" || clean === "penalty") return "negativeMarks";
  if (clean === "difficulty" || clean === "level") return "difficulty";
  if (clean === "topic" || clean === "tags" || clean === "subject") return "topic";
  if (clean === "explanation" || clean === "rationale" || clean === "solution") return "explanation";
  if (
    clean === "scope" ||
    clean === "iscommon" ||
    clean === "applicability" ||
    clean === "classification" ||
    clean === "academicscope" ||
    clean === "part"
  ) {
    return "scope";
  }

  // Generic fallback
  if (clean === "name") return "name";

  return header.trim();
}

/**
 * Parses raw CSV string into array of objects using quote-aware tokenization
 */
export function parseCsv(csvText: string): ParsedCsvResult {
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentToken = "";
  let insideQuotes = false;

  const text = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentToken += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      currentRow.push(currentToken.trim());
      currentToken = "";
    } else if (char === "\n" && !insideQuotes) {
      currentRow.push(currentToken.trim());
      if (currentRow.some((field) => field.length > 0)) {
        lines.push(currentRow);
      }
      currentRow = [];
      currentToken = "";
    } else {
      currentToken += char;
    }
  }

  // Push remaining tokens
  if (currentToken.length > 0 || currentRow.length > 0) {
    currentRow.push(currentToken.trim());
    if (currentRow.some((field) => field.length > 0)) {
      lines.push(currentRow);
    }
  }

  if (lines.length === 0) {
    return { headers: [], rawHeaders: [], rows: [], totalLines: 0 };
  }

  const rawHeaders = lines[0];
  const headers = rawHeaders.map((h) => normalizeHeader(h));
  const rows: Record<string, string>[] = [];

  for (let r = 1; r < lines.length; r++) {
    const rowValues = lines[r];
    const rowObj: Record<string, string> = {
      __rowNumber: String(r + 1),
    };

    let hasValue = false;
    for (let c = 0; c < headers.length; c++) {
      const key = headers[c];
      const rawKey = rawHeaders[c];
      const val = rowValues[c] !== undefined ? rowValues[c] : "";
      if (val.trim()) hasValue = true;

      // Primary normalized key
      rowObj[key] = val;

      // Secondary lookups for raw header and clean lowercase aliases
      if (rawKey) {
        rowObj[rawKey] = val;
        rowObj[rawKey.trim()] = val;
        const cleanRaw = rawKey.trim().toLowerCase().replace(/[\s\-_/().,#]+/g, "");
        rowObj[cleanRaw] = val;
      }
    }

    if (hasValue) {
      rows.push(rowObj);
    }
  }

  return {
    headers,
    rawHeaders,
    rows,
    totalLines: lines.length,
  };
}

/**
 * Formats data rows into standard RFC-4180 CSV string
 */
export function generateCsv(
  columns: Array<{ key: string; label: string }>,
  rows: Array<Record<string, unknown>>
): string {
  const headerLine = columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(",");
  const dataLines = rows.map((row) =>
    columns
      .map((col) => {
        const val = row[col.key];
        const strVal = val === null || val === undefined ? "" : String(val);
        return `"${strVal.replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  return [headerLine, ...dataLines].join("\r\n");
}

/**
 * Triggers a browser download of generated CSV content
 */
export function downloadCsvFile(filename: string, content: string): void {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
