const {getLanguageById,submitBatch,submitToken} = require('../utils/problemUtility');
const Problem = require('../models/problem');
const User = require('../models/user');
const Submission = require('../models/submission');


const createProblem = async (req, res) => {
  try {
    const {
      title,
      description,
      difficulty,
      tags,
      visibleTestCases = [],
      hiddenTestCases = [],
      startCode,
      referenceSolution = []
    } = req.body;

  
    if (!req.result) {
  return res.status(401).json({ message: "Unauthorized" });
}

  
    if (!referenceSolution.length) {
      return res.status(400).json({
        message: "Reference solution required"
      });
    }

    
    for (const { language, completeCode } of referenceSolution) {

      const languageId = getLanguageById(language);

      if (!languageId) {
        return res.status(400).json({
          message: `Unsupported language: ${language}`
        });
      }

      const submissions = visibleTestCases.map((testcase) => ({
        source_code: completeCode,
        language_id: languageId,
        stdin: testcase.input,
        expected_output: testcase.output,
      }));

      const submitResult = await submitBatch(submissions);

      const resultToken = submitResult.map((val) => val.token);

      const testResult = await submitToken(resultToken);

      for (const test of testResult) {
        if (test.status_id != 3) {
          return res.status(400).json({
            message: "Test case failed",
            status: test.status?.description,
            stdout: test.stdout,
            expected: test.expected_output,
            stderr: test.stderr,
            compile_output: test.compile_output,
          });
        }
      }
    }

  
    const problem = await Problem.create({
      title,
      description,
      difficulty,
      tags,
      visibleTestCases,
      hiddenTestCases,
      startCode,
      referenceSolution,
      problemCreator: req.result._id, 
    });

    res.status(201).json({
      message: "Problem created successfully",
      problem,
    });

  } catch (err) {
    console.error(err);
    res.status(400).json({
      message: err.message || "Something went wrong",
    });
  }
};

const updateProblem = async (req,res)=>{
   
const {id} =  req.params
 const {title ,description , difficulty , tags , visibleTestCases=[], hiddenTestCases=[], startCode,referenceSolution=[],problemCreator
   } = req.body;

try{
  if(!id){
   return res.status(400).send("Missing Id Field")
  }
  
  const dsaProblem = await Problem.findById(id);

  if(!dsaProblem){
    return res.status(404).send("Id is not present in server");
  }
 
   for(const {language,completeCode} of referenceSolution){

      // source code
      // language id
      // stdin
      // expoutput

      const languageId = getLanguageById(language);

      const submissions = visibleTestCases.map((testcase)=>({
        source_code:completeCode,
        language_id:languageId,
        stdin:testcase.input,
        expected_output:testcase.output
      }));


      const submitResult = await submitBatch(submissions);


      const resultToken = submitResult.map((value)=> value.token);



      const testResult = await submitToken(resultToken);

      
      for (const test of testResult) {
      console.log("Full Test:", test); 

  if (test.status_id != 3) {
    return res.status(400).json({
      message: "Error Occured",
      status: test.status?.description,
      stdout: test.stdout,
      expected: test.expected_output,
      stderr: test.stderr,
      compile_output: test.compile_output
    });
  }
};

     


    }
  
  const newProblem =  await Problem.findByIdAndUpdate(id,{...req.body}, {runValidators:true,new:true});

  res.status(200).send(newProblem)
}
catch(err){
   res.status(404).send("error:"+err);
}
}

const deleteProblem = async (req, res) => {
  const { id } = req.params;

  try {
    if (!id) {
      return res.status(400).send("Id is Missing");
    }

    const deletedProblem = await Problem.findByIdAndDelete(id); 

    if (!deletedProblem) {
      return res.status(404).send("Problem not found");
    }

    console.log("Deleted:", deletedProblem); 

    res.status(200).send("Successfully deleted");
  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
};

const getProblemById = async (req,res)=>{
  
  const {id} = req.params;

  try{
    
    if(!id){
      return res.status(400).send("Id is Missing");
    }

  
    const getProblem = await Problem.findById(id).select('_id title description tags difficulty visibleTestCases startCode referenceSolution');

  if(!getProblem)
    return res.status(404).send("Problem is missing");

  res.status(200).send(getProblem);
  }
  catch(err){
    res.status(500).send("Error:"+err);
  }
}

const getAllProblem = async (req,res)=>{
  

  try{
    
    const getProblem = await Problem.find({}).select('_id title difficulty tags');

  if(getProblem.length==0)
    return res.status(404).send("Problem is missing");

  res.status(200).send(getProblem);
  }
  catch(err){
    res.status(500).send("Error:"+err);
  }
}

const solvedAllProblemByUser = async (req,res)=>{
     
  try{
    
   const userId = req.result._id;

   const user = await User.findById(userId).populate({
    path:"problemSolved",
    select:"_id title difficulty tags"
   });

   res.status(200).send(user.problemSolved);



  }
  catch(err){
  res.status(500).send("Server Error:"+err);
  }
}

const submittedProblem = async (req, res) => {
  try {
    const userId = req.result._id;
    const problemId = req.params.pid;

    const ans = await Submission.find({ userId, problemId }).sort({ createdAt: -1 });

    return res.status(200).json(ans); 

  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {createProblem,updateProblem,deleteProblem,getProblemById,getAllProblem,solvedAllProblemByUser,submittedProblem};