import { useState } from "react";
import { Sparkles, Send, Loader2, Database, Download, BarChart3, Code2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface NLQResult {
  success: boolean;
  question?: string;
  sql?: string;
  results: Record<string, unknown>[];
  row_count: number;
  visualisation?: string;
  error?: string;
}

const SAMPLE_QUESTIONS = [
  "List all rooms and their capacities",
  "Show faculty weekly max load",
  "List all subjects by semester",
  "Show generated timetables and optimization scores",
  "Show upcoming exam schedule",
];

export default function NlqAnalyticsPage() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const [result, setResult] = useState<NLQResult | null>(null);

  const runQuery = async (qText?: string) => {
    const q = (qText ?? question).trim();
    if (q.length < 5) {
      toast.error("Please enter at least 5 characters");
      return;
    }
    setQuestion(q);
    setLoading(true);
    try {
      const res = await api.post<NLQResult>("/nlq/ask", { question: q });
      setResult(res);
      if (!res.success && res.error) {
        toast.error(res.error);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Query failed");
    } finally {
      setLoading(false);
    }
  };

  const columns = result?.results?.length ? Object.keys(result.results[0]) : [];

  // Detect chartable label + numeric column for Recharts bar chart
  const numericCol = columns.find((c) =>
    result?.results.some((r) => typeof r[c] === "number")
  );
  const labelCol = columns.find((c) => c !== numericCol);
  const showChart =
    result?.visualisation === "bar_chart" && numericCol && labelCol && result.results.length > 0;

  const downloadCsv = () => {
    if (!result || result.results.length === 0) return;
    const header = columns.join(",");
    const rows = result.results.map((r) =>
      columns.map((c) => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nlq_results.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="AI Analytics Query (Text-to-SQL)"
        description="Ask plain-English questions about rooms, faculty workload, subjects, timetables, and exams."
        icon={Sparkles}
      />

      <div className="bg-card rounded-xl shadow-sm border border-border p-5 space-y-4">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            runQuery();
          }}
        >
          <Input
            className="rounded-xl"
            placeholder="e.g. Show all rooms and their capacities, or List faculty weekly loads..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <Button type="submit" disabled={loading} className="rounded-xl btn-press gap-2 shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Run Query
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          {SAMPLE_QUESTIONS.map((sq) => (
            <button
              key={sq}
              type="button"
              onClick={() => runQuery(sq)}
              className="text-xs px-3 py-1.5 rounded-lg border border-border bg-muted/30 hover:bg-accent transition-colors"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Database className="h-4 w-4" />
              <span>{result.row_count} row(s) returned</span>
            </div>
            <div className="flex items-center gap-2">
              {result.sql && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1.5"
                  onClick={() => setShowSql((s) => !s)}
                >
                  <Code2 className="h-3.5 w-3.5" /> {showSql ? "Hide SQL" : "Show SQL"}
                </Button>
              )}
              {result.results.length > 0 && (
                <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={downloadCsv}>
                  <Download className="h-3.5 w-3.5" /> Export CSV
                </Button>
              )}
            </div>
          </div>

          {showSql && result.sql && (
            <pre className="bg-muted p-4 rounded-xl text-xs font-mono overflow-x-auto border border-border">
              {result.sql}
            </pre>
          )}

          {showChart && (
            <div className="bg-card rounded-xl shadow-sm border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h3 className="font-medium text-sm">Chart Visualization</h3>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={result.results}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey={labelCol} tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey={numericCol} fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="bg-card rounded-xl shadow-sm border border-border overflow-x-auto">
            {result.results.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">No matching rows found.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    {columns.map((col) => (
                      <th key={col} className="text-left py-3 px-4 font-medium text-muted-foreground capitalize">
                        {col.replace(/_/g, " ")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.results.map((row, idx) => (
                    <tr key={idx} className="border-b border-border last:border-0 hover:bg-muted/10">
                      {columns.map((col) => (
                        <td key={col} className="py-2.5 px-4">
                          {row[col] === null || row[col] === undefined ? "—" : String(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
