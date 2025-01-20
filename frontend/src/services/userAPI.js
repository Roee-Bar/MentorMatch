import { api } from "./api"; // Import the shared API utilities

export const userApi = {
  /**
   * Add a new user to the database.
   * @param {object} userData - The user details (id, fullName, email, role, password, supervisorTopics).
   */
  addUser: async (userData) => {
    try {
      const response = await api.post("/users", userData);
      return response.data;
    } catch (error) {
      console.error("Error adding user:", error);
      throw error;
    }
  },

  /**
   * Fetch a user's details along with subcollections.
   * @param {string} userId - The ID of the user to fetch.
   */
  getUser: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}`);
      console.log("API Response for getUser:", response.data);
  
      // Ensure we check if the required data exists, fallback otherwise
      if (response.data && response.data.id && response.data.fullName) {
        return {
          fullName: response.data.fullName, // Correct extraction
          role: response.data.role,
          email: response.data.email || null,
          supervisorDetails: response.data.supervisorDetails || null,
          adminDetails: response.data.adminDetails || null,
        };
      } else {
        throw new Error(`User data is incomplete or missing for ID: ${userId}`);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      throw new Error(`Failed to fetch user with ID: ${userId}`);
    }
  },
  
};
