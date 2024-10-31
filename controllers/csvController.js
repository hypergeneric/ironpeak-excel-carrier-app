const multer = require('multer');
const csv = require('csv-parser');
const fastcsv = require('fast-csv');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const pool = require("./../helpers/pool");

let csvData = [];

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, 'file.' + file.originalname.split('.').pop()); // Save as file.<original_extension>
    }
});

const upload = multer({ storage });

const convertExcelToCsv = (filePath) => {
    const workbook = xlsx.readFile(filePath);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const csvOutput = xlsx.utils.sheet_to_csv(worksheet);

    const csvFilePath = path.join(__dirname, '../uploads', 'file.csv');
    fs.writeFileSync(csvFilePath, csvOutput);

    return csvFilePath;
};

const loadCsvData = () => {
    const filePath = path.join(__dirname, '../uploads', 'file.csv');
    return new Promise((resolve, reject) => {
        csvData = [];
        let isFirstRow = true;
        fs.createReadStream(filePath)
            .pipe(fastcsv.parse({ headers: false, skipEmptyLines: true }))
            .on('data', (row) => {
                if (isFirstRow) {
                    isFirstRow = false;
                    return; // Do not add the first row to csvData
                }
                csvData.push(row);
            })
            .on('end', () => {
                console.log('CSV file successfully processed');
                resolve(csvData);
            })
            .on('error', (error) => {
                console.error('Error reading CSV file:', error);
                reject(error);
            });
    });
};

exports.uploadCsv = [
    upload.single('file'),
    async (req, res) => {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const filePath = path.join(__dirname, '../uploads', req.file.filename);
        let csvFilePath = filePath;

        if (/\.(xlsx|xls)$/.test(req.file.originalname)) {
            csvFilePath = convertExcelToCsv(filePath);
        }

        try {
            await loadCsvData();

            const csvDataJson = JSON.stringify(csvData);
            const result = await pool.query(
                'INSERT INTO uploads (uploaded_user, uploaded_csv_data, uploaded_file_name) VALUES ($1, $2, $3) RETURNING *',
                [req.user.email, csvDataJson, req.file.originalname] // Save the filename or any reference you want
            );

            res.json({ message: 'File uploaded and processed', data: csvData, uploadedRecord: result.rows[0] });
        } catch (error) {
            console.error('Error processing file:', error);
            res.status(500).json({ message: 'Error processing file' });
        }
    }
];


exports.setIsLive = async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('UPDATE uploads SET is_live = FALSE WHERE id != $1', [id]);
        const result = await pool.query('UPDATE uploads SET is_live = TRUE WHERE id = $1 RETURNING *', [id]);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error updating is_live status:', error);
        res.status(500).json({ message: 'Error updating is_live status' });
    }
};

checkYesNo = (s) => {
    if (s.toUpperCase() === 'X') {
        return "yes";
    }
    return "no";
}

addDefault = (s) => {
    if (s) {
        return s;
    }
    return 'n/a';
}

exports.getCarrierByState = async (req, res) => {
    const { state } = req.params;
    const searchState = state.toUpperCase();

    const { id } = req.query;
    let parsedCsvData = null;
    try {
        let query;
        let params;

        if (id) {
            query = 'SELECT * FROM uploads WHERE id = $1';
            params = [id];
        } else {
            query = 'SELECT * FROM uploads WHERE is_live = TRUE';
            params = [];
        }

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No records found' });
        }

        const dbCsvData = result.rows[0].uploaded_csv_data;
        parsedCsvData = JSON.parse(dbCsvData);
    } catch (error) {
        console.error('Error fetching carrier data:', error);
        res.status(500).json({ message: 'Error fetching carrier data' });
    }


    let headerRow = parsedCsvData[0];
    const secondaryHeaderRow = Object.keys(parsedCsvData[1]);
    const stateColumnIndex = headerRow.findIndex(header => header && header.toUpperCase() === searchState);

    const imgColumnIndex = headerRow.findIndex(header => header && header.toUpperCase() === 'CARRIER LOGO');
    const urlColumnIndex = headerRow.findIndex(header => header && header.toUpperCase() === 'CARRIER LINK');

    if (stateColumnIndex === -1) {
        return res.status(404).json({ message: 'State column not found' });
    }

    const carrierPartnersIndexes = [];

    const clIndexes = [];
    const plIndexes = [];
    const slIndexes = [];


    headerRow.forEach((header, index) => {
        if (header === 'CARRIER PARTNERS') {
            carrierPartnersIndexes.push(index);
        }

        if (header === 'CL') {
            clIndexes.push(index);
        }

        if (header === 'PL') {
            plIndexes.push(index);
        }

        if (header === 'SL') {
            slIndexes.push(index);
        }





    });

    console.info("clIndexes", clIndexes);
    console.info("plIndexes", plIndexes);
    console.info("slIndexes", slIndexes);

    const closestCarrierIndex = Math.max(...carrierPartnersIndexes.filter(index => index < stateColumnIndex));
    const closestCLIndex = Math.max(...clIndexes.filter(index => index < stateColumnIndex));
    const closestPLIndex = Math.max(...plIndexes.filter(index => index < stateColumnIndex));
    const closestSLIndex = Math.max(...slIndexes.filter(index => index < stateColumnIndex));

    const matchingCarriers = [];

    for (let i = 1; i < parsedCsvData.length; i++) {
        const row = parsedCsvData[i];
        const rowValues = Object.values(row);

        if (rowValues[stateColumnIndex]) {
            const carrierName = rowValues[closestCarrierIndex] || 'Unknown Carrier';

            if ((carrierName.toUpperCase() == 'CARRIER PARTNERS') || (carrierName == 'Unknown Carrier')) {
                continue;
            }

            matchingCarriers.push({
                carrier: carrierName,
                cl: checkYesNo(rowValues[closestCLIndex]),
                pl: checkYesNo(rowValues[closestPLIndex]),
                sl: checkYesNo(rowValues[closestSLIndex]),
                img: addDefault(rowValues[imgColumnIndex]),
                url: addDefault(rowValues[urlColumnIndex]),
            });
        }
    }

    res.json(matchingCarriers);
};



exports.queryCsv = (req, res) => {
    const { key, value } = req.query;
    const result = csvData.filter(row => row[key] === value);
    res.json(result);
};
