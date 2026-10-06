"use client";

import { useState, useRef } from "react";
import { parseCsv, generateCsv, downloadCsvFile } from "@/lib/bulk-upload/csv-parser";
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  FileText,
} from "lucide-react";

export interface ColumnDefinition {
  key: string;
  label: string;
  sample: string;
  required?: boolean;
  description?: string;
}

export interface RowValidationResult<T = any> {
  isValid: boolean;
  errors: string[];
  parsed?: T;
}

export interface BulkImportExecutionResult {
  success: boolean;
  totalProcessed: number;
  createdCount: number;
  skippedCount: number;
  updatedCount: number;
  failedCount: number;
  errors: Array<{ rowNumber?: number; email?: string; fullName?: string; error: string }>;
}

interface BulkUploadModalProps<T = any> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  entityName: string;
  description: string;
  templateFileName: string;
  columns: ColumnDefinition[];
  validateRow: (row: Record<string, string>, index: number) => RowValidationResult<T>;
  onExecuteImport: (validItems: T[], conflictStrategy: "skip" | "overwrite") => Promise<{
    success: boolean;
    error?: string;
    data?: BulkImportExecutionResult;
  }>;
  onSuccess?: (result: BulkImportExecutionResult) => void;
}

type Step = "upload" | "preview" | "processing" | "complete";

