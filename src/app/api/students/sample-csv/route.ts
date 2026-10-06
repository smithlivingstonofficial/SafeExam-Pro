import { NextResponse } from "next/server";
import { generateCsv } from "@/lib/bulk-upload/csv-parser";

export const dynamic = "force-dynamic";

export async function GET() {
  const columns = [
    { key: "fullName", label: "Full Name" },
    { key: "email", label: "Institutional Email" },
    { key: "phone", label: "Mobile / Phone" },
    { key: "department", label: "Department Name" },
    { key: "password", label: "Initial Temporary Password" },
  ];

  const sampleStudents = [
    {
      fullName: "Kavitha Murugesan",
      email: "kavitha.m@kalasalingam.ac.in",
      phone: "+91 98450 12345",
      department: "Computer Science and Engineering",
      password: "CandidatePass2026!",
    },
    {
      fullName: "Anand Rajan",
      email: "anand.r@kalasalingam.ac.in",
      phone: "+91 98450 67890",
      department: "Electrical and Electronics Engineering",
      password: "CandidatePass2026!",
    },
    {
      fullName: "Deepika Sundaram",
      email: "deepika.s@kalasalingam.ac.in",
      phone: "+91 98450 54321",
      department: "Mechanical Engineering",
      password: "CandidatePass2026!",
    },
  ];

  const csv = generateCsv(columns, sampleStudents);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="students_bulk_upload_template.csv"',
    },
  });
}
