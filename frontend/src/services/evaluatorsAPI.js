const isValidBraudeEmail = (email) => {
  const braudeEmailRegex = /^[^\s@]+@e\.braude\.ac\.il$/
  return braudeEmailRegex.test(email)
}

import { api } from "./api" // Import the shared API utilities

export const evaluatorsApi = {
  /**
   * Add or update an evaluator.
   */
  addOrUpdateEvaluator: async (data) => {
    try {
      // Validate the data object exists
      if (!data) {
        throw new Error("Data object is required")
      }

      // Validate email using the Braude format
      if (!data.email || !isValidBraudeEmail(data.email)) {
        throw new Error("Valid Braude email is required (@e.braude.ac.il)")
      }

      // Ensure all required fields are present
      const requiredFields = ["id", "email", "evaluatorID", "formID", "projectCode", "status"]
      const missingFields = requiredFields.filter((field) => !data[field])

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(", ")}`)
      }

      const response = await api.post("/evaluators", data)
      return response.data
    } catch (error) {
      console.error("Error adding/updating evaluator:", error)
      throw error
    }
  },

  /**
   * Get details of a specific evaluator by emailID.
   */
  getEvaluator: async (id) => {
    try {
      const response = await api.get(`/evaluators/${id}`)
      return response.data
    } catch (error) {
      console.error("Error fetching evaluator:", error)
      throw error
    }
  },

  /**
   * Get all evaluators.
   */
  getAllEvaluators: async () => {
    try {
      const response = await api.get("/evaluators")
      return response.data
    } catch (error) {
      console.error("Error fetching all evaluators:", error)
      throw error
    }
  },

  /**
   * Delete a specific evaluator by emailID.
   */
  deleteEvaluator: async (id) => {
    try {
      const response = await api.delete(`/evaluators/${id}`)
      return response.data
    } catch (error) {
      console.error("Error deleting evaluator:", error)
      throw error
    }
  },

  /**
   * Get all projects assigned to a particular evaluator by emailID.
   */
  getProjectsByEvaluator: async (evaluatorID) => {
    try {
      const response = await api.get(`/evaluators/projects/${evaluatorID}`)
      return response.data
    } catch (error) {
      console.error("Error fetching projects for evaluator:", error)
      throw error
    }
  },

  /**
   * Get all evaluators assigned to a specific project.
   */
  getEvaluatorsByProject: async (projectCode) => {
    try {
      const response = await api.get(`/evaluators/project/${projectCode}/evaluators`)
      return response.data
    } catch (error) {
      console.error("Error fetching evaluators for project:", error)
      throw error
    }
  },

  getProjectsForEvaluatorByForm: async (evaluatorID, formID) => {
    try {
      const response = await api.get(`/evaluators/${evaluatorID}/projects/${formID}`)
      return response.data
    } catch (error) {
      console.error("Error fetching projects for evaluator:", error.message)
      throw error
    }
  },
}

