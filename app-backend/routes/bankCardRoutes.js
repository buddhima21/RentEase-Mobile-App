const express = require('express');
const router  = express.Router();
const {
  getCards,
  saveCard,
  updateCard,
  deleteCard,
} = require('../controllers/bankCardController');

router.get('/:ownerId', getCards);
router.post('/',         saveCard);
router.put('/:id',       updateCard);
router.delete('/:id',    deleteCard);

module.exports = router;
