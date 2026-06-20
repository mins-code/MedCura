const BASE_URL = 'http://127.0.0.1:8000/api';

export const extractPdf = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${BASE_URL}/analyze/extract`, {
    method: 'POST',
    body: formData,
    // Note: When using FormData, fetch automatically sets the correct Content-Type with the boundary
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw { response: { data: errorData } };
  }
  
  const data = await response.json();
  return { data };
};

export const predict = async (cbcData) => {
  const response = await fetch(`${BASE_URL}/analyze/manual`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(cbcData)
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw { response: { data: errorData } };
  }
  
  const data = await response.json();
  return { data };
};

export default {
  extractPdf,
  predict
};
