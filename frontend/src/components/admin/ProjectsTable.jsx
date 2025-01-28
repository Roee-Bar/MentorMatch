import React from "react";
import PropTypes from "prop-types";
import { Table } from "../ui/Table";
import { Card } from "../ui/Card";
import { Info } from "lucide-react";
import { MdDeleteForever } from "react-icons/md";
import SearchBar from "../shared/SearchBar";
import { useState } from "react";


const ProjectsTable = ({
  projects,
  activeTab,
  onEditField,
  onAddNote,
  onStudentClick,
  onDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const filteredProjects = projects.filter((project) => {
    return (
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.projectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.students.some((student) =>
        student.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  });

  const renderEditableCell = (
    value,
    row,
    field,
    fieldName,
    fieldType = "text",
    options = []
  ) => (
    <div className="group relative">
      <button
        onClick={() => onEditField(row, field, fieldName, fieldType, options)}
        className="w-full text-left hover:text-blue-600 text-blue-500 transition-colors group-hover:bg-gray-50 p-2 rounded"
        title={`Click to edit ${fieldName.toLowerCase()}`}
      >
        {value || "N/A"} {/* Fallback for missing values */}
      </button>
      <div className="hidden group-hover:block absolute right-0 top-1/2 transform -translate-y-1/2 mr-2">
        <Info className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );

  const renderSupervisorCell = (supervisor1, supervisor2) => (
    <div className="space-y-1">
      <div className="text-gray-700">{supervisor1 || "Unknown"}</div>
      {supervisor2 && <div className="text-gray-700">{supervisor2}</div>}
    </div>
  );

  const renderNonEditableCell = (value) => (
    <div className="text-gray-700">{value || "N/A"}</div>
  );

  const renderStudentCell = (students) => (
    <div className="space-y-1">
      {students && students.length > 0 ? (
        students.map((student, index) => (
          <div key={index} className="group relative">
            <button
              onClick={() => onStudentClick(student)}
              className="text-yellow-700 hover:text-yellow-900  transition-colors group-hover:bg-gray-50 p-2 rounded w-full text-left flex items-center"
            >
              <span>{student.fullName || "Unknown Student"}</span>
            </button>
          </div>
        ))
      ) : (
        <span>No Students</span>
      )}
    </div>
  );

  const projectColumns = [
    {
      key: "projectCode",
      header: "Project Code",
      sortable: true,
      render: (value) => renderNonEditableCell(value), // Non-editable
    },
    {
      key: "title",
      header: "Project Title",
      sortable: true,
      render: (value, row) =>
        renderEditableCell(value, row, "title", "Project Title"),
    },
    {
      key: "students",
      header: "Students",
      sortable: false,
      render: (_, row) => renderStudentCell(row.students || []),
    },
    {
      key: "supervisors",
      header: "Supervisors",
      sortable: false,
      render: (_, row) =>
        renderSupervisorCell(row.supervisor1, row.supervisor2), // Non-editable
    },
    {
      key: "part",
      header: "Part",
      sortable: true,
      render: (value) => renderNonEditableCell(value),
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      render: (value) => renderNonEditableCell(value),
    },
    {
      key: "deadline",
      header: "Deadline",
      sortable: true,
      render: (value, row) =>
        renderEditableCell(value, row, "deadline", "Deadline", "date"),
    },
    {
      key: "specialNotes",
      header: "Special Notes",
      sortable: false,
      render: (value, row) => (
        <button
          onClick={() => onAddNote(row)}
          className="text-blue-600 hover:text-blue-700"
        >
          {value || "Add note"}
        </button>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (value, row) => (
        <div className="flex space-x-2">
          <button
            className="text-red-600 hover:text-red-700"
            onClick={() => onDelete(row)}
            aria-label="Delete Project"
            title="Delete Project"
          >
            <MdDeleteForever />
          </button>
        </div>
      ),
    },
  ];

  if (!projects || projects.length === 0) {
    return (
      <Card className="p-6 ">
        <p className="text-gray-600 text-xl text-center">
          No projects available to display.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-2 text-green-600">
          <Info className="w-4 h-4" />
          <span className="text-base">
            Click on blue cells to edit them. Click on student name to see their
            details.
          </span>
        </div>

        <div className="w-64">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search Projects"
          />
        </div>
      </div>

      {/* Table Component */}
      <Table
        columns={projectColumns}
        data={filteredProjects}
        showTabs={false}
        showDescription={false}
        onRowClick={() => {}}
      />
    </Card>
  );
};

ProjectsTable.propTypes = {
  projects: PropTypes.array.isRequired,
  activeTab: PropTypes.string.isRequired,
  onEditField: PropTypes.func.isRequired,
  onAddNote: PropTypes.func.isRequired,
  onStudentClick: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default ProjectsTable;
