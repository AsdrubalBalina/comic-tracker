const express = require("express");

const {
  getAllComics,
  getComicById,
  createComic,
  updateComic,
  deleteComic,
  importComic,
  importComicsBatch,
} = require("../controllers/comicsController");

const router = express.Router();

router.get("/", getAllComics);
router.post("/import", importComic);
router.post("/import-batch", importComicsBatch);
router.get("/:id", getComicById);
router.post("/", createComic);
router.put("/:id", updateComic);
router.delete("/:id", deleteComic);

module.exports = router;