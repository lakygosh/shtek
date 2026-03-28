import { useState, useRef, useCallback } from "react";
import { Card } from "./ui";
import { parseFile, getSample, applyMapping, detectRsdAmounts } from "../lib/importParser";
import { analyzeSpreadsheet } from "../lib/importApi";

const TABLE_LABELS = {
  daily_entries: "Daily Expenses",
  expenses: "Monthly Budget",
  goals: "Savings Goals",
  user_settings: "Income Settings",
};

const TABLE_FIELDS = {
  daily_entries: ["date", "amount", "category", "description"],
  expenses: ["name", "category", "priority", "amount", "frequency", "notes"],
  goals: ["name", "template", "target_amount", "current_savings", "monthly_contribution", "deadline"],
  user_settings: ["gross_income", "tax_rate"],
};

// ── Step 1: Upload ──

function UploadStep({ onFileAnalyzed, error, setError }) {
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [status, setStatus] = useState("");
  const fileRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("File is too large. Maximum size is 10MB.");
      return;
    }
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext)) {
      setError("Unsupported file type. Please upload a .csv, .xlsx, or .xls file.");
      return;
    }

    setError("");
    setAnalyzing(true);
    try {
      setStatus("Parsing file...");
      const { headers, rows } = await parseFile(file);
      if (rows.length === 0) {
        setError("No data rows found in the file.");
        setAnalyzing(false);
        return;
      }

      setStatus("Analyzing with AI...");
      const { headers: sampleHeaders, sampleRows } = getSample(headers, rows);
      const mapping = await analyzeSpreadsheet(sampleHeaders, sampleRows, file.name);

      onFileAnalyzed({ headers, rows, mapping, fileName: file.name });
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
      setStatus("");
    }
  }, [onFileAnalyzed, setError]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !analyzing && fileRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "#8FB996" : "#333"}`,
          borderRadius: 12,
          padding: "48px 24px",
          textAlign: "center",
          cursor: analyzing ? "wait" : "pointer",
          background: dragging ? "rgba(143,185,150,0.05)" : "transparent",
          transition: "all 0.2s",
        }}
      >
        {analyzing ? (
          <div>
            <div style={{ fontSize: 32, marginBottom: 12 }}>...</div>
            <div style={{ color: "#8FB996", fontSize: 14, fontWeight: 600 }}>{status}</div>
            <div style={{ color: "#666", fontSize: 12, marginTop: 8 }}>This usually takes a few seconds</div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 32, marginBottom: 12 }}>+</div>
            <div style={{ color: "#e8e4de", fontSize: 14, fontWeight: 600 }}>Drop your file here or click to browse</div>
            <div style={{ color: "#666", fontSize: 12, marginTop: 8 }}>Supports .csv, .xlsx, .xls (max 10MB)</div>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {error && (
        <div style={{ marginTop: 12, padding: "10px 12px", background: "#2a1a1a", borderRadius: 8, border: "1px solid #4a2020", fontSize: 13, color: "#D49A9A" }}>
          {error}
        </div>
      )}
    </div>
  );
}

// ── Step 2: Review Mapping ──

function MappingStep({ headers, sampleRows, mapping, onMappingChange, onTargetTableChange }) {
  const targetTable = mapping.targetTable;
  const availableFields = [...(TABLE_FIELDS[targetTable] || []), "skip"];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: "#888" }}>Detected as:</span>
          <select
            value={targetTable}
            onChange={(e) => onTargetTableChange(e.target.value)}
            style={{
              background: "#1e1a16", border: "1px solid #333", color: "#e8e4de",
              borderRadius: 6, padding: "6px 10px", fontSize: 13, outline: "none",
            }}
          >
            {Object.entries(TABLE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          {mapping.confidence && (
            <span style={{
              fontSize: 11, padding: "3px 8px", borderRadius: 4,
              background: mapping.confidence === "high" ? "#1a2a1a" : mapping.confidence === "medium" ? "#2a2a1a" : "#2a1a1a",
              color: mapping.confidence === "high" ? "#8FB996" : mapping.confidence === "medium" ? "#D4C5A9" : "#D49A9A",
            }}>
              {mapping.confidence} confidence
            </span>
          )}
        </div>
      </div>

      {mapping.warnings?.length > 0 && (
        <div style={{ marginBottom: 12, padding: "8px 12px", background: "#2a2a1a", borderRadius: 8, border: "1px solid #4a4020", fontSize: 12, color: "#D4C5A9" }}>
          {mapping.warnings.map((w, i) => <div key={i}>{w}</div>)}
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={thStyle}>Source Column</th>
              <th style={thStyle}>Maps To</th>
              <th style={thStyle}>Sample Values</th>
            </tr>
          </thead>
          <tbody>
            {mapping.columnMapping?.map((col, i) => (
              <tr key={i}>
                <td style={tdStyle}>{col.sourceColumn}</td>
                <td style={tdStyle}>
                  <select
                    value={col.targetField}
                    onChange={(e) => {
                      const updated = [...mapping.columnMapping];
                      updated[i] = { ...updated[i], targetField: e.target.value };
                      onMappingChange({ ...mapping, columnMapping: updated });
                    }}
                    style={{
                      background: "#1e1a16", border: "1px solid #333", color: "#e8e4de",
                      borderRadius: 4, padding: "4px 6px", fontSize: 12, outline: "none", width: "100%",
                    }}
                  >
                    {availableFields.map((f) => (
                      <option key={f} value={f}>{f === "skip" ? "-- Skip --" : f}</option>
                    ))}
                  </select>
                </td>
                <td style={{ ...tdStyle, color: "#888", fontSize: 11, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {sampleRows.slice(0, 3).map((r) => r[col.sourceIndex]).filter(Boolean).join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mapping.unmappedColumns?.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
          Skipped columns: {mapping.unmappedColumns.join(", ")}
        </div>
      )}
    </div>
  );
}

// ── Step 3: Preview ──

function PreviewStep({ validRows, errorRows, targetTable, convertRsd, setConvertRsd, showRsdToggle }) {
  const fields = TABLE_FIELDS[targetTable] || [];
  const previewRows = validRows.slice(0, 20);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ fontSize: 14, color: "#8FB996", fontWeight: 600 }}>
          {validRows.length} rows ready to import
        </div>
        {errorRows.length > 0 && (
          <div style={{ fontSize: 13, color: "#D4C5A9" }}>
            {errorRows.length} rows with issues (will be skipped)
          </div>
        )}
        {showRsdToggle && (
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#888", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={convertRsd}
              onChange={(e) => setConvertRsd(e.target.checked)}
              style={{ accentColor: "#8FB996" }}
            />
            Convert from RSD to EUR
          </label>
        )}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>
              {fields.map((f) => <th key={f} style={thStyle}>{f}</th>)}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, i) => (
              <tr key={i}>
                {fields.map((f) => (
                  <td key={f} style={tdStyle}>
                    {row[f] != null ? String(row[f]) : <span style={{ color: "#444" }}>-</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {validRows.length > 20 && (
        <div style={{ marginTop: 8, fontSize: 11, color: "#666", textAlign: "center" }}>
          Showing first 20 of {validRows.length} rows
        </div>
      )}

      {errorRows.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, color: "#D4C5A9", marginBottom: 8, fontWeight: 600 }}>Rows with issues:</div>
          {errorRows.slice(0, 5).map((er, i) => (
            <div key={i} style={{ padding: "6px 10px", marginBottom: 4, background: "#2a2a1a", borderRadius: 6, fontSize: 11, color: "#D4C5A9" }}>
              Row {er.rowIndex}: {er.errors.join("; ")}
            </div>
          ))}
          {errorRows.length > 5 && (
            <div style={{ fontSize: 11, color: "#666" }}>...and {errorRows.length - 5} more</div>
          )}
        </div>
      )}

      <div style={{ marginTop: 16, padding: "8px 12px", background: "#1e1a16", borderRadius: 8, fontSize: 12, color: "#888" }}>
        This will add to your existing data, not replace it.
      </div>
    </div>
  );
}

// ── Step 4: Importing ──

function ImportingStep({ progress, total, done, error, importedCount }) {
  const pct = total > 0 ? Math.round((progress / total) * 100) : 0;

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>!</div>
        <div style={{ color: "#D49A9A", fontSize: 14, fontWeight: 600 }}>Import failed</div>
        <div style={{ color: "#888", fontSize: 12, marginTop: 8 }}>{error}</div>
      </div>
    );
  }

  if (done) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>OK</div>
        <div style={{ color: "#8FB996", fontSize: 16, fontWeight: 600 }}>Import complete!</div>
        <div style={{ color: "#888", fontSize: 13, marginTop: 8 }}>
          Successfully imported {importedCount} entries
        </div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", padding: "32px 0" }}>
      <div style={{ color: "#e8e4de", fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
        Importing... {progress}/{total}
      </div>
      <div style={{ background: "#2a2520", borderRadius: 6, height: 8, overflow: "hidden", maxWidth: 300, margin: "0 auto" }}>
        <div style={{ background: "#8FB996", height: "100%", width: `${pct}%`, transition: "width 0.3s", borderRadius: 6 }} />
      </div>
    </div>
  );
}

// ── Main Modal ──

const STEPS = ["Upload", "Mapping", "Preview", "Import"];

export default function ImportModal({
  onClose, onImportExpenses, onImportDailyEntries, onImportGoals, onImportSettings, existingExpenses,
}) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");

  // Data from Step 1
  const [fileData, setFileData] = useState(null); // { headers, rows, mapping, fileName }

  // Mapping (editable in Step 2)
  const [mapping, setMapping] = useState(null);

  // Preview data (computed in Step 3)
  const [validRows, setValidRows] = useState([]);
  const [errorRows, setErrorRows] = useState([]);
  const [convertRsd, setConvertRsd] = useState(false);
  const [showRsdToggle, setShowRsdToggle] = useState(false);

  // Import progress (Step 4)
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importDone, setImportDone] = useState(false);
  const [importError, setImportError] = useState("");
  const [importedCount, setImportedCount] = useState(0);

  const handleFileAnalyzed = useCallback((data) => {
    setFileData(data);
    setMapping(data.mapping);
    setStep(1);

    // Check for RSD
    const amountCol = data.mapping.columnMapping?.find((c) => c.targetField === "amount");
    if (amountCol) {
      const isRsd = detectRsdAmounts(data.rows, amountCol.sourceIndex);
      setShowRsdToggle(isRsd);
      setConvertRsd(isRsd);
    }
  }, []);

  const handleTargetTableChange = useCallback((newTable) => {
    setMapping((prev) => ({ ...prev, targetTable: newTable }));
  }, []);

  const goToPreview = useCallback(() => {
    if (!fileData || !mapping) return;
    const { validRows: vr, errorRows: er } = applyMapping(
      fileData.headers, fileData.rows, mapping, convertRsd
    );
    setValidRows(vr);
    setErrorRows(er);
    setStep(2);
  }, [fileData, mapping, convertRsd]);

  // Recompute preview when convertRsd changes
  const recomputePreview = useCallback((newConvertRsd) => {
    setConvertRsd(newConvertRsd);
    if (!fileData || !mapping) return;
    const { validRows: vr, errorRows: er } = applyMapping(
      fileData.headers, fileData.rows, mapping, newConvertRsd
    );
    setValidRows(vr);
    setErrorRows(er);
  }, [fileData, mapping]);

  const doImport = useCallback(async () => {
    if (!mapping || validRows.length === 0) return;
    setStep(3);
    setImporting(true);
    setImportProgress(0);
    setImportError("");
    setImportDone(false);

    try {
      const table = mapping.targetTable;
      const total = validRows.length;

      if (table === "daily_entries") {
        await onImportDailyEntries(validRows, (p) => setImportProgress(p));
        setImportedCount(total);
      } else if (table === "expenses") {
        const newExpenses = validRows.map((row, i) => ({
          id: crypto.randomUUID(),
          name: row.name || "",
          category: row.category || "Other",
          priority: row.priority || "Important",
          amount: row.amount || 0,
          frequency: row.frequency || "Monthly",
          notes: row.notes || "",
        }));
        const merged = [...(existingExpenses || []), ...newExpenses];
        onImportExpenses(merged);
        setImportProgress(total);
        setImportedCount(total);
      } else if (table === "goals") {
        await onImportGoals(validRows, (p) => setImportProgress(p));
        setImportedCount(total);
      } else if (table === "user_settings") {
        const row = validRows[0];
        const updates = {};
        if (row.gross_income != null) updates.gross_income = row.gross_income;
        if (row.tax_rate != null) updates.tax_rate = row.tax_rate;
        await onImportSettings(updates);
        setImportProgress(1);
        setImportedCount(1);
      }

      setImportDone(true);
    } catch (err) {
      setImportError(err.message);
    } finally {
      setImporting(false);
    }
  }, [mapping, validRows, existingExpenses, onImportExpenses, onImportDailyEntries, onImportGoals, onImportSettings]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.8)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: "#121010", borderRadius: 16, border: "1px solid #2a2520",
        width: "100%", maxWidth: 700, maxHeight: "90vh", display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: "1px solid #2a2520",
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#e8e4de" }}>Import Data</div>
            <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
              {STEPS.map((s, i) => (
                <span key={s}>
                  <span style={{ color: i === step ? "#8FB996" : i < step ? "#666" : "#444", fontWeight: i === step ? 600 : 400 }}>{s}</span>
                  {i < STEPS.length - 1 && <span style={{ margin: "0 6px", color: "#333" }}>/</span>}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#666", fontSize: 20, cursor: "pointer", padding: "4px 8px" }}
          >x</button>
        </div>

        {/* Content */}
        <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
          {step === 0 && (
            <UploadStep onFileAnalyzed={handleFileAnalyzed} error={error} setError={setError} />
          )}
          {step === 1 && mapping && fileData && (
            <MappingStep
              headers={fileData.headers}
              sampleRows={fileData.rows.slice(0, 5)}
              mapping={mapping}
              onMappingChange={setMapping}
              onTargetTableChange={handleTargetTableChange}
            />
          )}
          {step === 2 && (
            <PreviewStep
              validRows={validRows}
              errorRows={errorRows}
              targetTable={mapping?.targetTable}
              convertRsd={convertRsd}
              setConvertRsd={recomputePreview}
              showRsdToggle={showRsdToggle}
            />
          )}
          {step === 3 && (
            <ImportingStep
              progress={importProgress}
              total={validRows.length}
              done={importDone}
              error={importError}
              importedCount={importedCount}
            />
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "12px 20px", borderTop: "1px solid #2a2520",
        }}>
          <div>
            {step > 0 && step < 3 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                style={btnStyle("#2a2520", "#888")}
              >Back</button>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {step === 3 && importDone && (
              <button onClick={onClose} style={btnStyle("#1a2a1a", "#8FB996")}>Done</button>
            )}
            {step === 1 && (
              <button onClick={goToPreview} style={btnStyle("#1a2a1a", "#8FB996")}>
                Preview ({fileData?.rows.length || 0} rows)
              </button>
            )}
            {step === 2 && validRows.length > 0 && (
              <button onClick={doImport} style={btnStyle("#1a2a1a", "#8FB996")}>
                Import {validRows.length} {TABLE_LABELS[mapping?.targetTable] || "entries"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shared styles ──

const thStyle = {
  textAlign: "left", padding: "8px 10px", borderBottom: "1px solid #2a2520",
  fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.5px",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "8px 10px", borderBottom: "1px solid #1e1a16", color: "#e8e4de",
  whiteSpace: "nowrap",
};

function btnStyle(bg, color) {
  return {
    background: bg, border: `1px solid ${color}33`, borderRadius: 8,
    padding: "8px 16px", color, fontSize: 13, fontWeight: 600, cursor: "pointer",
  };
}
