import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom'; 
import { getFirestore, doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { auth } from "../firebase";
import './Evaluate.css'; // Add the new CSS file

const EvaluateSubject = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate(); 
  const location = useLocation(); 
  const [subject, setSubject] = useState(null);
  const [faculty, setFaculty] = useState(null);
  const [evaluationForm, setEvaluationForm] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [responses, setResponses] = useState([]);
  const [comment, setComment] = useState(""); 
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
        facultyId: subject?.facultyId || null,
        scores: responses,
        comment: comment,
        percentageScore,
        createdAt: new Date(),
      });

      alert("Evaluation submitted successfully!");
      
      navigate(location.state?.redirectTo || "/student-dashboard");
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
    <div className="evaluate-subject-page evaluation-form">
      <h1>Evaluate {subject.name}</h1>
      <h2>Faculty: {faculty ? `${faculty.firstName} ${faculty.lastName}` : "No faculty assigned"}</h2>
      <div className="rating-legend">
        <p>Rating Legend</p>
        <p>1 - Strongly Disagree | 2 - Disagree | 3 - Neutral | 4 - Agree | 5 - Strongly Agree</p>
      </div>
      <form onSubmit={handleSubmit}>
        <table>
          <thead>
            <tr>
              <th>Question</th>
              <th>1</th>
              <th>2</th>
              <th>3</th>
              <th>4</th>
              <th>5</th>
            </tr>
          </thead>
          <tbody>
            {evaluationForm.map((question, index) => (
              <tr key={index}>
                <td>{question.text}</td>
                {[1, 2, 3, 4, 5].map((value) => (
                  <td key={value}>
                    <input 
                      type="radio" 
                      name={`question-${index}`} 
                      value={value} 
                      checked={responses[index] === String(value)} 
                      onChange={(e) => handleResponseChange(index, e.target.value)} 
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div>
          <label>Comments/Feedback</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Enter your comments about the subject here"
          />
        </div>
        <button type="submit">Submit Evaluation</button>
      </form>
    </div>
  );
};

export default EvaluateSubject;
