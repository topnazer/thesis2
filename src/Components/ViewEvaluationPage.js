import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom'; // Import useNavigate
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const ViewEvaluationPage = () => {
  const { facultyId } = useParams(); // Get the facultyId from the route
  const location = useLocation(); // To get the passed state (firstName, lastName)
  const navigate = useNavigate(); // Initialize useNavigate to go back
  
  // Fallback to 'N/A' if location.state or the properties are missing
  const firstName = location.state?.firstName || 'N/A';
  const lastName = location.state?.lastName || 'N/A';

  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const db = getFirestore();

  // Fetch evaluations for the facultyId
  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        setLoading(true);
        const evaluationsSnapshot = await getDocs(collection(db, `facultyEvaluations/${facultyId}/completed_evaluations`));
        const evaluationData = [];
        evaluationsSnapshot.forEach((doc) => {
          evaluationData.push({ id: doc.id, ...doc.data() });
        });
        setEvaluations(evaluationData);
      } catch (error) {
        setError("Failed to fetch evaluations.");
        console.error("Error fetching evaluations:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvaluations();
  }, [facultyId, db]);

  if (loading) return <p>Loading evaluations...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h1>Evaluation Details for Faculty: {firstName} {lastName}</h1>
      {evaluations.length > 0 ? (
        evaluations.map((evaluation) => (
          <div key={evaluation.id} style={{ marginBottom: '20px' }}>
            <p><strong>Date:</strong> {new Date(evaluation.createdAt.seconds * 1000).toLocaleDateString()}</p>
            <p><strong>Percentage Score:</strong> {evaluation.percentageScore}</p>
            <p><strong>Rating:</strong> {evaluation.percentageScore >= 80 ? 'Good' : 'Bad'}</p>
            <p><strong>Comment:</strong> {evaluation.comment}</p>
            <h3>Questions and Scores:</h3>
            <ul>
              {evaluation.scores.map((score, index) => (
                <li key={index}>
                  <strong>Question {index + 1}:</strong> {score}
                </li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        <p>No evaluations available for this faculty member.</p>
      )}

      {/* Back button to go to the previous page */}
      <button onClick={() => navigate(-1)} style={{ padding: '10px', marginTop: '20px' }}>Back to Faculty List</button>
    </div>
  );
};

export default ViewEvaluationPage;
