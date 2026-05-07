const Problem = require('../models/problem');
const Submission = require('../models/submission');
const { getLanguageById, submitBatch, submitToken } = require('../utils/problemUtility');

const submitCode = async (req, res) => {
  try {
    const userId = req.result?._id;
    const problemId = req.params.id;
    const { code, language } = req.body;

    if (!userId || !code || !problemId || !language) {
      return res.status(400).send("Some field missing");
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).send("Problem not found");
    }

    const hiddenTestCases = Array.isArray(problem.hiddenTestCases)
      ? problem.hiddenTestCases
      : [];

    if (hiddenTestCases.length === 0) {
      return res.status(400).send("No hidden test cases found");
    }

    const languageId = getLanguageById(language);
    if (!languageId) {
      return res.status(400).send("Unsupported language");
    }

  
    const submittedResult = await Submission.create({
      userId,
      problemId,
      code,
      language,
      testCasesPassed: 0,
      status: "pending",
      testCasesTotal: hiddenTestCases.length,
    });

  
    const submissions = hiddenTestCases.map((tc) => ({
      source_code: code,
      language_id: languageId,
      stdin: tc.input,
      expected_output: tc.output,
    }));

    const submitResult = await submitBatch(submissions);
    if (!submitResult || submitResult.length === 0) {
      return res.status(500).send("Judge0 submission failed");
    }

    const tokens = submitResult.map((v) => v.token);
    const testResult = await submitToken(tokens);
    if (!testResult || testResult.length === 0) {
      return res.status(500).send("Judge0 result fetch failed");
    }

    
    let status = "accepted";
    let testCasesPassed = 0;
    let totalRuntime = 0;
    let maxMemory = 0;
    let errorMessage = null;

    for (const test of testResult) {
      const statusId = test.status?.id ?? test.status_id;

      if (statusId === 3) {
        testCasesPassed++;
        totalRuntime += parseFloat(test.time || 0);
        maxMemory = Math.max(maxMemory, test.memory || 0);
      } else {
        if (status === "accepted") {
          if (statusId === 6) {
            status = "error";
            errorMessage = test.compile_output || "Compilation Error";
          } else if (statusId === 5) {
            status = "Time Limit Exceeded";
            errorMessage = "Time Limit Exceeded";
          } else if (statusId === 4) {
            status = "Wrong Answer";
            errorMessage = test.stderr || "Wrong Answer";
          } else if (statusId >= 7 && statusId <= 12) {
            status = "Runtime Error";
            errorMessage = test.stderr || "Runtime Error";
          } else {
            status = "Wrong Answer";
            errorMessage = test.stderr || "Wrong Answer";
          }
        }
      }
    }

    const runtime = parseFloat(totalRuntime.toFixed(3));
    const memory = maxMemory;

    
    submittedResult.status = status;
    submittedResult.testCasesPassed = testCasesPassed;
    submittedResult.errorMessage = errorMessage;
    submittedResult.runtime = runtime;
    submittedResult.memory = memory;
    await submittedResult.save();

    
    const alreadySolved = req.result.problemSolved?.some(
      (id) => id.toString() === problemId.toString()
    );

    if (!alreadySolved && status === "accepted") {
      
      const User = require('../models/user');
      await User.findByIdAndUpdate(
        userId,
        { $addToSet: { problemSolved: problemId } }
      );
    }

    res.status(201).json(submittedResult);

  } catch (err) {
    console.error("submitCode error:", err);
    res.status(500).send("Internal server error: " + err.message);
  }
};

const runCode = async (req, res) => {
  try {
    const userId = req.result?._id;
    const problemId = req.params.id;
    const { code, language } = req.body;

    if (!userId || !code || !problemId || !language) {
      return res.status(400).send("Some field missing");
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).send("Problem not found");
    }

    const languageId = getLanguageById(language);
    if (!languageId) {
      return res.status(400).send("Unsupported language");
    }

    const visibleTestCases = Array.isArray(problem.visibleTestCases)
      ? problem.visibleTestCases
      : [];

    if (visibleTestCases.length === 0) {
      return res.status(400).send("No visible test cases found");
    }

    const submissions = visibleTestCases.map((testcase) => ({
      source_code: code,
      language_id: languageId,
      stdin: testcase.input,
      expected_output: testcase.output,
    }));

    const submitResult = await submitBatch(submissions);
    if (!submitResult || submitResult.length === 0) {
      return res.status(500).send("Judge0 submission failed");
    }

    const resultToken = submitResult.map((value) => value.token);
    const testResult = await submitToken(resultToken);

    if (!testResult) {
      return res.status(500).send("Judge0 result fetch failed");
    }

   
    const normalizedResult = testResult.map((r) => ({
      ...r,
      status_id: r.status?.id ?? r.status_id,  
    }));

    res.status(200).json(normalizedResult);

  } catch (err) {
    console.error("runCode error:", err);
    res.status(500).send("Internal server error: " + err.message);
  }
};

module.exports = { submitCode, runCode };