export function createUploadController(imageUploadService) {
  return {
    async stationImage(req, res, next) {
      try {
        const saved = await imageUploadService.saveStationImage(req.file);
        console.log("qqqqqqqqqqqqqqqqqqqqqqqqqq", saved);
        res.status(201).json(saved);
      } catch (err) {
        next(err);
      }
    },
  };
}
