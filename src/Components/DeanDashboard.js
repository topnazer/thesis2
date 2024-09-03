import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { auth } from "../firebase";

const DeanDashboard = () => {
  const [facultyList, setFacultyList] = useState([]);
  const [evaluationReports, setEvaluationReports] = useState([]);
  const [evaluatorNames, setEvaluatorNames] = useState({});
  const navigate = useNavigate();
  const db = getFirestore();

  useEffect(() => {
    const fetchFacultyInDepartment = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const department = userDoc.data().department;

        const facultyQuery = query(
          collection(db, "users"),
          where("department", "==", department),
          where("role", "==", "Faculty")
        );

        onSnapshot(facultyQuery, (snapshot) => {
          setFacultyList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
      }
    };

    const fetchEvaluationReports = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const evaluationsCollection = collection(db, "deanEvaluations", user.uid, "completed_evaluations");
      const snapshot = await onSnapshot(evaluationsCollection, async (snapshot) => {
        const reports = snapshot.docs.map(doc => doc.data());
        setEvaluationReports(reports);

        const evaluatorIds = reports.map(report => report.userId);
        const namesToFetch = evaluatorIds.filter(id => !evaluatorNames[id]);
        const evaluatorNamesCopy = { ...evaluatorNames };

        // Fetch names for any evaluator IDs that haven't been fetched yet
        if (namesToFetch.length > 0) {
          const namePromises = namesToFetch.map(async (userId) => {
            const userDoc = await getDoc(doc(db, "users", userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              evaluatorNamesCopy[userId] = `${userData.firstName} ${userData.lastName}`;
            } else {
              evaluatorNamesCopy[userId] = "Unknown Evaluator";
            }
          });

          await Promise.all(namePromises);
          setEvaluatorNames(evaluatorNamesCopy);
        }
      });
    };

    fetchFacultyInDepartment();
    fetchEvaluationReports();
  }, [db, evaluatorNames]);

  const handleEvaluateFaculty = (facultyId) => {
    navigate(`/evaluate-faculty/${facultyId}`, {
      state: { redirectTo: "/dean-dashboard" }
    });
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div>
      <h1>Dean Dashboard</h1>
      <nav>
        <button onClick={handleSignOut}>Sign Out</button>
      </nav>
      <section>
        <h2>Evaluate Faculty</h2>
        <ul>
          {facultyList.map((faculty) => (
            <li key={faculty.id}>
              {faculty.firstName} {faculty.lastName}
              <button onClick={() => handleEvaluateFaculty(faculty.id)}>Evaluate</button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Evaluation Report</h2>
        {evaluationReports.length > 0 ? (
          <ul>
            {evaluationReports.map((report, index) => (
              <li key={index}>
                <p>Evaluator: {evaluatorNames[report.userId] || report.userId}</p>
                <p>Average Score: {report.percentageScore.toFixed(2)}%</p>
                <p>Comments: {report.comment}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No evaluations submitted yet.</p>
        )}
      </section>
    </div>
  );
};

export default DeanDashboard;
