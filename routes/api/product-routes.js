const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// Defining routes for the '/api/products' endpoint

// Get all products - Associated data: Category and Tag through ProductTag
router.get('/', async (req, res) => {
  // find all products
  try {
    const productData = await Product.findAll({
      include: [{ model: Category }, { model: Tag, through: ProductTag }]
    });
    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json({ message: 'Your request could not be processed - Internal Server Error!' })
  };
});

// Get product by id - Associated data: Category and Tag through ProductTag
router.get('/:id', async (req, res) => {
  try {
    const productData = await Product.findByPk(req.params.id, {
      include: [{ model: Category }, { model: Tag, through: ProductTag }]
    });
    if (!productData) {
      res.status(404).json({ message: `The product with id ${req.params.id} could not be found` });
      return;
    }
    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json({ message: "Your request could not be processed - Internal Server Error!" });
  };
});

// Create a new product
router.post('/', async (req, res) => {
  try {
    const newProduct = await Product.create(req.body);
    // One product can have many tags. If product has tags, create tags in ProductTag table
    if (req.body.tagIds.length) {
      const productTagIdArr = req.body.tagIds.map((tag_id) => {
        return {
          product_id: newProduct.id,
          tag_id,
        };
      });
      await ProductTag.bulkCreate(productTagIdArr);
    };

    const newTags = await ProductTag.findAll({
      where: { product_id: newProduct.id },
      raw: true,
      nest: true
    });

    res.status(200).json({ newProduct, newTags })
  } catch (err) {
    res.status(400).json({ message: 'Your request could not be processed - There has been an error, please try again' });
  };
});

// Update product by id - update associated data in ProductTag
router.put('/:id', async (req, res) => {
  try {
    await Product.update(req.body, { where: { id: req.params.id } })

    // Tags associated with the product to be updated
    const productTags = await ProductTag.findAll({
      where: { product_id: req.params.id }
    });

    // Tag IDs for the product to be updated from the database
    const productTagIDs = productTags.map(({ tag_id }) => tag_id);

    // Filter the request tag ids that does not exist in the product_tag table and return them as objects to be updated by mapping them
    const filterNewProductTags = req.body.tagIds
      .filter((tag_id) => !productTagIDs.includes(tag_id))
      .map((tag_id) => {
        return {
          product_id: req.params.id,
          tag_id,
        };
      });

    // Find the tag ids to be removed from the product_tag table 
    const filterProductTagsToRemove = productTags
      .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
      .map(({ id }) => id);

    // Delete the tags that are not included in the request and bulk create those from the request
    await Promise.all([
      ProductTag.destroy({ where: { id: filterProductTagsToRemove } }),
      ProductTag.bulkCreate(filterNewProductTags),
    ]);

    const newProductTags = await ProductTag.findAll({ where: { product_id: req.params.id } });
    const updatedProduct = await Product.findByPk(req.params.id, {
      include: [{ model: Category }, { model: Tag, through: ProductTag }]
    });

    res.status(200).json({ 'UPDATED PRODUCT': updatedProduct, 'TAGS': newProductTags });

  } catch (err) {
    res.status(400).json({ message: 'Your request could not be processed - There has been an error, please try again' });
  }
});

// Delete a product by id
router.delete('/:id', async (req, res) => {
  try {
    const productData = await Product.destroy(
      { where: { id: req.params.id } }
    );
    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json({ message: 'Your request could not be processed - There has been an error, please try again' });
  };
});

module.exports = router;