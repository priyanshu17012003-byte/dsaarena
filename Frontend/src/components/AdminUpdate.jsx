import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import axiosClient from "../utils/axiosClient";
import { useNavigate, useParams, NavLink } from "react-router-dom";


const problemSchema = z.object({
  title:       z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  difficulty:  z.enum(["easy", "medium", "hard"]),
  tags:        z.array(z.string()).min(1, "At least one tag is required"),

  visibleTestCases: z.array(
    z.object({
      input:       z.string().min(1, "Input is required"),
      output:      z.string().min(1, "Output is required"),
      explanation: z.string().optional(),
    })
  ).min(1, "At least one visible test case is required"),

  hiddenTestCases: z.array(
    z.object({
      input:  z.string().min(1, "Input is required"),
      output: z.string().min(1, "Output is required"),
    })
  ).min(1, "At least one hidden test case is required"),

  startCode: z.array(
    z.object({
      language:    z.string(),
      initialCode: z.string().min(1, "Initial code is required"),
    })
  ).length(3, "All three languages required"),

  referenceSolution: z.array(
    z.object({
      language:     z.string(),
      completeCode: z.string().min(1, "Complete code is required"),
    })
  ).length(3, "All three languages required"),
});


const LANGUAGES = [
  { value: "cpp",        label: "C++",        icon: "⚙️" },
  { value: "java",       label: "Java",       icon: "☕" },
  { value: "javascript", label: "JavaScript", icon: "⚡" },
];

const TAG_OPTIONS = [
  { value: "array",    label: "Array"      },
  { value: "string",   label: "String"     },
  { value: "linklist", label: "Linked List" },
  { value: "graph",    label: "Graph"      },
  { value: "dp",       label: "DP"         },
];

