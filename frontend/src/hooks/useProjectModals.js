import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Timestamp } from "firebase/firestore";


export const useProjectModals = (projects, setProjects) => {
  const [editModal, setEditModal] = useState({
    isOpen: false,
    field: '',
    fieldName: '',
    value: '',
    projectId: null,
    fieldType: 'text',
    options: [],
  });

  const [studentModal, setStudentModal] = useState({
    isOpen: false,
    student: null,
  });

  const [notesModal, setNotesModal] = useState({
    isOpen: false,
    project: null,
  });

  const handleEditField = (project, field, fieldName, fieldType = 'text', options = []) => {
    let fieldValue = project[field];
  
    
    if (typeof fieldValue === "object" && fieldValue !== null) {
      fieldValue = fieldValue.text || ""; 
    }
  
    setEditModal({
      isOpen: true,
      field,
      fieldName,
      value: fieldValue,
      projectId: project.id,
      fieldType,
      options,
    });
  
    console.log(`Editing ${field}:`, fieldValue); // Debugging Log
  };
  

 const handleSaveField = async (newValue) => {
    const { field, projectId, fieldType } = editModal;
    try {
      const projectRef = doc(db, "projects", projectId);
      let updatedValue = newValue;

      //  Convert to Firestore Timestamp if fieldType is 'date'
      if (fieldType === "date") {
        updatedValue = Timestamp.fromDate(new Date(newValue));
      }

      await updateDoc(projectRef, { [field]: updatedValue });

      setProjects((currentProjects) =>
        currentProjects.map((project) =>
          project.id === projectId ? { ...project, [field]: updatedValue } : project
        )
      );

      console.log(` Successfully updated ${field} for project ${projectId}`);

    } catch (error) {
      console.error(`Error updating project field (${field}):`, error);
    } finally {
      setEditModal({ ...editModal, isOpen: false });
    }
  };


  const handleStudentClick = (student) => {
    console.log("Student clicked:", student);
    setStudentModal({
      isOpen: true,
      student, 
    });
  };

  const closeStudentModal = () => {
    setStudentModal({
      isOpen: false,
      student: null,
    });
  };

  const handleAddNote = (project) => {
    setNotesModal({
      isOpen: true,
      project,
    });
  };

  const closeNotesModal = () => {
    setNotesModal({
      isOpen: false,
      project: null,
    });
  };

  return {
    editModal,
    setEditModal,
    handleEditField,
    handleSaveField,
    studentModal,
    handleStudentClick,
    closeStudentModal,
    notesModal,
    handleAddNote,
    closeNotesModal,
  };
};
