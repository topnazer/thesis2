import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getFirestore, doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { auth } from '../firebase';

const EvaluateDean = () => {
  const { deanId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [dean, setDean] = useState(null);
  const [evaluationForm, setEvaluationForm] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [responses, setResponses] = useState([]);
  const [comment, setComment] = useState("");
  const db = getFirestore();

  const fetchDean = useCallback(async () => {
    try {
      const deanDoc = await getDoc(doc(db, 'users', deanId));
      if (deanDoc.exists()) {
        setDean(deanDoc.data());
      } else {
        setError('Dean not found.');
      }
    } catch (error) {
      setError('Error fetching dean: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [db, deanId]);

  const fetchEvaluationForm = useCallback(async () => {
    try {
      const evaluationDoc = await getDoc(doc(db, 'deanEvaluations', 'default'));
      if (evaluationDoc.exists()) {
        setEvaluationForm(evaluationDoc.data().questions);
      } else {
        setError('No evaluation form found for dean.');
      }
    } catch (error) {
      setError('Error fetching evaluation form: ' + error.message);
    }
  }, [db]);

  useEffect(() => {
    fetchDean();
    fetchEvaluationForm();
  }, [fetchDean, fetchEvaluationForm]);

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
      // Store the evaluation in the completed_evaluations subcollection
      const evaluationRef = doc(collection(db, 'deanEvaluations', deanId, 'completed_evaluations'), user.uid);
      await setDoc(evaluationRef, {
        userId: user.uid,
        deanId: deanId,
        scores: responses,
        comment: comment,
        percentageScore,
        createdAt: new Date(),
      });

      // Update average score and completed evaluations in the main document
      const deanEvaluationRef = doc(db, 'deanEvaluations', deanId);
      const deanEvaluationDoc = await getDoc(deanEvaluationRef);
      let newAverageScore;

      if (deanEvaluationDoc.exists()) {
        const existingAverageScore = deanEvaluationDoc.data().averageScore || 0;
        const completedEvaluations = (deanEvaluationDoc.data().completedEvaluations || 0) + 1;
        newAverageScore = ((existingAverageScore * (completedEvaluations - 1)) + percentageScore) / completedEvaluations;

        await setDoc(deanEvaluationRef, {
          averageScore: newAverageScore,
          completedEvaluations,
        }, { merge: true });
      } else {
        // If no previous evaluations, set the first score as the average
        newAverageScore = percentageScore;
        await setDoc(deanEvaluationRef, {
          averageScore: newAverageScore,
          completedEvaluations: 1,
        });
      }

      alert('Evaluation submitted successfully!');
      navigate(location.state?.redirectTo || "/dean-dashboard");
    } catch (error) {
      alert('Failed to submit evaluation. Please try again.');
    }
  };

  if (loading) {
    return <p>Loading dean data...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <h1>Evaluate Dean {dean ? `${dean.firstName} ${dean.lastName}` : ''}</h1>
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
            placeholder="Enter your comments about the dean here"
          />
        </div>
        <button type="submit">Submit Evaluation</button>
      </form>
    </div>
  );
};

export default EvaluateDean;
