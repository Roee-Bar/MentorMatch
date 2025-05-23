/**
 * This module provides controller functions for managing projects in a Firestore database.
 * It includes the following functionalities:
 * 
 * 1. Add a new project:
 *    - Adds a new project to the Firestore database.
 * 
 * 2. Get details of a specific project:
 *    - Retrieves the details of a specific project using its unique project code.
 * 
 * 3. Get all projects:
 *    - Fetches all project records from the Firestore database.
 * 
 * 4. Update a project:
 *    - Updates the details of a specific project based on its project code.
 * 
 * 5. Delete a project:
 *    - Deletes a project based on its unique project code.
 * 
 * 6. Set a global deadline and notify supervisors:
 *    - Sets a global deadline for all projects and sends notification emails to supervisors.
 * 
 * The module uses Firebase Admin SDK to interact with Firestore, and a custom email service to send emails.
 */
const admin = require("firebase-admin");
const { sendEmail } = require("../utils/emailService");
const mustache = require("mustache");
const { appendDoNotReply } = require("../utils/emailUtils");

// Add a new project
exports.addProject = async (req, res) => {
  const { projectCode, data } = req.body;

  try {
    if (!projectCode || !data) {
      return res.status(400).json({ error: "Project code and data are required" });
    }

    // Add the project to the "projects" collection
    await admin.firestore().collection("projects").doc(projectCode).set(data);
    res.status(201).json({ message: "Project added successfully" });
  } catch (error) {
    console.error("Error adding project:", error);
    res.status(500).json({ error: "Failed to add project" });
  }
};

// Get details of a specific project
exports.getProject = async (req, res) => {
  const { projectCode } = req.params;
  console.log("Received projectCode:", projectCode); // Log projectCode

  try {
    if (!projectCode) {
      return res.status(400).json({ error: "Project code is required" });
    }

    const projectDoc = await admin.firestore().collection("projects").doc(projectCode).get();
    console.log("Firestore query result exists:", projectDoc.exists); // Log query result

    if (!projectDoc.exists) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Include students and supervisor details if needed
    const projectData = projectDoc.data();
    console.log("Retrieved project data:", projectData); // Log project data

    res.status(200).json(projectData);
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
};


// Get all projects
exports.getAllProjects = async (req, res) => {
  try {
      const projectsSnapshot = await admin.firestore().collection("projects").get();

      // If no documents exist, return an empty array
      if (projectsSnapshot.empty) {
          console.log("No projects found in Firestore.");
          return res.status(200).json([]);
      }

      const projects = projectsSnapshot.docs.map((doc) => {
          const projectData = doc.data();

          // Transform individual student fields into an array
          const students = [];
          if (projectData.Student1) students.push({ id: projectData.Student1.ID, name: projectData.Student1.fullName });
          if (projectData.Student2) students.push({ id: projectData.Student2.ID, name: projectData.Student2.fullName });

          return {
              projectCode: doc.id,
              ...projectData,
              students, // Replace separate student fields with the array
          };
      });

      res.status(200).json(projects);
  } catch (error) {
      console.error("Error fetching projects:", error.message);
      res.status(500).json({ error: "Failed to fetch projects" });
  }
};

// Update a project
exports.updateProject = async (req, res) => {
  const { projectCode } = req.params;
  const data = req.body;

  try {
    if (!projectCode || !data) {
      return res.status(400).json({ error: "Project code and data are required" });
    }

    await admin.firestore().collection("projects").doc(projectCode).update(data);
    res.status(200).json({ message: "Project updated successfully" });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
};

// Delete a project
exports.deleteProject = async (req, res) => {
  const { projectCode } = req.params;

  try {
    if (!projectCode) {
      return res.status(400).json({ error: "Project code is required" });
    }

    await admin.firestore().collection("projects").doc(projectCode).delete();
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: "Failed to delete project" });
  }
};


// Email template for notifying about global deadlines
const emailTemplate = "A new deadline has been set for project submissions. Please log in to the system to view the details.";

exports.setGlobalDeadlineAndNotify = async (req, res) => {
  const { deadline, emailMessage, supervisorEmails } = req.body;

  // Ensure that deadline and supervisorEmails are provided
  if (!deadline) {
    return res.status(400).json({ error: "Deadline is required" });
  }
  if (!supervisorEmails || !Array.isArray(supervisorEmails) || supervisorEmails.length === 0) {
    return res.status(400).json({ error: "Supervisor emails are required" });
  }

  try {
    // Update all project deadlines
    const projectsRef = admin.firestore().collection("projects");
    const snapshot = await projectsRef.get();
    const batch = admin.firestore().batch();
    snapshot.forEach(doc => {
      batch.update(doc.ref, {
        deadline: new admin.firestore.Timestamp(Math.floor(deadline / 1000), 0)
      });
    });
    await batch.commit();

    // Use the provided custom email message or a default template
    const emailBody = appendDoNotReply(emailMessage || emailTemplate);

    // Send emails to each unique supervisor email provided in the payload
    await Promise.all(
      supervisorEmails.map(email => sendEmail(email, "New Deadline Notification", emailBody))
    );

    res.status(200).json({ message: "Global deadline set and emails sent successfully." });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Failed to set global deadline and notify supervisors." });
  }
};

