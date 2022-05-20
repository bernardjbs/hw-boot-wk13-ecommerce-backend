const router = require('express').Router();
const { Tag, Product, ProductTag } = require('../../models');

// Defining routes for the '/api/tags' endpoint

// Get all tags - Associated data: Product through ProductTag
router.get('/', async (req, res) => {
  try {
    const tagsData = await Tag.findAll({ include: [{ model: Product, through: ProductTag }] });
    res.status(200).json(tagsData)
  } catch (err) {
    res.status(500).json({ message: "Your request could not be processed - Internal Server Error!" });
  };
});

// Get tag by id - Associated data: Product through ProductTaf
router.get('/:id', async (req, res) => {
  try {
    const tagData = await Tag.findByPk(req.params.id, { include: [{ model: Product, through: ProductTag }] });
    res.status(200).json(tagData);
  } catch (err) {
    res.status(500).json({ message: "Your request could not be processed - Internal Server Error!" });
  };
});

// Create a new tag
router.post('/', async (req, res) => {
  try {
    const newTag = await Tag.create(req.body);
    // One tag can have many products. If tag has products, create products in ProductTag table
    if (req.body.productIds.length) {
      const productTagArr = req.body.productIds.map((product_id) => {
        return {
          product_id,
          tag_id: newTag.id
        };
      });
      await ProductTag.bulkCreate(productTagArr);
    }
    const newProducts = await ProductTag.findAll({
      where: { tag_id: newTag.id },
      raw: true,
      nest: true
    });
    res.status(200).json({ newTag, newProducts })
  } catch (err) {
    res.status(400).json({ message: 'Your request could not be processed - There has been an error, please try again' });
  };
});

// Update tag by id - update associated data in ProductTag
router.put('/:id', async (req, res) => {
  // update a tag's name by its `id` value
  try {
    await Tag.update(req.body, { where: { id: req.params.id } });

    // Products associated with the tag to be updated in product_tag table
    const productTags = await ProductTag.findAll({ where: { tag_id: req.params.id } });

    // Product IDs for the tag to be updated from the database
    const productIDs = productTags.map(({ product_id }) => product_id);

    // Filter the request product ids that does not exist in the product_tag table and return them as objects to be updated by mapping them
    const filterNewProductTags = req.body.productIds
      .filter((product_id) => !productIDs.includes(product_id))
      .map((product_id) => {
        return {
          product_id,
          tag_id: req.params.id
        };
      });

    // Find the product ids to be removed from the product_tag table 
    const filterProductTagsToRemove = productTags
      .filter(({ product_id }) => !req.body.productIds.includes(product_id))
      .map(({ id }) => id);

    // Delete the products that are not included in the request and bulk create those from the request
    await Promise.all([
      ProductTag.destroy({ where: { id: filterProductTagsToRemove } }),
      ProductTag.bulkCreate(filterNewProductTags),
    ]);
    
    const newProductTags = await ProductTag.findAll({ where: { tag_id: req.params.id } });
    const updatedTag = await Tag.findByPk(req.params.id, { include: [{ model: Product, through: ProductTag }] });

    res.status(200).json({ 'UPDATED TAG': updatedTag, 'TAGS': newProductTags });

  } catch (err) {
    res.status(500).json({ message: 'Your request could not be processed - There has been an error, please try again' });
  }
});

// Delete a tag by id
router.delete('/:id', async (req, res) => {
  try {
    const tagData = await Tag.destroy({
      where: { id: req.params.id }
    });

    res.status(200).json(tagData);
  } catch (err) {
    res.status(500).json({ message: 'Your request could not be processed - There has been an error, please try again' });
  }
});

module.exports = router;
