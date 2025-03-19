import axios from 'axios';


const API_URL = 'http://localhost:8034/api';


const api = {
  // Получение списка всех активов
  getAssets: async () => {
    const response = await axios.get(`${API_URL}/assets`);
    return response.data;
  },

  // Получение текущих арбитражных возможностей
  getOpportunities: async () => {
    const response = await axios.get(`${API_URL}/opportunities`);
    return response.data;
  },

  // Получение топ арбитражных возможностей
  getTopOpportunities: async (limit = 10) => {
    const response = await axios.get(`${API_URL}/top-opportunities?limit=${limit}`);
    return response.data;
  },

  // Получение исторических данных для актива
  getAssetHistory: async (symbol, period = 'day', exchanges = []) => {
    let url = `${API_URL}/history/${symbol}?period=${period}`;
    if (exchanges && exchanges.length > 0) {
      url += `&exchanges=${exchanges.join(',')}`;
    }
    const response = await axios.get(url);
    return response.data;
  },

  // Получение текущих ставок фандинга для актива
  getAssetRates: async (symbol) => {
    const response = await axios.get(`${API_URL}/rates/${symbol}`);
    return response.data;
  },

  // Получение метаданных актива
  getAssetMetadata: async (symbol) => {
    const response = await axios.get(`${API_URL}/metadata/${symbol}`);
    return response.data;
  },

  // Обновление данных
  updateData: async () => {
    const response = await axios.post(`${API_URL}/update`);
    return response.data;
  },

  getAllRates: async (symbol) => {
    const response = await axios.get(`${API_URL}/all-rates/${symbol}`);
    return response.data;
  },

};

export default api;