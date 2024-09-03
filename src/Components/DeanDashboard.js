// File path: ./src/DeanDashboard.js

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, getDoc, collection, onSnapshot, doc, query, where } from "firebase/firestore";
import { auth } from "../firebase";

const DeanDashboard = () => {
  const [facultyList, setFacultyList] = useState([]);
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

    fetchFacultyInDepartment();
  }, [db]);

  const handleEvaluateFaculty = (facultyId) => {
    navigate(`/evaluate-faculty/${facultyId}`, {
      state: { redirectTo: "/dean-dashboard" } // Redirect back to Dean Dashboard
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
    </div>
  );
};

export default DeanDashboard;
