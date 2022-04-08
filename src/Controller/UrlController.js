const validUrl = require("valid-url");
const shortId = require("shortid");
const urlModel = require("../Model/UrlModel")
const redis = require("redis");
 const { promisify } = require("util");

//validation
const isValid = val => {
    if (typeof val === "undefined" || typeof val === null) return false;
    if (typeof val === "string" && val.trim().length === 0) return false;
    return true;
  };
  
  const isValidRequestBody = RequestBody => {
    return Object.keys(RequestBody).length > 0 ;
  };

  const isValidUrl =/http(s?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/

  
  
  //Connect to redis
  const redisClient =  redis.createClient(
    17563,
    "redis-17563.c212.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
  );
  redisClient.auth("17nPWW09kjp9TYlTo32XXDCYkVuVMeWG", function (err) {
    if (err) throw err;
  });
  
  redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
  });
  
  
  
  //1. connect to the server
  //2. use the commands :
  
  //Connection setup for redis
  
  const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
  const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);
  






const createUrl = async (req, res) => {
  try {

    // The API base Url endpoint
    const baseUrl = "http://localhost:3000";


    if (!validUrl.isUri(baseUrl)) {
      return res.status(400).json("Invalid Base Url");
    }

    if (!(isValidRequestBody(req.body))) {
      return res.status(400).send({
        status: false,
        message: "Invalid request parameters. Please provide url details",
      });
    }

    // destructure the longUrl from req.body.longUrl
    const { longUrl } = req.body;

    if (!(isValid(longUrl))) {
      return res.status(400).json({ status: false, msg: "longUrl is required" });
    }
    

    if (isValidUrl.test(longUrl) ){
      let cachedData = await GET_ASYNC(`${longUrl}`);  
      if (cachedData) {
          const data=JSON.parse(cachedData)
        return    res.status(200).send(data)
      }   
        
    let isUrlUsed = await urlModel.findOne({longUrl});
        if (isUrlUsed) {
       return   res.status(200).json({ status: true, msg: isUrlUsed, data:data });
        }
    }
    else {
      return  res.status(400).json({ status: false, msg: "invalid longurl" });
        }
      
    //if valid, we create the url code
    const urlCode = shortId.generate();


    //join the generated short code the the base url
    const shortUrl = baseUrl + "/" + urlCode.toLowerCase()
    await SET_ASYNC(`${longUrl}`, JSON.stringify({longUrl,shortUrl,urlCode}));


    let urlCreated = {
      longUrl,
      shortUrl,
      urlCode,
    };

    let savedData = await urlModel.create(urlCreated);
   // await SET_ASYNC(urlCode.toLowerCase(), longUrl)
    res.status(201).json({ status: true, msg: "URL created successfully", data: savedData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, msg: error.message });
  }
};




const getUrl = async (req, res) => {
  try {
    let urlCode = req.params.urlCode
    let cachedData = await GET_ASYNC(urlCode);
    //console.log(cachedData)
     if (cachedData) {
        let copy = JSON.parse(cachedData)
      
        return res.status(302).redirect(copy.longUrl);
        
      } 
    const url = await urlModel.findOne({ urlCode });
   // console.log(url)
    if (url) {
       await SET_ASYNC(`${urlCode}`,JSON.stringify(url))
     //  console.log("dataFromMongoDb")
      return res.status(302).redirect(url.longUrl);
    } else {
      return res.status(404).json({ status: false, msg: "URL not found" });
    }
  } catch (error) {
    res.status(500).json({ status: false, msg: error.message });
  }
};


module.exports.getUrl = getUrl;
module.exports.createUrl = createUrl