const express = require('express');
const {
    uploadCsv,
    getCarrierByState,
    queryCsv,
    setIsLive,
    showCarriersByState
} = require('../controllers/csvController');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/upload', verifyToken, uploadCsv);
router.patch('/list/:id/live', verifyToken, setIsLive);
router.get('/get/carrier/state/:state', getCarrierByState);
router.get('/query', verifyToken, queryCsv);
module.exports = router;
