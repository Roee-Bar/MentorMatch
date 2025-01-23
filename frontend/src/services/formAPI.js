import { api } from "./api"; // Import the shared API utilities

export const formsApi = {
  /**
   * Get a specific form by ID.
   */
  getForm: async (formID) => {
    try {
      const response = await api.get(`/forms/${formID}`)
      return response
    } catch (error) {
      console.error("Error fetching form:", error)
      throw error
    }
  },
  /**
   * Fetch all forms from the database.
   */
  getAllForms: async () => {
    try {
      const response = await api.get(`/forms`); // Call the backend endpoint
      return response; // Return the forms data
    } catch (error) {
      console.error("Error fetching all forms:", error.message);
      throw error; // Rethrow the error to handle it in calling code
    }
  },

  /**
   * Update a specific form by ID.
   */
  updateForm: async (formID, updatedData) => {
    try {
      const response = await api.put(`/forms/${formID}`, updatedData)
      return response
    } catch (error) {
      console.error("Error updating form:", error)
      throw error
    }
  },

  /**
   * Get all questions for a specific form.
   */
  getQuestions: async (formID) => {
    try {
      const response = await api.get(`/forms/${formID}/questions`)
      console.log("Questions response:", response) // Debug log
      return response
    } catch (error) {
      console.error("Error fetching questions:", error)
      throw error
    }
  },

  /**
   * Add a new question to a specific form.
   */
  addQuestion: async (formID, questionData) => {
    try {
      const response = await api.post(`/forms/${formID}/questions`, questionData);
      return response;
    } catch (error) {
      console.error("Error adding question:", error.message);
      throw error;
    }
  },
  

  /**
   * Update a specific question in a form.
   */
  updateQuestion: async (formID, questionId, updatedData) => {
    try {
      const response = await api.put(`/forms/${formID}/questions/${questionId}`, updatedData)
      return response
    } catch (error) {
      console.error("Error updating question:", error)
      throw error
    }
  },

  /**
   * Delete a specific question from a form.
   */
  deleteQuestion: async (formID, questionId) => {
    try {
      const response = await api.delete(`/forms/${formID}/questions/${questionId}`)
      return response
    } catch (error) {
      console.error("Error deleting question:", error)
      throw error
    }
  },

  /**
   * Submit a form with the given data.
   * @param {string} formID - The ID of the form to submit.
   * @param {object} formData - The data to submit for the form.
   */
  submitForm: async (formID, formData) => {
    try {
      const response = await api.post(`/forms/${formID}/submit`, formData)
      return response
    } catch (error) {
      console.error("Error submitting form:", error)
      throw error
    }
  },

  /**
   * Fetch all responses for a specific form.
   */
  getResponses: async (formID) => {
    try {
      const response = await api.get(`/forms/${formID}/responses`)
      return response
    } catch (error) {
      console.error("Error fetching responses:", error)
      throw error
    }
  },

  /**
   * Fetch the last response for a specific evaluator and optionally for a specific student.
   * @param {string} formID - The form ID.
   * @param {string} evaluatorID - The evaluator's ID.
   * @param {string} [studentID] - The student's ID (optional).
   */
  getLastResponse: async (formID, evaluatorID, projectCode) => {
    if (!formID || !evaluatorID || !projectCode) {
      throw new Error("Form ID, Evaluator ID, and Project Code are required.");
    }
    
    try {
      const url = `/forms/${formID}/last-response`;
      console.log("Sending GET request with params:", { evaluatorID, projectCode }); // Debugging
      const response = await api.get(
        `/forms/${formID}/last-response?evaluatorID=${evaluatorID}&projectCode=${projectCode}`
      );
      console.log("API Response:", response); // Log the raw response
      return response.data || response; // Adjust if the data is nested
    } catch (error) {
      console.error("Error fetching the last response:", error.message);
      throw error;
    }
  },
  
  

  /**
   * Update a specific response in a form.
   */
  // updateResponse: async (formID, responseId, updatedData) => {
  //   return await api.put(`/forms/${formID}/responses/${responseId}`, updatedData);
  // },

  /**
   * Delete a specific response from a form.
   */
  deleteResponse: async (formID, responseId) => {
    try {
      const response = await api.delete(`/forms/${formID}/responses/${responseId}`)
      return response
    } catch (error) {
      console.error("Error deleting response:", error)
      throw error
    }
  },
  /**
   * Fetch all evaluations for a specific form.
   */
  getEvaluations: async (formID) => {
    try {
      const response = await api.get(`/forms/${formID}/evaluations`)
      return response
    } catch (error) {
      console.error("Error fetching evaluations:", error)
      throw error
    }
  },

  /**
   * Update a specific evaluation in a form.
   */
  updateEvaluation: async (formID, evaluationId, updatedData) => {
    try {
      const response = await api.put(`/forms/${formID}/evaluations/${evaluationId}`, updatedData)
      return response
    } catch (error) {
      console.error("Error updating evaluation:", error)
      throw error
    }
  },

  /**
   * Delete a specific evaluation from a form.
   */
  deleteEvaluation: async (formID, evaluationId) => {
    try {
      const response = await api.delete(`/forms/${formID}/evaluations/${evaluationId}`)
      return response
    } catch (error) {
      console.error("Error deleting evaluation:", error)
      throw error
    }
  },

  /**
   * Fetch evaluations for a specific evaluator.
   */
  getEvaluationsByEvaluator: async (evaluatorID) => {
    if (!evaluatorID) {
        console.error("Evaluator ID is missing in the API call.");
        throw new Error("Evaluator ID is required.");
    }

    try {
      console.log("Fetching evaluations by evaluatorID:", evaluatorID);
      const response = await api.get(`/forms/evaluations/all?evaluatorID=${evaluatorID}`);
      console.log("API Response (formAPI):", response); // Log the raw response
      
      return response || []; // Return the data or an empty array
    } catch (error) {
        console.error("Error fetching evaluations by evaluator:", error);
        throw error; // Re-throw to handle in calling code
    }
},


  /**
   * Add a new evaluation for a specific form.
   */
  addEvaluation: async (formID, evaluationData) => {
    try {
      const response = await api.post(`/forms/${formID}/evaluations`, evaluationData);
      return response.data;
    } catch (error) {
      console.error("Error adding evaluation:", error.response?.data || error.message);
      throw error;
    }
  },


   
};
