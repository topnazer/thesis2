// File path: ./src/Subjects.js

import React, { useState, useEffect } from "react";
import { getFirestore, collection, addDoc, deleteDoc, updateDoc, onSnapshot, doc, setDoc, query, where, getDocs } from "firebase/firestore";
import { auth } from "../firebase";

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [editSubjectName, setEditSubjectName] = useState("");
  const [subjectIdToEdit, setSubjectIdToEdit] = useState(null);
  const [userId, setUserId] = useState(""); // For assigning subject to a specific user
  const [role, setRole] = useState("student"); // Default role to assign subject to
  const [userEmail, setUserEmail] = useState(""); // Input for user email lookup
  const [foundUser, setFoundUser] = useState(null); // Stores the found user object
  const [facultyList, setFacultyList] = useState([]); // List of available faculty members
  const [selectedFaculty, setSelectedFaculty] = useState(""); // Selected faculty ID for a subject

  const db = getFirestore();

  useEffect(() => {
    // Fetch subjects
    const unsubscribe = onSnapshot(collection(db, "subjects"), (snapshot) => {
      const subjectsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSubjects(subjectsList);
    });

    // Fetch faculty members
    const fetchFacultyList = async () => {
      const q = query(collection(db, "users"), where("role", "==", "Faculty"));
      const querySnapshot = await getDocs(q);
      const facultyData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFacultyList(facultyData);
    };

    fetchFacultyList();

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [db]);

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) {
      alert("Subject name cannot be empty.");
      return;
    }

    if (!selectedFaculty) {
      alert("Please select a faculty member for this subject.");
      return;
    }

    try {
      await addDoc(collection(db, "subjects"), {
        name: newSubjectName,
        facultyId: selectedFaculty,
        createdAt: new Date(),
      });
      setNewSubjectName(""); // Clear input field
    } catch (error) {
      console.error("Error adding subject:", error);
    }
  };

  const handleEditSubject = async () => {
    if (!editSubjectName.trim()) {
      alert("Subject name cannot be empty.");
      return;
    }

    try {
      await updateDoc(doc(db, "subjects", subjectIdToEdit), {
        name: editSubjectName,
        facultyId: selectedFaculty,
      });
      setEditSubjectName("");
      setSubjectIdToEdit(null); // Reset edit mode
    } catch (error) {
      console.error("Error editing subject:", error);
    }
  };

  const handleDeleteSubject = async (id) => {
    try {
      await deleteDoc(doc(db, "subjects", id));
    } catch (error) {
      console.error("Error deleting subject:", error);
    }
  };

  const handleAssignSubjectToUser = async (subjectId) => {
    if (!foundUser) {
      alert("Please search for and select a user first.");
      return;
    }

    try {
      const userCollection = role === "student" ? "students" : "faculty";
      const subjectRef = doc(db, `${userCollection}/${foundUser.id}/subjects`, subjectId);

      await setDoc(subjectRef, {
        name: subjects.find((subject) => subject.id === subjectId).name,
        assignedAt: new Date(),
      });

      alert("Subject assigned successfully to the user!");
    } catch (error) {
      console.error("Error assigning subject:", error);
    }
  };

  const handleSearchUserByEmail = async () => {
    if (!userEmail.trim()) {
      alert("Please enter a user email.");
      return;
    }

    try {
      const usersQuery = query(collection(db, "users"), where("email", "==", userEmail));
      const querySnapshot = await getDocs(usersQuery);

      if (querySnapshot.empty) {
        alert("No user found with this email.");
        setFoundUser(null);
      } else {
        const userDoc = querySnapshot.docs[0];
        setFoundUser({ id: userDoc.id, ...userDoc.data() });
      }
    } catch (error) {
      console.error("Error searching for user:", error);
    }
  };

  return (
    <div>
      <h2>Manage Subjects</h2>

      {/* Add new subject */}
      <input
        type="text"
        value={newSubjectName}
        onChange={(e) => setNewSubjectName(e.target.value)}
        placeholder="New subject name"
      />
      <select
        value={selectedFaculty}
        onChange={(e) => setSelectedFaculty(e.target.value)}
      >
        <option value="">Select Faculty</option>
        {facultyList.map(faculty => (
          <option key={faculty.id} value={faculty.id}>
            {faculty.email}
          </option>
        ))}
      </select>
      <button onClick={handleAddSubject}>Add Subject</button>

      {/* Search user by email */}
      <div>
        <h3>Assign Subject to User</h3>
        <input
          type="text"
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
          placeholder="Enter user email"
        />
        <button onClick={handleSearchUserByEmail}>Search User</button>
        {foundUser && (
          <div>
            <p>User Found: {foundUser.email} (ID: {foundUser.id})</p>
            <select onChange={(e) => setRole(e.target.value)} value={role}>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </select>
          </div>
        )}
      </div>

      {/* List of subjects */}
      <ul>
        {subjects.map((subject) => (
          <li key={subject.id}>
            {subject.name} - {subject.facultyId ? facultyList.find(f => f.id === subject.facultyId)?.email : "No faculty assigned"}
            <button onClick={() => {
              setEditSubjectName(subject.name);
              setSubjectIdToEdit(subject.id);
              setSelectedFaculty(subject.facultyId);
            }}>Edit</button>
            <button onClick={() => handleDeleteSubject(subject.id)}>Delete</button>

            {/* Assign subject to found user */}
            {foundUser && (
              <button onClick={() => handleAssignSubjectToUser(subject.id)}>Assign to User</button>
            )}
          </li>
        ))}
      </ul>

      {/* Edit subject */}
      {subjectIdToEdit && (
        <div>
          <h3>Edit Subject</h3>
          <input
            type="text"
            value={editSubjectName}
            onChange={(e) => setEditSubjectName(e.target.value)}
            placeholder="Edit subject name"
          />
          <select
            value={selectedFaculty}
            onChange={(e) => setSelectedFaculty(e.target.value)}
          >
            <option value="">Select Faculty</option>
            {facultyList.map(faculty => (
              <option key={faculty.id} value={faculty.id}>
                {faculty.email}
              </option>
            ))}
          </select>
          <button onClick={handleEditSubject}>Update Subject</button>
        </div>
      )}
    </div>
  );
};

export default Subjects;
