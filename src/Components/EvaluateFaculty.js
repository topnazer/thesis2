import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom'; // Import useNavigate and useLocation
import { getFirestore, doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { auth } from '../firebase';

const EvaluateFaculty = () => {
  const { facultyId } = useParams(); 
  const navigate = useNavigate(); // Initialize useNavigate
  const location = useLocation(); // Initialize useLocation
  const [faculty, setFaculty] = useState(null); 
  const [evaluationForm, setEvaluationForm] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [responses, setResponses] = useState([]);
  const [comment, setComment] = useState(""); 
  const db = getFirestore();

  const fetchFaculty = useCallback(async () => {
    try {
      const facultyDoc = await getDoc(doc(db, 'users', facultyId));
      if (facultyDoc.exists()) {
        setFaculty(facultyDoc.data());
      } else {
        setError('Faculty member not found.');
      }
    } catch (error) {
      setError('Error fetching faculty: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [db, facultyId]);

  const fetchEvaluationForm = useCallback(async () => {
    try {
      const evaluationDoc = await getDoc(doc(db, 'facultyEvaluations', 'default'));
      if (evaluationDoc.exists()) {
        setEvaluationForm(evaluationDoc.data().questions);
      } else {
        setError('No evaluation form found for faculty.');
      }
    } catch (error) {
      setError('Error fetching evaluation form: ' + error.message);
    }
  }, [db]);

  useEffect(() => {
    fetchFaculty();
    fetchEvaluationForm();
  }, [fetchFaculty, fetchEvaluationForm]);

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
      alert('User not authenticated.');
      return;
    }

    try {
      const evaluationRef = doc(collection(db, 'facultyEvaluations', facultyId, 'completed_evaluations'), user.uid);

      await setDoc(evaluationRef, {
        userId: user.uid,
        facultyId: facultyId,
        scores: responses,
        comment: comment,
        percentageScore,
        createdAt: new Date(),
      });

      alert('Evaluation submitted successfully!');
      
      // Navigate back to the Faculty Dashboard
      navigate(location.state?.redirectTo || "/faculty-dashboard");
    } catch (error) {
      alert('Failed to submit evaluation. Please try again.');
    }
  };

  if (loading) {
    return <p>Loading faculty data...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <h1>Evaluate {faculty ? `${faculty.firstName} ${faculty.lastName}` : 'Faculty'}</h1>
      <h2>Department: {faculty ? faculty.department : 'No department available'}</h2>
      <form onSubmit={handleSubmit}>
        {evaluationForm.map((question, index) => (
          <div key={index}>
            <label>{question.text}</label>
            <select
              value={responses[index] || ''}
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

export default EvaluateFaculty;
