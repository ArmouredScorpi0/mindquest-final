const fetch = require('node-fetch');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  const { prompt } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!prompt || !apiKey) {
    return res.status(400).json({ message: 'Missing prompt or API key.' });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2-5-flash-preview-05-20:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    if (!response.ok) {
      throw new Error(`API request failed`);
    }
    const result = await response.json();
    res.status(200).json({ result });

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({ message: 'Failed to generate AI content.' });
  }
};