export function BulkUploadModal<T = any>({
  isOpen,
  onClose,
  title,
  entityName,
  description,
  templateFileName,
  columns,
  validateRow,
  onExecuteImport,
  onSuccess,
}: BulkUploadModalProps<T>) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState<string>("");
  const [conflictStrategy, setConflictStrategy] = useState<"skip" | "overwrite">("skip");

  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [validatedRows, setValidatedRows] = useState<
    Array<{
      rowNumber: number;
      raw: Record<string, string>;
      isValid: boolean;
      errors: string[];
      parsed?: T;
    }>
  >([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [executionResult, setExecutionResult] = useState<BulkImportExecutionResult | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validRows = validatedRows.filter((r) => r.isValid);
  const invalidRows = validatedRows.filter((r) => !r.isValid);

  function resetState() {
    setStep("upload");
    setFileName("");
    setRawRows([]);
    setValidatedRows([]);
    setIsProcessing(false);
    setExecutionResult(null);
    setServerError(null);
  }

  function handleClose() {
    resetState();
    onClose();
  }

  // Generate and download standard CSV template
  function handleDownloadTemplate() {
    const templateCols = columns.map((c) => ({ key: c.key, label: c.label }));
    const sampleRow: Record<string, string> = {};
    columns.forEach((c) => {
      sampleRow[c.key] = c.sample;
    });

    const csvContent = generateCsv(templateCols, [sampleRow]);
    downloadCsvFile(templateFileName, csvContent);
  }

  // Handle uploaded file
  function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setServerError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCsv(text);

        if (parsed.rows.length === 0) {
          setServerError("The uploaded CSV file is empty or missing data rows.");
          return;
        }

        // Validate each row client-side
        const validated = parsed.rows.map((row, idx) => {
          const res = validateRow(row, idx);
          return {
            rowNumber: idx + 1,
            raw: row,
            isValid: res.isValid,
            errors: res.errors,
            parsed: res.parsed,
          };
        });

        setRawRows(parsed.rows);
        setValidatedRows(validated);
        setStep("preview");
      } catch (err) {
        setServerError("Failed to read CSV file. Please verify file format and encoding.");
      }
    };

    reader.readAsText(file);
  }

  // Export failed rows to CSV for instant fixing
  function handleDownloadFailedRows() {
    if (invalidRows.length === 0) return;

    const errorCols = [
      { key: "__rowNumber", label: "Original Row #" },
      ...columns.map((c) => ({ key: c.key, label: c.label })),
      { key: "__validationErrors", label: "Validation Errors" },
    ];

    const failedData = invalidRows.map((r) => ({
      __rowNumber: r.rowNumber,
      ...r.raw,
      __validationErrors: r.errors.join("; "),
    }));

    const csvContent = generateCsv(errorCols, failedData);
    downloadCsvFile(`failed_${entityName.toLowerCase()}_rows.csv`, csvContent);
  }

  // Execute Batch Server Action
  async function handleConfirmImport() {
    if (validRows.length === 0) return;

    setIsProcessing(true);
    setStep("processing");
    setServerError(null);

    try {
      const itemsToIngest = validRows
        .map((r) => r.parsed)
        .filter((p): p is T => p !== undefined && p !== null);
      const res = await onExecuteImport(itemsToIngest, conflictStrategy);

      if (!res.success || !res.data) {
        setServerError(res.error || "Bulk import failed on the server.");
        setStep("preview");
      } else {
        setExecutionResult(res.data);
        setStep("complete");
        if (onSuccess) {
          onSuccess(res.data);
        }
      }
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Failed to execute bulk import.");
      setStep("preview");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                {title}
              </h2>
              <p className="text-[11px] text-slate-500">{description}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Server Error Banner */}
          {serverError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
              <span>{serverError}</span>
            </div>
          )}

          {/* STEP 1: UPLOAD */}
          {step === "upload" && (
            <div className="space-y-6">
              {/* Template Download Card */}
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white border border-purple-200 text-purple-700 shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      Standard CSV Template
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Download the official pre-formatted spreadsheet template with sample rows.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-purple-200 text-purple-700 text-xs font-bold rounded-xl transition-colors shrink-0 shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .CSV Template</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-purple-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-50/50 hover:bg-purple-50/20 transition-all group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileSelected}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-500 group-hover:text-purple-700 group-hover:border-purple-300 flex items-center justify-center mx-auto mb-3 transition-colors shadow-2xs">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-slate-800">
                  Click to choose file or drag & drop CSV
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports comma-separated (.csv) files up to 1,000 records per upload
                </p>
              </div>

              {/* Expected Format Columns */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2.5 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Expected Columns in Spreadsheet:</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {columns.map((c) => (
                    <div
                      key={c.key}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-[11px]"
                    >
                      <div className="font-bold text-slate-800 flex items-center justify-between">
                        <span>{c.label}</span>
                        {c.required && (
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-extrabold">
                            Required
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                        e.g. {c.sample}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW & VALIDATION */}
          {step === "preview" && (
            <div className="space-y-5">
              {/* File Stats Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Rows</div>
                  <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                    {validatedRows.length}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-[10px] uppercase font-bold text-emerald-700">Valid Rows</div>
                  <div className="text-xl font-extrabold text-emerald-800 mt-0.5">
                    {validRows.length}
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border ${invalidRows.length > 0 ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-200"}`}>
                  <div className={`text-[10px] uppercase font-bold ${invalidRows.length > 0 ? "text-rose-700" : "text-slate-400"}`}>
                    Invalid Rows
                  </div>
                  <div className={`text-xl font-extrabold mt-0.5 ${invalidRows.length > 0 ? "text-rose-800" : "text-slate-600"}`}>
                    {invalidRows.length}
                  </div>
                </div>
              </div>

              {/* Invalid Rows Warning Drawer */}
              {invalidRows.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 text-xs text-rose-800 space-y-2">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      {invalidRows.length} row(s) failed validation checks and will be omitted
                    </span>
                    <button
                      type="button"
                      onClick={handleDownloadFailedRows}
                      className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 hover:bg-rose-50 text-[11px] font-bold text-rose-700 shadow-2xs transition-colors cursor-pointer"
                    >
                      Download Error CSV
                    </button>
                  </div>
                  <div className="max-h-24 overflow-y-auto space-y-1 text-[11px] font-medium text-rose-700 pl-5">
                    {invalidRows.slice(0, 5).map((inv) => (
                      <div key={inv.rowNumber}>
                        Row {inv.rowNumber}: {inv.errors.join(", ")}
                      </div>
                    ))}
                    {invalidRows.length > 5 && (
                      <div className="text-[10px] italic text-rose-600">
                        ...and {invalidRows.length - 5} more error rows.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Data Preview Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">
                    Preview Data (Showing First 5 Rows)
                  </span>
                  <span className="text-[11px] text-slate-400">File: {fileName}</span>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 text-[10px] uppercase font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Row</th>
                        {columns.slice(0, 4).map((c) => (
                          <th key={c.key} className="py-2.5 px-3">
                            {c.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {validatedRows.slice(0, 5).map((row) => (
                        <tr key={row.rowNumber} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Ready
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                <AlertCircle className="w-3 h-3" /> Error
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-400">#{row.rowNumber}</td>
                          {columns.slice(0, 4).map((c) => {
                            const val =
                              row.raw[c.key] ||
                              row.raw[c.label] ||
                              row.raw[c.key.toLowerCase()] ||
                              (row.parsed && typeof row.parsed === "object" ? String((row.parsed as Record<string, unknown>)[c.key] || "") : "") ||
                              "";
                            return (
                              <td key={c.key} className="py-2.5 px-3 font-medium text-slate-800 truncate max-w-[150px]">
                                {val || "—"}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Conflict Strategy Selector */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">
                  Duplicate Records Handling Strategy:
                </span>
                <div className="flex flex-col sm:flex-row gap-3 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="radio"
                      name="strategy"
                      value="skip"
                      checked={conflictStrategy === "skip"}
                      onChange={() => setConflictStrategy("skip")}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span>Skip already registered candidates (Recommended)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="radio"
                      name="strategy"
                      value="overwrite"
                      checked={conflictStrategy === "overwrite"}
                      onChange={() => setConflictStrategy("overwrite")}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span>Update departmental affiliation if exists</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PROCESSING */}
          {step === "processing" && (
            <div className="py-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center mx-auto animate-pulse">
                <RefreshCw className="w-7 h-7 animate-spin" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Processing {validRows.length} {entityName} Records...
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Provisioning user accounts, linking academic departments, and logging cryptographic audit trail. Please do not close this window.
              </p>
            </div>
          )}

          {/* STEP 4: COMPLETE */}
          {step === "complete" && executionResult && (
            <div className="py-6 text-center space-y-6">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Bulk Import Completed Successfully
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  The candidate database has been updated and audit events recorded.
                </p>
              </div>

              {/* Result Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Processed</div>
                  <div className="text-lg font-extrabold text-slate-900 mt-0.5">
                    {executionResult.totalProcessed}
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="text-[10px] uppercase font-bold text-emerald-700">Created</div>
                  <div className="text-lg font-extrabold text-emerald-800 mt-0.5">
                    {executionResult.createdCount}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Skipped</div>
                  <div className="text-lg font-extrabold text-slate-700 mt-0.5">
                    {executionResult.skippedCount}
                  </div>
                </div>
                <div className={`p-3 rounded-xl border ${executionResult.failedCount > 0 ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-200"}`}>
                  <div className={`text-[10px] uppercase font-bold ${executionResult.failedCount > 0 ? "text-rose-700" : "text-slate-400"}`}>
                    Failed
                  </div>
                  <div className={`text-lg font-extrabold mt-0.5 ${executionResult.failedCount > 0 ? "text-rose-800" : "text-slate-700"}`}>
                    {executionResult.failedCount}
                  </div>
                </div>
              </div>

              {executionResult.failedCount > 0 && executionResult.errors.length > 0 && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const csvContent = generateCsv(
                        [
                          { key: "rowNumber", label: "Row #" },
                          { key: "email", label: "Candidate Email" },
                          { key: "fullName", label: "Candidate Name" },
                          { key: "error", label: "Reason for Failure" },
                        ],
                        executionResult.errors
                      );
                      downloadCsvFile("failed_import_report.csv", csvContent);
                    }}
                    className="text-xs font-bold text-rose-700 hover:text-rose-800 inline-flex items-center gap-1.5 underline cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Failed Records Error Report</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
          {step === "upload" && (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Select File to Upload</span>
              </button>
            </>
          )}

          {step === "preview" && (
            <>
              <button
                type="button"
                onClick={() => setStep("upload")}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={validRows.length === 0 || isProcessing}
                className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>Import {validRows.length} Valid Records</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === "complete" && (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Close & Refresh
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
