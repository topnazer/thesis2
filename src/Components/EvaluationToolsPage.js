// File path: ./src/EvaluationToolsPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { getFirestore, doc, setDoc, collection, getDocs } from "firebase/firestore";

const EvaluationToolsPage = () => {
  const [selectedUserEvaluations, setSelectedUserEvaluations] = useState([]);
  const [evaluationForms, setEvaluationForms] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const db = getFirestore();

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

  const addQuestion = () => {
    if (!newQuestion.trim()) return;
    setEvaluationForms((prevForms) => ({
      ...prevForms,
      [selectedSubject]: [...(prevForms[selectedSubject] || []), { text: newQuestion }],
    }));
    setNewQuestion("");
  };

  const deleteQuestion = (index) => {
    setEvaluationForms((prevForms) => {
      const updatedQuestions = prevForms[selectedSubject].filter((_, i) => i !== index);
      return {
        ...prevForms,
        [selectedSubject]: updatedQuestions,
      };
    });
  };

  const handleSaveForm = async () => {
    if (!selectedSubject) {
      alert("Please select a subject");
      return;
    }
    const formRef = doc(db, "evaluationForms", selectedSubject);
    await setDoc(formRef, { questions: evaluationForms[selectedSubject] || [] });
    alert("Evaluation form saved successfully!");
  };

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

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
      <label htmlFor="subjectSelect">Select Subject:</label>
      <select
        id="subjectSelect"
        value={selectedSubject}
        onChange={(e) => setSelectedSubject(e.target.value)}
      >
        <option value="" disabled>Select a subject</option>
        {subjects.map((subject) => (
          <option key={subject.id} value={subject.id}>
            {subject.name}
          </option>
        ))}
      </select>

      {selectedSubject && (
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
    </div>
  );
};

export default EvaluationToolsPage;
