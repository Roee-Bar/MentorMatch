import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table } from "../../components/ui/Table";
import { formsApi } from "../../services/formAPI";
import LoadingScreen from "../../components/shared/LoadingScreen";

const AdminForms = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Tabs configuration
  const tabs = ["User Management", "Forms Management"];
  const [activeTab, setActiveTab] = useState("Forms Management");

  // Fetch forms on component mount
  useEffect(() => {
    const fetchForms = async () => {
      try {
        const fetchedForms = await formsApi.getAllForms();
        console.log("Fetched forms:", fetchedForms);
        setForms(fetchedForms);
      } catch (error) {
        console.error("Error fetching forms:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, []);

  // Navigate to the admin edit form page
  const handleRowClick = (form) => {
    navigate(
      `/admin-edit-forms/${form.formID}?formID=${form.formID}&source=admin`
    );
  };

  // Define columns for the table
  const columns = [
    { key: "formName", header: "Form Name", sortable: true },
    { key: "description", header: "Form Description", sortable: true },
  ];

  if (loading) {
    return <LoadingScreen isLoading={loading}  description="Looking for forms, please wait..."/>; 
  }

  return (
    <div className="relative bg-white min-h-screen">
      <div className="relative z-10">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center py-4">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  className={`inline-flex items-center px-3 pt-2 pb-3 border-b-2 text-base font-medium ${
                    activeTab === tab
                      ? "border-blue-900 text-blue-900"
                      : "border-transparent text-gray-500 hover:border-blue-900 hover:text-blue-900"
                  }`}
                  onClick={() => {
                    setActiveTab(tab);
                    if (tab === "User Management") {
                      navigate("/admin-management");
                    }
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {activeTab === "Forms Management" && (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Header Section */}
    <h1 className="text-2xl font-bold mb-4">Forms Management</h1>
    <p className="text-gray-600 mt-2">
      Manage and edit all forms in the system.
    </p>

    {/* Space between the description and the table */}
    <div className="mt-6">
        <div className="bg-white shadow rounded-lg p-6">
          <Table
            data={forms}
            columns={columns}
            onRowClick={handleRowClick}
            className="bg-white shadow rounded-lg"
            showTabs={false}
            showDescription={true}
            description="Click on a row to view or edit form details."
          />
        </div>
      
    </div>
  </div>
)}

    </div>
  );
};

export default AdminForms;
