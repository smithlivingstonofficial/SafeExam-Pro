import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "public", "samples", "questions_bulk_import_sample.csv");
    const csvContent = await fs.readFile(filePath, "utf-8");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="question_bank_50_questions_template.csv"',
      },
    });
  } catch (error) {
    console.error("Error reading sample CSV file:", error);
    return NextResponse.json({ error: "Failed to load sample CSV" }, { status: 500 });
  }
}
