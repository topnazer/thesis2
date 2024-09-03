import React, { useState, useEffect, useCallback } from 'react';
import { getFirestore, doc, setDoc, collection, getDocs, getDoc } from "firebase/firestore";

const EvaluationToolsPage = () => {
  const [selectedUserEvaluations, setSelectedUserEvaluations] = useState([]);
  const [evaluationForms, setEvaluationForms] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [facultyQuestions, setFacultyQuestions] = useState([]); // For faculty evaluation form
  const [deanQuestions, setDeanQuestions] = useState([]); // For dean evaluation form
  const [currentFormType, setCurrentFormType] = useState(""); // To track current form type
  const db = getFirestore();

  // Fetch subjects from Firestore
  const fetchSubjects = useCallback(async () => {
    try {
      const subjectsCollection = collection(db, "subjects");
      const subjectsSnapshot = await getDocs(subjectsCollection);
      const subjectsList = subjectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSubjects(subjectsList);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  }, [db]);

  // Fetch the existing faculty evaluation form
  const fetchFacultyEvaluationForm = useCallback(async () => {
    try {
      const facultyEvaluationDoc = await getDoc(doc(db, "facultyEvaluations", "default"));
      if (facultyEvaluationDoc.exists()) {
        setFacultyQuestions(facultyEvaluationDoc.data().questions);
      } else {
        setFacultyQuestions([]); // Initialize if no form exists
      }
    } catch (error) {
      console.error("Error fetching faculty evaluation form:", error);
    }
  }, [db]);

  // Fetch the existing dean evaluation form
  const fetchDeanEvaluationForm = useCallback(async () => {
    try {
      const deanEvaluationDoc = await getDoc(doc(db, "deanEvaluations", "default"));
      if (deanEvaluationDoc.exists()) {
        setDeanQuestions(deanEvaluationDoc.data().questions);
      } else {
        setDeanQuestions([]); // Initialize if no form exists
      }
    } catch (error) {
      console.error("Error fetching dean evaluation form:", error);
    }
  }, [db]);

  // Add a new question to the selected evaluation form
  const addQuestion = () => {
    if (!newQuestion.trim()) return;

    if (currentFormType === "Subject" && selectedSubject) {
      setEvaluationForms((prevForms) => ({
        ...prevForms,
        [selectedSubject]: [...(prevForms[selectedSubject] || []), { text: newQuestion }],
      }));
    } else if (currentFormType === "Faculty") {
      setFacultyQuestions([...facultyQuestions, { text: newQuestion }]);
    } else if (currentFormType === "Dean") {
      setDeanQuestions([...deanQuestions, { text: newQuestion }]);
    }

    setNewQuestion("");
  };

  // Delete a question from the selected evaluation form
  const deleteQuestion = (index) => {
    if (currentFormType === "Subject" && selectedSubject) {
      setEvaluationForms((prevForms) => {
        const updatedQuestions = prevForms[selectedSubject].filter((_, i) => i !== index);
        return {
          ...prevForms,
          [selectedSubject]: updatedQuestions,
        };
      });
    } else if (currentFormType === "Faculty") {
      setFacultyQuestions(facultyQuestions.filter((_, i) => i !== index));
    } else if (currentFormType === "Dean") {
      setDeanQuestions(deanQuestions.filter((_, i) => i !== index));
    }
  };

  // Save the evaluation form to Firestore
  const handleSaveForm = async () => {
    if (currentFormType === "Subject" && selectedSubject) {
      const formRef = doc(db, "evaluationForms", selectedSubject);
      await setDoc(formRef, { questions: evaluationForms[selectedSubject] || [] });
      alert("Subject evaluation form saved successfully!");
    } else if (currentFormType === "Faculty") {
      const facultyFormRef = doc(db, "facultyEvaluations", "default");
      await setDoc(facultyFormRef, { questions: facultyQuestions });
      alert("Faculty evaluation form saved successfully!");
    } else if (currentFormType === "Dean") {
      const deanFormRef = doc(db, "deanEvaluations", "default");
      await setDoc(deanFormRef, { questions: deanQuestions });
      alert("Dean evaluation form saved successfully!");
    }
  };

  useEffect(() => {
    fetchSubjects();
    fetchFacultyEvaluationForm(); // Fetch faculty evaluation form on mount
    fetchDeanEvaluationForm(); // Fetch dean evaluation form on mount
  }, [fetchSubjects, fetchFacultyEvaluationForm, fetchDeanEvaluationForm]);

  return (
    <div>
      <h2>Evaluation Reports</h2>
      {selectedUserEvaluations.length === 0 ? (
        <p>No evaluations found for the selected user.</p>
      ) : (
        <ul>
          {selectedUserEvaluations.map((evaluation, index) => (
            <li key={index}>
              <p>Score: {evaluation.percentageScore}%</p>
              <p>Details: {evaluation.scores.join(", ")}</p>
            </li>
          ))}
        </ul>
      )}

      <h2>Create or Edit Evaluation Form for Subjects</h2>
      <div>
        <label htmlFor="subjectSelect">Select Subject:</label>
        <select
          id="subjectSelect"
          value={selectedSubject}
          onChange={(e) => {
            setSelectedSubject(e.target.value);
            setCurrentFormType("Subject");
          }}
        >
          <option value="" disabled>Select a subject</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>

      {selectedSubject && currentFormType === "Subject" && (
        <div>
          <ul>
            {(evaluationForms[selectedSubject] || []).map((question, index) => (
              <li key={index}>
                {question.text}
                <button onClick={() => deleteQuestion(index)}>Delete</button>
              </li>
            ))}
          </ul>
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Add a new question"
          />
          <button onClick={addQuestion}>Add Question</button>
          <button onClick={handleSaveForm}>Save Form</button>
        </div>
      )}

      <h2>Create or Edit Evaluation Form for Faculty</h2>
      <div>
        <ul>
          {facultyQuestions.map((question, index) => (
            <li key={index}>
              {question.text}
              <button onClick={() => deleteQuestion(index)}>Delete</button>
            </li>
          ))}
        </ul>
        <input
          type="text"
          value={newQuestion}
          onChange={(e) => {
            setNewQuestion(e.target.value);
            setCurrentFormType("Faculty");
          }}
          placeholder="Add a new question"
        />
        <button onClick={addQuestion}>Add Question</button>
        <button onClick={handleSaveForm}>Save Form</button>
      </div>

      <h2>Create or Edit Evaluation Form for Deans</h2>
      <div>
        <ul>
          {deanQuestions.map((question, index) => (
            <li key={index}>
              {question.text}
              <button onClick={() => deleteQuestion(index)}>Delete</button>
            </li>
          ))}
        </ul>
        <input
          type="text"
          value={newQuestion}
          onChange={(e) => {
            setNewQuestion(e.target.value);
            setCurrentFormType("Dean");
          }}
          placeholder="Add a new question"
        />
        <button onClick={addQuestion}>Add Question</button>
        <button onClick={handleSaveForm}>Save Form</button>
      </div>
    </div>
  );
};

export default EvaluationToolsPage;
