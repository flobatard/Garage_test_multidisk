const express = require('express');
const multer = require('multer');
const fs = require('fs');
const Minio = require('minio')
const url = require("url")

const app = express();
const port = 3000;

const minioClient = new Minio.Client({
    endPoint: 'localhost',
    port: 3900,
    useSSL: false,
    accessKey: "GK54876079934819b936700961",
    secretKey: "a662ae756e92fc96855d04bdbbf9c05dd60938e54ab0a016c3c737dbed06dd5b",
    region: 'gtm_test_garage'
})

// Configuration Multer pour lire le fichier
const upload = multer({ dest: 'uploads/' });

app.get('/buckets', async (req, res) => {
    try {
        const buckets = await minioClient.listBuckets()
        res.status(200).json(buckets)
    }
    catch (err) {
        console.error(err)
        res.status(500).json({})
    }
})

app.post('/new_bucket/:bucket', async (req, res) => {
    try {
        const bucket = req.params.bucket
        await minioClient.makeBucket(bucket, 'gtm_test_garage')
        console.log('Bucket created successfully in garage.')
        res.status(200).json({ message: "Done" })
    }
    catch (err) {
        console.error(err)
        res.status(500).json({})
    }
})

// Route d’upload
app.post('/upload/:bucket', upload.single('image'), async (req, res) => {
    const file = req.file;
    const bucket = req.params.bucket
    

    if (!file) {
        return res.status(400).send('Aucun fichier envoyé');
    }

    const fileContent = fs.readFileSync(file.path);

    const params = {
        Bucket: bucket,
        Key: `images/${file.originalname}`,
        Body: fileContent,
        ContentType: file.mimetype,
        ACL: 'public-read'
    };

    try {

        minioClient.fPutObject(bucket, `images/image/toto.png`, file.path, (err, objInfo) => {
            fs.unlinkSync(file.path); // Nettoyer fichier temporaire
            if (err) {
                console.error(err)
                res.status(500).send("Erreur d'upload")
            }
            console.log(objInfo)
            res.status(200).json(objInfo)
            return
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur d’upload');
    }
});

app.get('/list_bucket/:bucket', async (req, res) => {
    const bucket = req.params.bucket

    const parts = url.parse(req.url, true)
    const prefix = parts.query['prefix']

    try {
        const data = []
        const stream = minioClient.listObjects(bucket, prefix)
        stream.on('data', function (obj) {
            data.push(obj)
        })
        stream.on('end', function () {
            console.log(data)
            res.status(200).json(data)
        })
        stream.on('error', function (err) {
            console.log(err)
            res.status(500).json({})
        })


    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur d’upload');
    }
});

app.get('/presigned/:bucket/*path', async (req, res) => {
    const bucket = req.params.bucket
    const name = req.params.path.join('/')
    

    try {
        const data = []
        const url = await minioClient.presignedGetObject(bucket, name)
        res.status(200).json({url: url})


    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur d’upload');
    }
});

app.get('/s3/:bucket/*path', async (req, res) => {
    try {
        const bucket = req.params.bucket
        const name = req.params.path.join('/')
        const stream = await minioClient.getObject(bucket, name);
        stream.pipe(res)

    } catch (err) {
        console.error(err);
        if (err.code === "NoSuchBucket") return res.status(404).send(err.message)
        if (err.code === "NoSuchKey") return res.status(404).send(`${err.message} : ${err.resource}`)
        res.status(500).send("Unexpeced error")
    }
})

app.get('/s3_test/*path', (req, res) => {
    
    res.status(200).json()
})

app.listen(port, () => {
    console.log(`Serveur API écoute sur http://localhost:${port}`);
});