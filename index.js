const express = require('express');
const multer = require('multer');
const fs = require('fs');
const Minio = require('minio')

const app = express();
const port = 3000;

const minioClient = new Minio.Client({
    endPoint: 'localhost',
    port: 3900,
    useSSL: false,
    accessKey: "GKe383543d5326dacc15797540",
    secretKey: "0c8c3ecb536dc7b2d22894da8c42225f3cf8c8f6551c05929340f97e6ee1dd4f",
    region: 'gtm_test_garage'
})

// Configuration Multer pour lire le fichier
const upload = multer({ dest: 'uploads/' });

app.get('/buckets', async (req, res) => {
    try{
        const buckets = await minioClient.listBuckets()
        res.status(200).json(buckets)
    }
    catch(err)
    {
        console.error(err)
        res.status(500).json({})
    }
})

app.post('/new_bucket', async (req, res) => {
    try{
        await minioClient.makeBucket('test-2', 'gtm_test_garage')
        console.log('Bucket created successfully in garage.')
        res.status(200).json({message: "Done"})
    }
    catch(err)
    {
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
    minioClient.listObjects('test')
    
    minioClient.fPutObject(bucket, `${file.originalname}_2`, file.path, (err, objInfo) => {
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

// Route d’upload
app.get('/list_bucket/:bucket', async (req, res) => {
    const bucket = req.params.bucket
  
    try {
        const data = []
        const stream = minioClient.listObjects(bucket)
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

app.listen(port, () => {
  console.log(`Serveur API écoute sur http://localhost:${port}`);
});