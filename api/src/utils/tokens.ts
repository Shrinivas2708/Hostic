import { NextFunction, Request, Response } from "express"
import jwt, { JwtPayload } from "jsonwebtoken"
const secret = process.env.JWT_SECRET!
export const createToken = (id:String)=>{
    try {
      const token =  jwt.sign({id:id},secret)
      return token

    } catch (error:any) {
        throw new Error(error)
    }
}
export const verifyToken = (req:Request,res:Response,next:NextFunction)=>{
  const authHeader = req.headers.authorization!
  if(!authHeader){
    res.status(401).json({
      message:"Token missing!"
    })
  }
  const token = authHeader.split(" ")[1]
  const decode = jwt.verify(token,secret) as JwtPayload
  console.log(decode)
  if(!decode){
    res.status(401).json({
      message:"Unauthorized!"
    })
  }
  req.id = decode.id
  next()
}