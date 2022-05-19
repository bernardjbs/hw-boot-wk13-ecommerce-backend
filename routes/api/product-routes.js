const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// get all products
router.get('/', async (req, res) => {
  // find all products
  try {
    const productData = await Product.findAll({
      include: [{ model: Category, model: Tag }]
    });
    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json({ message: 'Your request could not be processed - Internal Server Error!' })
  }
});

// get one product
router.get('/:id', async (req, res) => {
  // find a single product by its `id`
  // be sure to include its associated Category and Tag data
  try {
    const productData = await Product.findByPk(req.params.id, {
      include: [{ model: Category }, { model: Tag }]
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

// create new product
router.post('/', async (req, res) => {
  try {
    const newProduct = await Product.create(req.body);

    if (req.body.tagIds.length) {
      const productTagIdArr = req.body.tagIds.map((tag_id) => {
        return {
          product_id: newProduct.id,
          tag_id,
        };
      });
      await ProductTag.bulkCreate(productTagIdArr);
    };

    const newTags = await ProductTag.findAll({where: {product_id: newProduct.id}, raw: true, nest: true});
    console.log(newTags);
    res.status(200).json({newProduct, newTags})
  } catch (err) {
    res.status(400).json({ message: 'Your request could not be processed - There has been an error, please try again' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    await Product.update(req.body, { where: { id: req.params.id } })

    const productTags = await ProductTag.findAll({ where: { product_id: req.params.id } });

    // Current tag_ids from Database
    const productTagIDs = productTags.map(({ tag_id }) => tag_id);

    // Create a new filtered list of the new tag ids if any
    const filterNewProductTags = req.body.tagIds
      .filter((tag_id) => !productTagIDs.includes(tag_id))
      .map((tag_id) => {
        return {
          product_id: req.params.id,
          tag_id,
        };
      });

    // Find the product_tag ids to remove 
    const filterProductTagsToRemove = productTags
      .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
      .map(({ id }) => id);

    await Promise.all([
      ProductTag.destroy({ where: { id: filterProductTagsToRemove } }),
      ProductTag.bulkCreate(filterNewProductTags),
    ]);

    const newProductTags = await ProductTag.findAll({ where: { product_id: req.params.id } });
    const updatedProduct = await Product.findAll({ where: { id: req.params.id } })

    res.status(200).json({ 'UPDATED PRODUCT': updatedProduct, 'TAGS': newProductTags });

  } catch (err) {
    res.status(400).json({ message: 'Your request could not be processed - There has been an error, please try again' });
  }
});

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