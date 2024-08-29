// File path: ./src/EvaluateSubject.js

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth } from "../firebase";

const EvaluateSubject = () => {
  const { subjectId } = useParams();
  const [subject, setSubject] = useState(null);
  const [faculty, setFaculty] = useState(null); // State for faculty details
  const [evaluationForm, setEvaluationForm] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [responses, setResponses] = useState([]);
  const [comment, setComment] = useState(""); // For comment/feedback
  const db = getFirestore();

  const fetchSubject = useCallback(async () => {
    try {
      const subjectDoc = await getDoc(doc(db, "subjects", subjectId));
      if (subjectDoc.exists()) {
        setSubject(subjectDoc.data());
        const facultyId = subjectDoc.data().facultyId;
        if (facultyId) {
          const facultyDoc = await getDoc(doc(db, "users", facultyId));
          if (facultyDoc.exists()) {
            setFaculty(facultyDoc.data());
          } else {
            setError("Faculty not found for the subject.");
          }
        }
      } else {
        setError("Subject not found");
      }
    } catch (error) {
      setError("Error fetching subject: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [db, subjectId]);

  const fetchEvaluationForm = useCallback(async () => {
    try {
      const evaluationDoc = await getDoc(doc(db, "evaluationForms", subjectId));
      if (evaluationDoc.exists()) {
        setEvaluationForm(evaluationDoc.data().questions);
      } else {
        setError("No evaluation form found for this subject.");
      }
    } catch (error) {
      setError("Error fetching evaluation form: " + error.message);
    }
  }, [db, subjectId]);

  useEffect(() => {
    fetchSubject();
    fetchEvaluationForm();
  }, [fetchSubject, fetchEvaluationForm]);

  const handleResponseChange = (index, value) => {
    const updatedResponses = [...responses];
    updatedResponses[index] = value;
    setResponses(updatedResponses);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const totalScore = responses.reduce((sum, score) => sum + parseInt(score), 0);
    const maxScore = evaluationForm.length * 5;
    const percentageScore = (totalScore / maxScore) * 100;

    const user = auth.currentUser;

    if (!user) {
      alert("User not authenticated.");
      return;
    }

    try {
      const evaluationRef = doc(db, `students/${user.uid}/subjects/${subjectId}/completed_evaluations`, user.uid);

      await setDoc(evaluationRef, {
        userId: user.uid,
        subjectId,
        facultyId: subject?.facultyId || null, // Ensure facultyId is taken from subject data
        scores: responses,
        comment: comment, // Add comment to the evaluation
        percentageScore,
        createdAt: new Date(),
      });

      alert("Evaluation submitted successfully!");
    } catch (error) {
      alert("Failed to submit evaluation. Please try again.");
    }
  };

  if (loading) {
    return <p>Loading subject data...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <h1>Evaluate {subject.name}</h1>
      <h2>Faculty: {faculty ? `${faculty.firstName} ${faculty.lastName}` : "No faculty assigned"}</h2>
      <form onSubmit={handleSubmit}>
        {evaluationForm.map((question, index) => (
          <div key={index}>
            <label>{question.text}</label>
            <select
              value={responses[index] || ""}
              onChange={(e) => handleResponseChange(index, e.target.value)}
              required
            >
              <option value="" disabled>Select an option</option>
              <option value="1">Strongly Agree</option>
              <option value="2">Agree</option>
              <option value="3">Neutral</option>
              <option value="4">Disagree</option>
              <option value="5">Strongly Disagree</option>
            </select>
          </div>
        ))}
        <div>
          <label>Comments/Feedback</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Enter your comments about the faculty here"
          />
        </div>
        <button type="submit">Submit Evaluation</button>
      </form>
    </div>
  );
};

export default EvaluateSubject;