const DIFFICULTY_OPTIONS = [
  { value: "easy",   label: "Easy",   color: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10" },
  { value: "medium", label: "Medium", color: "text-amber-400  border-amber-400/40  bg-amber-400/10"  },
  { value: "hard",   label: "Hard",   color: "text-rose-400   border-rose-400/40   bg-rose-400/10"   },
];

const inputCls = (err) =>
  `w-full bg-zinc-800 border rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 transition-colors ${
    err ? "border-rose-500/60 focus:ring-rose-500/40" : "border-zinc-700 focus:border-indigo-500 focus:ring-indigo-500/30"
  }`;

const areaCls = (err) =>
  `w-full bg-zinc-800 border rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 transition-colors resize-none ${
    err ? "border-rose-500/60 focus:ring-rose-500/40" : "border-zinc-700 focus:border-indigo-500 focus:ring-indigo-500/30"
  }`;

const monoAreaCls = (err) =>
  `w-full bg-[#0d1117] border rounded-xl px-4 py-3 text-sm text-emerald-300 placeholder-zinc-700 focus:outline-none focus:ring-1 font-mono transition-colors resize-none ${
    err ? "border-rose-500/60 focus:ring-rose-500/40" : "border-zinc-800 focus:border-indigo-500/60 focus:ring-indigo-500/20"
  }`;


const Section = ({ title, subtitle, children }) => (
  <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-5">
    <div className="border-b border-zinc-800 pb-4">
      <h2 className="text-base font-bold text-white">{title}</h2>
      {subtitle && <p className="text-xs text-zinc-600 font-mono mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
);

const Field = ({ label, error, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-mono font-semibold text-zinc-500 uppercase tracking-wider">{label}</label>
    {children}
    {error && <p className="text-xs text-rose-400 font-mono">⚠ {error}</p>}
  </div>
);


export default function AdminUpdate() {
  const { id }       = useParams();   
  const navigate     = useNavigate();

  const [fetching,     setFetching]     = useState(true);
  const [fetchError,   setFetchError]   = useState(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [toast,        setToast]        = useState(null);
  const [serverError,  setServerError]  = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      title:       "",
      description: "",
      difficulty:  "easy",
      tags:        [],
      visibleTestCases:  [],
      hiddenTestCases:   [],
      startCode: [
        { language: "cpp",        initialCode: "" },
        { language: "java",       initialCode: "" },
        { language: "javascript", initialCode: "" },
      ],
      referenceSolution: [
        { language: "cpp",        completeCode: "" },
        { language: "java",       completeCode: "" },
        { language: "javascript", completeCode: "" },
      ],
    },
  });

  const watchDifficulty = watch("difficulty");

  const { fields: visibleFields, append: appendVisible, remove: removeVisible, replace: replaceVisible } =
    useFieldArray({ control, name: "visibleTestCases" });

  const { fields: hiddenFields, append: appendHidden, remove: removeHidden, replace: replaceHidden } =
    useFieldArray({ control, name: "hiddenTestCases" });

  
  useEffect(() => {
    if (!id) return;
    setFetching(true);

    axiosClient
      .get(`/problem/getById/${id}`)
      .then(({ data }) => {
        
        const normalizeCode = (arr = [], key) => {
          return LANGUAGES.map((lang) => {
            const found = arr.find((s) => s.language?.toLowerCase() === lang.value);
            return { language: lang.value, [key]: found?.[key] || "" };
          });
        };

        const normalizedStart = normalizeCode(data.startCode,        "initialCode");
        const normalizedRef   = normalizeCode(data.referenceSolution, "completeCode");

        const tags = Array.isArray(data.tags) ? data.tags : [data.tags].filter(Boolean);

        
        reset({
          title:             data.title       || "",
          description:       data.description || "",
          difficulty:        data.difficulty?.toLowerCase() || "easy",
          tags,
          visibleTestCases:  data.visibleTestCases  || [],
          hiddenTestCases:   data.hiddenTestCases   || [],
          startCode:         normalizedStart,
          referenceSolution: normalizedRef,
        });

        setSelectedTags(tags);
      })
      .catch((err) => {
        setFetchError(err.response?.data?.message || "Failed to load problem.");
      })
      .finally(() => setFetching(false));
  }, [id, reset]);

 
  const toggleTag = (tagValue) => {
    const next = selectedTags.includes(tagValue)
      ? selectedTags.filter((t) => t !== tagValue)
      : [...selectedTags, tagValue];
    setSelectedTags(next);
    setValue("tags", next, { shouldValidate: true });
  };

  
  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      setServerError(null);
      console.log("Update payload:", JSON.stringify(data, null, 2));

      await axiosClient.put(`/problem/update/${id}`, data);

      setToast({ type: "success", msg: "Problem updated successfully!" });
      setTimeout(() => navigate("/admin/delete"), 1500);
    } catch (err) {
      const errData = err.response?.data;
      console.error("Server error:", errData);
      setServerError(typeof errData === "object" ? errData : { message: errData || err.message });
      setToast({ type: "error", msg: errData?.message || err.message || "Something went wrong." });
    } finally {
      setSubmitting(false);
    }
  };

  const onInvalid = (errs) => console.warn("Validation failed:", errs);

  
  if (fetching) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center space-y-3">
          <span className="loading loading-spinner loading-lg text-indigo-500" />
          <p className="text-zinc-600 text-xs font-mono">Loading problem…</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center gap-4">
        <p className="text-rose-400 font-mono">{fetchError}</p>
        <NavLink to={`/admin/update/${problem._id}`} className="btn btn-sm bg-indigo-600 border-0 text-white">
          ← Back to Problems
        </NavLink>
      </div>
    );
  }

  
  return (
    <div className="min-h-screen bg-[#0d1117]">
      {/* Background grid */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(99,102,241,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-mono shadow-2xl transition-all ${
          toast.type === "success"
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            : "bg-rose-500/10 border-rose-500/30 text-rose-400"
        }`}>
          <span>{toast.type === "success" ? "✓" : "⚠"}</span>
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b border-zinc-800/60 bg-[#0d1117]/90 backdrop-blur px-6 py-3 flex items-center justify-between">
        <span className="text-xl font-black tracking-tight text-white">
          DSA<span className="text-indigo-400">ARENA</span>
          <span className="ml-3 text-xs font-mono font-normal text-zinc-500 border border-zinc-700 px-2 py-0.5 rounded">
            Update Problem
          </span>
        </span>
        <div className="flex items-center gap-2">
          <NavLink to="/admin/delete" className="btn btn-xs bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white font-mono">
            ← Manage Problems
          </NavLink>
          <NavLink to="/" className="btn btn-xs bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white font-mono">
            Home
          </NavLink>
        </div>
      </nav>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="relative max-w-3xl mx-auto px-4 py-10 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-3xl font-black text-white">Update Problem</h1>
            <p className="text-zinc-600 text-sm font-mono mt-1">
              Editing problem ID: <span className="text-indigo-400">{id}</span>
            </p>
          </div>
          {/* Diff indicator */}
          <div className="text-xs font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 rounded-lg">
            ✏ Edit mode
          </div>
        </div>

        {/* Server error detail */}
        {serverError && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 space-y-2">
            <p className="text-rose-400 font-mono text-xs font-bold uppercase tracking-wider">Server Error</p>
            <p className="text-rose-300 text-sm font-mono">{serverError.message}</p>
            {serverError.status         && <p className="text-zinc-400 text-xs font-mono">Status: {serverError.status}</p>}
            {serverError.stderr         && <pre className="text-rose-300 text-xs font-mono bg-black/30 rounded p-2 mt-1 overflow-x-auto">{serverError.stderr}</pre>}
            {serverError.compile_output && <pre className="text-rose-300 text-xs font-mono bg-black/30 rounded p-2 mt-1 overflow-x-auto">{serverError.compile_output}</pre>}
            {serverError.stdout         && <p className="text-zinc-400 text-xs font-mono">Your output: {serverError.stdout}</p>}
            {serverError.expected       && <p className="text-zinc-400 text-xs font-mono">Expected: {serverError.expected}</p>}
            <button type="button" onClick={() => setServerError(null)} className="text-xs text-rose-500 hover:text-rose-400">Dismiss</button>
          </div>
        )}

        {/* ── 1. Basic Info ── */}
        <Section title="Basic Information" subtitle="Title, description, difficulty and tags">

          <Field label="Title" error={errors.title?.message}>
            <input {...register("title")} placeholder="e.g. Two Sum" className={inputCls(errors.title)} />
          </Field>

          <Field label="Description" error={errors.description?.message}>
            <textarea {...register("description")} placeholder="Describe the problem clearly…" rows={5} className={areaCls(errors.description)} />
          </Field>

          {/* Difficulty pill selector */}
          <Field label="Difficulty" error={errors.difficulty?.message}>
            <div className="flex gap-2">
              {DIFFICULTY_OPTIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setValue("difficulty", d.value, { shouldValidate: true })}
                  className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                    watchDifficulty === d.value
                      ? d.color
                      : "text-zinc-600 border-zinc-800 bg-zinc-900 hover:border-zinc-600"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </Field>

          {/* Tags */}
          <Field label="Tags" error={errors.tags?.message}>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map((tag) => (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => toggleTag(tag.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono border transition-all ${
                    selectedTags.includes(tag.value)
                      ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                      : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400"
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </Field>
        </Section>

        {/* ── 2. Visible Test Cases ── */}
        <Section title="Visible Test Cases" subtitle="Shown to users as examples on the problem page">
          <div className="space-y-3">
            {visibleFields.map((field, index) => (
              <div key={field.id} className="bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-500 font-bold">Case {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeVisible(index)}
                    className="text-xs font-mono text-rose-500 hover:text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Input" error={errors.visibleTestCases?.[index]?.input?.message}>
                    <textarea {...register(`visibleTestCases.${index}.input`)} placeholder="Input value" rows={2} className={areaCls(errors.visibleTestCases?.[index]?.input)} />
                  </Field>
                  <Field label="Output" error={errors.visibleTestCases?.[index]?.output?.message}>
                    <textarea {...register(`visibleTestCases.${index}.output`)} placeholder="Expected output" rows={2} className={areaCls(errors.visibleTestCases?.[index]?.output)} />
                  </Field>
                </div>
                <Field label="Explanation (optional)">
                  <input {...register(`visibleTestCases.${index}.explanation`)} placeholder="Brief explanation" className={inputCls(false)} />
                </Field>
              </div>
            ))}

            {errors.visibleTestCases?.message && (
              <p className="text-xs text-rose-400 font-mono">⚠ {errors.visibleTestCases.message}</p>
            )}

            <button
              type="button"
              onClick={() => appendVisible({ input: "", output: "", explanation: "" })}
              className="w-full py-2.5 border border-dashed border-zinc-700 rounded-xl text-xs font-mono text-zinc-500 hover:border-indigo-500/50 hover:text-indigo-400 transition-colors"
            >
              + Add Visible Test Case
            </button>
          </div>
        </Section>

        {/* ── 3. Hidden Test Cases ── */}
        <Section title="Hidden Test Cases" subtitle="Used for judging — not shown to users">
          <div className="space-y-3">
            {hiddenFields.map((field, index) => (
              <div key={field.id} className="bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-500 font-bold">Case {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeHidden(index)}
                    className="text-xs font-mono text-rose-500 hover:text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Input" error={errors.hiddenTestCases?.[index]?.input?.message}>
                    <textarea {...register(`hiddenTestCases.${index}.input`)} placeholder="Input value" rows={2} className={areaCls(errors.hiddenTestCases?.[index]?.input)} />
                  </Field>
                  <Field label="Output" error={errors.hiddenTestCases?.[index]?.output?.message}>
                    <textarea {...register(`hiddenTestCases.${index}.output`)} placeholder="Expected output" rows={2} className={areaCls(errors.hiddenTestCases?.[index]?.output)} />
                  </Field>
                </div>
              </div>
            ))}

            {errors.hiddenTestCases?.message && (
              <p className="text-xs text-rose-400 font-mono">⚠ {errors.hiddenTestCases.message}</p>
            )}

            <button
              type="button"
              onClick={() => appendHidden({ input: "", output: "" })}
              className="w-full py-2.5 border border-dashed border-zinc-700 rounded-xl text-xs font-mono text-zinc-500 hover:border-indigo-500/50 hover:text-indigo-400 transition-colors"
            >
              + Add Hidden Test Case
            </button>
          </div>
        </Section>

        {/* ── 4. Code Templates ── */}
        <Section title="Code Templates" subtitle="Starter code and reference solution for all 3 languages">
          <div className="space-y-8">
            {LANGUAGES.map((lang, index) => (
              <div key={lang.value} className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-base">{lang.icon}</span>
                  <span className="text-sm font-bold text-zinc-300 font-mono">{lang.label}</span>
                  <div className="flex-1 h-px bg-zinc-800" />
                </div>

                {/* Hidden language fields */}
                <input type="hidden" {...register(`startCode.${index}.language`)} />
                <input type="hidden" {...register(`referenceSolution.${index}.language`)} />

                <Field label="Starter / Initial Code" error={errors.startCode?.[index]?.initialCode?.message}>
                  <textarea
                    {...register(`startCode.${index}.initialCode`)}
                    placeholder={`// ${lang.label} starter template shown in editor`}
                    rows={7}
                    className={monoAreaCls(errors.startCode?.[index]?.initialCode)}
                  />
                </Field>

                <Field label="Reference Solution" error={errors.referenceSolution?.[index]?.completeCode?.message}>
                  <textarea
                    {...register(`referenceSolution.${index}.completeCode`)}
                    placeholder={`// ${lang.label} complete working solution`}
                    rows={7}
                    className={monoAreaCls(errors.referenceSolution?.[index]?.completeCode)}
                  />
                </Field>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Action buttons ── */}
        <div className="flex gap-3">
          <NavLink
            to="/admin/delete"
            className="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-zinc-400 hover:text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            Cancel
          </NavLink>

          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-black font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                Validating &amp; Updating…
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Update Problem
              </>
            )}
          </button>
        </div>

        <p className="text-center text-zinc-700 text-xs font-mono pb-4">
          Updating will re-run your reference solution against all test cases via Judge0.
        </p>
      </form>
    </div>
  );
}