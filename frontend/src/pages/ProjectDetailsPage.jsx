import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { projectsApi } from "../services/projectsAPI";
import { userApi } from "../services/userAPI.js";
import LoadingScreen from "../components/shared/LoadingScreen";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Users,
  Calendar,
  FileText,
  User,
} from "lucide-react";

// Helper function to format Firestore Timestamp
const formatDate = (timestamp) => {
  if (!timestamp || !timestamp._seconds) return "No deadline provided";
  const date = new Date(timestamp._seconds * 1000); // Convert seconds to milliseconds
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const ProjectDetailsPage = () => {
  const { projectCode } = useParams();
  const [project, setProject] = useState(null);
  const [supervisors, setSupervisors] = useState([]); // Supervisors fetched from DB
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        console.log("Fetching project for projectCode:", projectCode);
        const projectData = await projectsApi.getProject(projectCode);
        console.log("Fetched project data:", projectData);
        setProject(projectData);
  
        // Fetch supervisor details
        const supervisorEmails = [projectData.supervisor1, projectData.supervisor2].filter(Boolean); // Now using emails
        if (supervisorEmails.length > 0) {
          const supervisorDetails = await Promise.all(
            supervisorEmails.map((email) =>
              userApi.getUser(email).catch((error) => {
                console.error(`Error fetching supervisor with email ${email}:`, error);
                return { fullName: `Supervisor with email: ${email}`, topics: [] };
              })
            )
          );
          console.log("Fetched supervisor details:", supervisorDetails);
          setSupervisors(supervisorDetails);
        }
      } catch (err) {
        console.error("Error fetching project details:", err);
        setError(err.response?.data?.error || "Unable to fetch project");
      } finally {
        setLoading(false);
      }
    };
  
    fetchProjectDetails();
  }, [projectCode]);
  

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (loading) {
    return <LoadingScreen isLoading={loading}  description="Looking for project details..."/>; 
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg font-medium text-red-500">Error: {error}</p>
      </div>
    );
  }

  const DetailCard = ({ title, icon, children, expandable = false }) => {
    const isExpanded = expandedSections[title] !== false;
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 ease-in-out">
        <div
          className={`p-4 bg-gray-50 flex justify-between items-center cursor-pointer ${
            expandable ? "hover:bg-gray-100" : ""
          }`}
          onClick={() => expandable && toggleSection(title)}
        >
          <div className="flex items-center space-x-2">
            {icon}
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          </div>
          {expandable && (
            isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )
          )}
        </div>
        <div className={`p-4 ${expandable && !isExpanded ? "hidden" : ""}`}>
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header Section */}
      <div className="bg-white text-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <h1 className="text-3xl font-bold text-blue-600">{project?.title || "Project Title"}</h1>
        <p className="text-lg text-gray-600 mt-2">
          {project?.description || "No description available."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Project Properties */}
        <DetailCard
          title="Project Details"
          icon={<FileText className="h-5 w-5 text-blue-500" />}
        >
          <ul className="space-y-2 text-gray-600">
            <li>
              <strong>Code:</strong> {project.projectCode}
            </li>
            <li>
              <strong>Part:</strong> {project.part}
            </li>
            <li>
              <strong>Deadline:</strong> {formatDate(project.deadline)}
            </li>
            <li>
              <strong>Git Repository:</strong>{" "}
              {project.gitLink ? (
                <a
                  href={project.gitLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center"
                >
                  View Repository
                  <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              ) : (
                "No Git repository provided."
              )}
            </li>
          </ul>
        </DetailCard>

        {/* Special Notes Section */}
        <DetailCard
          title="Special Notes"
          icon={<FileText className="h-5 w-5 text-blue-500" />}
        >
          <p className="text-gray-600">
            {project.specialNotes || "No special notes available."}
          </p>
        </DetailCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Supervisor Section */}
        <DetailCard
        title="Supervisor"
        icon={<User className="h-5 w-5 text-blue-500" />}
      >
        <ul className="space-y-2">
          {supervisors.map((supervisor, index) => (
            <li key={index}>
              <strong>{supervisor.fullName || "Unknown Supervisor"}</strong>
              {supervisor.topics && supervisor.topics.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {supervisor.topics.map((topic, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </DetailCard>

        {/* Students Section */}
        <DetailCard
          title="Students"
          icon={<Users className="h-5 w-5 text-blue-500" />}
          expandable
        >
          <ul className="space-y-3">
            {Object.keys(project)
              .filter((key) => key.startsWith("Student")) // Filter keys that start with 'Student'
              .map((key, index) => {
                const student = project[key]; // Get the student object
                return (
                  <li
                    key={index}
                    className="p-3 bg-gray-50 rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center"
                  >
                    <div>
                      <p className="font-medium text-gray-800">{student?.fullName || "Unknown Student"}</p>
                      <p className="text-base text-gray-600">ID: {student?.ID || "N/A"}</p>
                    </div>
                    <p className="text-base text-gray-600 mt-2 sm:mt-0">
                      {student?.Email || "No email provided"}
                    </p>
                  </li>
                );
              })}
          </ul>
        </DetailCard>
      </div>

      <div className="mt-6">
        {/* Presentation Attendees Section */}
        <DetailCard
          title="Presentation Attendees"
          icon={<Calendar className="h-5 w-5 text-blue-500" />}
          expandable
        >
          {project.presentationAttendees && project.presentationAttendees.length > 0 ? (
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              {project.presentationAttendees.map((attendee, index) => (
                <li key={index}>{attendee}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">
              No attendees listed for the presentation.
            </p>
          )}
        </DetailCard>
      </div>
    </div>
  );
};

export default ProjectDetailsPage;
