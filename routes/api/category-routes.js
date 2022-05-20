const router = require('express').Router();
const { Category, Product } = require('../../models');

// Defining routes for the '/api/categories' endpoint

// Get all categories - Associated data: Product
router.get('/', async (req, res) => {
  try {
    const categoryData = await Category.findAll({
      include: [{ model: Product }]
    });
    res.status(200).json(categoryData);
  } catch (err) {
    res.status(500).json({ message: "Your request could not be processed - Internal Server Error!" });
  }
});

// Get category by id - Associated data: Product
router.get('/:id', async (req, res) => {
  try {
    const categoryData = await Category.findByPk(req.params.id, {
      include: [{ model: Product }]
    })
    if (!categoryData) {
      res.status(404).json({ message: `The category with id ${req.params.id} could not be found` });
      return;
    }
    res.status(200).json(categoryData);
  } catch (err) {
    res.status(500).json({ message: "Your request could not be processed - Internal Server Error!" });
  }
});

// Create a new category
router.post('/', async (req, res) => {
  try {
    const categoryData = await Category.create(req.body);
    res.status(200).json(categoryData);
  } catch (err) {
    res.status(400).json({ message: 'Your request could not be processed - There has been an error, please try again' });
  };

});

// Update a category by id
router.put('/:id', async (req, res) => {
  try {
    const categoryData = await Category.update(
      { category_name: req.body.category_name },
      { where: { id: req.params.id } }
    );

    res.status(200).json(categoryData);
  } catch (err) {
    res.status(500).json({ message: 'Your request could not be processed - There has been an error, please try again' });
  }
});

// Delete a category by id
router.delete('/:id', async (req, res) => {
  try {
    const categoryData = await Category.destroy(
      { where: { id: req.params.id } }
    );
    res.status(200).json(categoryData);
  } catch (err) {
    res.status(500).json({ message: 'Your request could not be processed - There has been an error, please try again' });
  }
});

module.exports = router;
