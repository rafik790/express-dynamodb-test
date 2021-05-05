const headers= {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
};

const jwtVerify = require('../startup/decode-verify-jwt');
async function authorization(req,res,next){
    
    const token = req.header("Authorization");
    if(!token) {
        var error= {
            "message":"Access denied. No token provided."
        }
        let result = {error:error, isValid: false};
        return res.header(headers).status(401).json(result);
    }


    let claim={
        token:token
    };
    
    let result = await jwtVerify(claim);
    if(!result.isValid){
        return res.header(headers).status(400).json(result);
    }

    req.user = result.claim;
    next();
}
module.exports=authorization