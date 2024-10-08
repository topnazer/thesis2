import React, { useState, useEffect, useCallback } from 'react';
import { getFirestore, doc, setDoc, collection, getDocs, getDoc } from "firebase/firestore";
import './evaluationtoolspage.css'; // Import the new CSS file

const EvaluationToolsPage = () => {
  const [evaluationForms, setEvaluationForms] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [facultyQuestions, setFacultyQuestions] = useState([]);
  const [deanQuestions, setDeanQuestions] = useState([]);
  const [currentFormType, setCurrentFormType] = useState("");
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

  const addQuestion = () => {
    if (!newQuestion.trim()) return;

    if (editingIndex !== null) {
      // Editing an existing question
      if (currentFormType === "Subject" && selectedSubject) {
        setEvaluationForms((prevForms) => {
          const updatedQuestions = [...(prevForms[selectedSubject] || [])];
          updatedQuestions[editingIndex].text = newQuestion;
          return { ...prevForms, [selectedSubject]: updatedQuestions };
        });
      } else if (currentFormType === "Faculty") {
        const updatedQuestions = [...facultyQuestions];
        updatedQuestions[editingIndex].text = newQuestion;
        setFacultyQuestions(updatedQuestions);
      } else if (currentFormType === "Dean") {
        const updatedQuestions = [...deanQuestions];
        updatedQuestions[editingIndex].text = newQuestion;
        setDeanQuestions(updatedQuestions);
      }
      setEditingIndex(null); // Clear the edit mode
    } else {
      // Adding a new question
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
    }

    setNewQuestion("");
  };

  const deleteQuestion = (index) => {
    if (currentFormType === "Subject" && selectedSubject) {
      setEvaluationForms((prevForms) => {
        const updatedQuestions = prevForms[selectedSubject].filter((_, i) => i !== index);
        return { ...prevForms, [selectedSubject]: updatedQuestions };
      });
    } else if (currentFormType === "Faculty") {
      setFacultyQuestions(facultyQuestions.filter((_, i) => i !== index));
    } else if (currentFormType === "Dean") {
      setDeanQuestions(deanQuestions.filter((_, i) => i !== index));
    }
  };

  const handleEditQuestion = (index) => {
    if (currentFormType === "Subject" && selectedSubject) {
      setNewQuestion(evaluationForms[selectedSubject][index].text);
    } else if (currentFormType === "Faculty") {
      setNewQuestion(facultyQuestions[index].text);
    } else if (currentFormType === "Dean") {
      setNewQuestion(deanQuestions[index].text);
    }
    setEditingIndex(index); // Set the index of the question being edited
  };

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
    fetchFacultyEvaluationForm();
    fetchDeanEvaluationForm();
  }, [fetchSubjects, fetchFacultyEvaluationForm, fetchDeanEvaluationForm]);

  return  (
    <div className="evaluation-page">
      <h2 className="evaluation-header">Create or Edit Evaluation Form for Subjects</h2>
      <div className="question-form">
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
  
        {selectedSubject && currentFormType === "Subject" && (
          <div>
            <ul className="questions-list">
              {(evaluationForms[selectedSubject] || []).map((question, index) => (
                <li key={index}>
                  {question.text}
                  <div className="operation-buttons">
                    <button className="edit-button" onClick={() => handleEditQuestion(index)}>Edit</button>
                    <button className="delete-button" onClick={() => deleteQuestion(index)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
            <textarea
              className="question-input"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder={editingIndex !== null ? "Edit the question" : "Add a new question"}
            />
            <div className="buttons-container">
              <button className="save-button" onClick={addQuestion}>
                {editingIndex !== null ? "Update Question" : "Add Question"}
              </button>
              <button className="cancel-button" onClick={() => setNewQuestion("")}>Cancel</button>
            </div>
            {/* Save form button for Subjects */}
            <button onClick={handleSaveForm}>Save Subject Form</button>
          </div>
        )}
      </div>
  
      <h2 className="evaluation-header">Create or Edit Evaluation Form for Faculty</h2>
      <div className="question-form">
        <ul className="questions-list">
          {facultyQuestions.map((question, index) => (
            <li key={index}>
              {question.text}
              <div className="operation-buttons">
                <button className="edit-button" onClick={() => handleEditQuestion(index)}>Edit</button>
                <button className="delete-button" onClick={() => deleteQuestion(index)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
        <textarea
          className="question-input"
          value={newQuestion}
          onChange={(e) => {
            setNewQuestion(e.target.value);
            setCurrentFormType("Faculty");
          }}
          placeholder={editingIndex !== null ? "Edit the question" : "Add a new question"}
        />
        <div className="buttons-container">
          <button className="save-button" onClick={addQuestion}>
            {editingIndex !== null ? "Update Question" : "Add Question"}
          </button>
          <button className="cancel-button" onClick={() => setNewQuestion("")}>Cancel</button>
        </div>
        {/* Save form button for Faculty */}
        <button onClick={handleSaveForm}>Save Faculty Form</button>
      </div>
  
      <h2 className="evaluation-header">Create or Edit Evaluation Form for Deans</h2>
      <div className="question-form">
        <ul className="questions-list">
          {deanQuestions.map((question, index) => (
            <li key={index}>
              {question.text}
              <div className="operation-buttons">
                <button className="edit-button" onClick={() => handleEditQuestion(index)}>Edit</button>
                <button className="delete-button" onClick={() => deleteQuestion(index)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
        <textarea
          className="question-input"
          value={newQuestion}
          onChange={(e) => {
            setNewQuestion(e.target.value);
            setCurrentFormType("Dean");
          }}
          placeholder={editingIndex !== null ? "Edit the question" : "Add a new question"}
        />
        <div className="buttons-container">
          <button className="save-button" onClick={addQuestion}>
            {editingIndex !== null ? "Update Question" : "Add Question"}
          </button>
          <button className="cancel-button" onClick={() => setNewQuestion("")}>Cancel</button>
        </div>
        {/* Save form button for Deans */}
        <button onClick={handleSaveForm}>Save Dean Form</button>
      </div>
    </div>
  );
};

export default EvaluationToolsPage;
