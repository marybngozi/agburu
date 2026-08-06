

export const getHome = async (req, res) => {
  res.json({
    message: "Welcome to Agburu",
    timestamp: new Date()
  });
};