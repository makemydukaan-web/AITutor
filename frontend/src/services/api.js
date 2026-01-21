import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Books API
export const booksAPI = {
  getAll: (params) => 
    axios.get(`${API_URL}/books`, { params, headers: getAuthHeader() }),
  
  getById: (id) => 
    axios.get(`${API_URL}/books/${id}`, { headers: getAuthHeader() }),
  
  create: (data) => 
    axios.post(`${API_URL}/books`, data, { headers: getAuthHeader() })
};

// Videos API
export const videosAPI = {
  getAll: (params) => 
    axios.get(`${API_URL}/videos`, { params, headers: getAuthHeader() }),
  
  getById: (id) => 
    axios.get(`${API_URL}/videos/${id}`, { headers: getAuthHeader() }),
  
  create: (data) => 
    axios.post(`${API_URL}/videos`, data, { headers: getAuthHeader() })
};

// Quizzes API
export const quizzesAPI = {
  getAll: (params) => 
    axios.get(`${API_URL}/quizzes`, { params, headers: getAuthHeader() }),
  
  submit: (quizId, answers) => 
    axios.post(`${API_URL}/quizzes/${quizId}/attempt`, answers, { 
      headers: getAuthHeader() 
    })
};

// Chat API
export const chatAPI = {
  sendMessage: (data) => 
    axios.post(`${API_URL}/chat`, data, { headers: getAuthHeader() }),
  
  getSessions: () => 
    axios.get(`${API_URL}/chat/sessions`, { headers: getAuthHeader() }),
  
  getSession: (sessionId) => 
    axios.get(`${API_URL}/chat/sessions/${sessionId}`, { 
      headers: getAuthHeader() 
    })
};

// Progress API
export const progressAPI = {
  getAll: () => 
    axios.get(`${API_URL}/progress`, { headers: getAuthHeader() }),
  
  getBySubject: (subject) => 
    axios.get(`${API_URL}/progress/${subject}`, { headers: getAuthHeader() })
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => 
    axios.get(`${API_URL}/dashboard/stats`, { headers: getAuthHeader() })
};

// Metadata API
export const metadataAPI = {
  getSubjects: (params) => 
    axios.get(`${API_URL}/metadata/subjects`, { params }),
  
  getTopics: (subject, params) => 
    axios.get(`${API_URL}/metadata/topics`, { params: { subject, ...params } })
};
